import hashlib
from pathlib import Path

import orjson
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_http_methods
from pydantic import ValidationError

from . import submissions
from .adapters.base import UploadedFile
from .adapters.destination.erpnext import ERPError, ERPNextAdapter
from .adapters.registry import catalog
from .erpnext_smoke import SMOKE_DB
from .service import LOCK, ROOT, MigrationService

# The page a reviewer opens first leads with what needs a human. Sorting here
# rather than in the browser keeps the order true across pages, since the
# client only ever holds one page. `sorted` is stable, so source order survives
# within a rank.
ATTENTION_RANK = {"stale": 0, "blocked": 1, "needs_decision": 2, "ready": 3}


def service():
    return MigrationService(settings.MIGRATION_DB)


def response_error(error, status=400):
    return JsonResponse(
        {
            "type": "about:blank",
            "title": "Request could not be completed",
            "status": status,
            "detail": str(error),
        },
        status=status,
        content_type="application/problem+json",
    )


def operator(request):
    if request.META.get("REMOTE_ADDR") not in ("127.0.0.1", "::1"):
        raise ValueError("Mutations are available only in the local operator instance")
    if request.get_host().split(":")[0] not in ("localhost", "127.0.0.1", "testserver"):
        raise ValueError("Use the local operator hostname")


@csrf_protect
@require_http_methods(["GET", "POST"])
def endpoint(request, resource, identifier=None, action=None):
    try:
        body = {}
        if request.method == "POST":
            operator(request)
            if request.content_type == "application/json":
                body = orjson.loads(request.body)
                if not isinstance(body, dict):
                    raise ValueError("JSON request body must be an object")
        with LOCK:
            current = service()
            if resource == "csrf" and request.method == "GET":
                return JsonResponse({"token": get_token(request)})
            if resource == "adapters" and request.method == "GET":
                return JsonResponse({"adapters": catalog()})
            if resource == "overview" and request.method == "GET":
                return JsonResponse(current.overview())
            if resource == "upload" and request.method == "POST":
                files = []
                for role in ("gl", "reference"):
                    uploaded = request.FILES.get(role)
                    if uploaded:
                        if uploaded.size > 40 * 1024 * 1024:
                            raise ValueError("Each workbook must be smaller than 40 MB")
                        content = uploaded.read()
                        folder = ROOT / "data/uploads" / hashlib.sha256(content).hexdigest()
                        folder.mkdir(parents=True, exist_ok=True)
                        path = folder / Path(uploaded.name).name
                        if not path.exists():
                            path.write_bytes(content)
                        files.append(UploadedFile(path, role))
                return JsonResponse(current.load(files or None))
            if resource == "example" and request.method == "POST":
                from .example import load_example

                return JsonResponse(load_example(current))
            if resource == "postings" and request.method == "GET":
                if identifier:
                    return JsonResponse(current.evidence(identifier))
                rows = (
                    current.batch(request.GET["batch"])
                    if request.GET.get("batch")
                    else current.postings()
                )
                status = request.GET.get("status")
                if status:
                    rows = [row for row in rows if row.status == status]
                offset = max(0, int(request.GET.get("offset", 0)))
                limit = max(1, min(200, int(request.GET.get("limit", 50))))
                rows = sorted(rows, key=lambda row: ATTENTION_RANK[row.status])
                return JsonResponse(
                    {
                        "total": len(rows),
                        "items": [
                            row.model_dump(mode="json") for row in rows[offset : offset + limit]
                        ],
                    }
                )
            if resource == "targets" and request.method == "GET":
                _, _, handle, _ = current.context()
                query = request.GET.get("q", "").lower()
                rows = [
                    row
                    for row in handle.registries["Corvus CoA"]
                    if query in (row.values["Trans_Type"] + " " + row.values["GL_Account"]).lower()
                    and row.values.get("Account_Type") == "Expenses"
                ]
                return JsonResponse(
                    {
                        "items": [
                            {
                                "row": row.source.physical_row,
                                "account": row.values["GL_Account"],
                                "trans_type": row.values["Trans_Type"],
                            }
                            for row in rows[:200]
                        ]
                    }
                )
            if resource == "decisions":
                if request.method == "GET":
                    return JsonResponse({"items": current.overview().get("gaps", [])})
                return JsonResponse(
                    current.decide(
                        int(body["gap_row"]),
                        int(body["target_row"]),
                        body["author"],
                        body["reason"],
                    )
                )
            if resource == "releases":
                if request.method == "GET":
                    return JsonResponse({"items": current.overview().get("batches", [])})
                return JsonResponse(current.approve(identifier, body["author"]))
            if resource == "exports" and request.method == "POST":
                artifact, record = current.export(body["batch"])
                response = HttpResponse(artifact.content, content_type=artifact.media_type)
                response["Content-Disposition"] = f'attachment; filename="{artifact.filename}"'
                response["X-Export-Id"] = record.export_id
                response["X-Export-Status"] = artifact.label
                return response
            if resource == "compare" and request.method == "GET":
                return JsonResponse(current.compare(request.GET["batch"]))
            if resource == "erpnext":
                if action == "smoke":
                    if not SMOKE_DB.exists():
                        return JsonResponse(
                            {"label": "GBP connectivity test has not been run", "items": []}
                        )
                    smoke = MigrationService(SMOKE_DB)
                    attempts = submissions.latest(smoke)
                    if request.method == "POST":
                        if not attempts:
                            raise ValueError("No GBP test receipt is available to verify")
                        return JsonResponse(submissions.verify(smoke, attempts[-1]["id"]))
                    return JsonResponse(
                        {
                            "label": "Synthetic GBP connectivity test, not dataset 02",
                            "items": [row["receipt"] for row in attempts],
                        }
                    )
                if request.method == "GET":
                    try:
                        return JsonResponse(
                            ERPNextAdapter(currency=request.GET.get("currency", "USD")).preflight()
                        )
                    except ERPError as error:
                        return JsonResponse({"configured": False, "problems": [str(error)]})
                destination = submissions.adapter(current)
                postings = current.approved(body["batch"])
                if action == "preview":
                    return JsonResponse(
                        {"accounts": destination.provisioning(postings, destination.preflight())}
                    )
                if action == "provision":
                    return JsonResponse({"accounts": destination.provision(postings)})
            if resource == "submissions":
                if request.method == "GET":
                    return JsonResponse(
                        {"items": [row["receipt"] for row in submissions.latest(current)]}
                    )
                if action == "verify":
                    return JsonResponse(submissions.verify(current, identifier))
                if action is not None:
                    raise ValueError("Unknown submission action")
                if body.get("confirm_company") != "Chalbury Co-Invest L.P.":
                    raise ValueError("Confirm the target company before posting")
                return JsonResponse(
                    submissions.submit(
                        current, body["batch"], request.headers.get("Idempotency-Key")
                    )
                )
        return response_error("Unknown operation", 404)
    except (ValueError, KeyError, FileNotFoundError, ERPError, ValidationError) as error:
        return response_error(error)
