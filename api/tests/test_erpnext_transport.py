import json
import urllib.error
from decimal import Decimal
from io import BytesIO

import pytest

from percontra.adapters.destination.erpnext import SITE, Connection, ERPError, ERPNextAdapter


def test_decimal_readback_document_can_be_submitted_without_float_conversion(monkeypatch):
    requests = []

    class Opener:
        def open(self, request, timeout):
            requests.append(request)
            return BytesIO(b'{"message":{"docstatus":1,"total_debit":127.19}}')

    monkeypatch.setattr("urllib.request.build_opener", lambda *args: Opener())
    adapter = ERPNextAdapter(Connection(SITE, "fixture-key", "fixture-secret", live=True))
    response = adapter.request(
        "POST", "/api/method/frappe.client.submit", body={"doc": {"total_debit": Decimal("127.19")}}
    )
    assert json.loads(requests[0].data)["doc"]["total_debit"] == "127.19"
    assert response["message"]["total_debit"] == Decimal("127.19")
    assert "fixture-secret" not in repr(adapter.connection)


@pytest.mark.parametrize("status,uncertain", [(403, False), (429, False), (500, True)])
def test_http_failures_are_sanitized_and_classified(monkeypatch, status, uncertain):
    class Opener:
        def open(self, request, timeout):
            raise urllib.error.HTTPError(
                request.full_url, status, "fixture-secret in untrusted error", {}, None
            )

    monkeypatch.setattr("urllib.request.build_opener", lambda *args: Opener())
    adapter = ERPNextAdapter(Connection(SITE, "fixture-key", "fixture-secret", live=True))
    with pytest.raises(ERPError) as failure:
        adapter.request("POST", "/api/resource/Journal Entry", body={})
    assert failure.value.uncertain is uncertain
    assert "fixture-secret" not in str(failure.value)


def test_wrong_site_is_rejected_before_network(monkeypatch):
    calls = []
    monkeypatch.setattr("urllib.request.build_opener", lambda *args: calls.append(args))
    adapter = ERPNextAdapter(Connection("https://unapproved.example", "fixture", "fixture", True))
    with pytest.raises(ERPError, match="authorised ERPNext site"):
        adapter.request("GET", "/api/resource/Company")
    assert calls == []
