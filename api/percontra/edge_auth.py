"""Reject anything that did not arrive through the Cloudflare Worker.

Cloud Run publishes a URL of its own, and it is deterministic from the service
name, project number and region, so it is neither secret nor hideable: the edge
gate in `edge/proxy.ts` guards `percontra.dev` and does nothing for the
`run.app` hostname. Without this, the basic-auth prompt is one line of the
public repo away from being irrelevant.

The header is a shared secret the Worker adds and nobody else can guess, which
is the standard shape for "the origin trusts only the edge". It is not a
substitute for the edge gate; it is what makes the edge gate the only door.

An unset secret disables the check, because local development and `just demo`
have no Worker in front of them. A secret that is set but blank fails closed and
says so: that distinction is not pedantry, it is the exact bug that put this
site online with an empty password.
"""

import hmac
import os
from collections.abc import Callable

from django.http import HttpRequest, HttpResponse, JsonResponse

HEADER = "HTTP_X_EDGE_AUTH"


def _expected() -> str | None:
    return os.environ.get("PERCONTRA_EDGE_TOKEN")


class EdgeAuthMiddleware:
    """Allow only requests carrying the edge's shared token."""

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        expected = _expected()

        if expected is None:
            return self.get_response(request)

        if not expected.strip():
            return JsonResponse(
                {"detail": "PERCONTRA_EDGE_TOKEN is set but empty."},
                status=503,
            )

        presented = request.META.get(HEADER, "")
        # compare_digest, not ==: a plain comparison leaks the shared secret's
        # prefix through timing, and the token is long-lived.
        if not hmac.compare_digest(presented, expected.strip()):
            return JsonResponse(
                {"detail": "Not reachable directly; use the published address."},
                status=403,
            )

        return self.get_response(request)
