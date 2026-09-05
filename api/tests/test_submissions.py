import json
from decimal import Decimal

import pytest

from percontra import submissions
from percontra.adapters.base import ExportArtifact
from percontra.adapters.destination.erpnext import COMPANY, ERPError, ERPNextAdapter
from percontra.example import load_example
from percontra.service import MigrationService


class FixtureERP(ERPNextAdapter):
    def __init__(self, *, timeout=False):
        self.currency = "USD"
        self.writes = []
        self.document = None
        self.timeout = timeout

    def render(self, *, postings):
        return ExportArtifact(
            json.dumps(
                {
                    "company": COMPANY,
                    "posting_date": "2026-06-30",
                    "voucher_type": "Journal Entry",
                    "user_remark": "Public unit test, never transmitted",
                    "accounts": [
                        {
                            "account": "Fixture cash",
                            "debit_in_account_currency": "125.50",
                            "credit_in_account_currency": "0.00",
                            "exchange_rate": 1,
                            "account_currency": "USD",
                        },
                        {
                            "account": "Fixture income",
                            "debit_in_account_currency": "0.00",
                            "credit_in_account_currency": "125.50",
                            "exchange_rate": 1,
                            "account_currency": "USD",
                        },
                    ],
                }
            ).encode(),
            "fixture.json",
            "application/json",
        )

    def request(self, method, route, *, body=None, params=None):
        if method == "GET":
            return {"data": self.document}
        self.writes.append(route)
        if route == "/api/resource/Journal Entry":
            self.document = {**body, "name": "FIXTURE-JV", "docstatus": 0}
            if self.timeout:
                raise ERPError("Simulated lost response", uncertain=True)
            return {"data": self.document}
        self.document["docstatus"] = 1
        return {"message": self.document}

    def records(self, doctype, fields, filters):
        if doctype == "Journal Entry":
            return [{"name": "FIXTURE-JV", "company": COMPANY}]
        return [
            {
                "account": row["account"],
                "company": COMPANY,
                "account_currency": "USD",
                "is_cancelled": 0,
                "debit": Decimal(row["debit_in_account_currency"]),
                "credit": Decimal(row["credit_in_account_currency"]),
            }
            for row in self.document["accounts"]
        ]


@pytest.fixture
def approved(tmp_path):
    service = MigrationService(tmp_path / "migration.duckdb")
    load_example(service)
    batch = next(
        key
        for key, rows in service.batches().items()
        if rows[0].batch_key.source_batch_id == "public-clean"
    )
    service.approve(batch, "Unit test reviewer")
    return service, batch


def test_double_click_and_restart_do_not_post_twice(approved, monkeypatch):
    service, batch = approved
    destination = FixtureERP()
    monkeypatch.setattr(submissions, "adapter", lambda *args: destination)
    receipt = submissions.submit(service, batch, "click-one")
    assert receipt["state"] == "verified"
    restarted = MigrationService(service.store.path)
    assert submissions.submit(restarted, batch, "click-one") == receipt
    with pytest.raises(ValueError, match="already has a submission"):
        submissions.submit(restarted, batch, "click-two")
    assert len(destination.writes) == 2
    assert len(service.store.events("submission")) == 4


def test_lost_create_response_recovers_draft_without_reposting(approved, monkeypatch):
    service, batch = approved
    destination = FixtureERP(timeout=True)
    monkeypatch.setattr(submissions, "adapter", lambda *args: destination)
    receipt = submissions.submit(service, batch, "uncertain-click")
    assert receipt["state"] == "unknown"
    assert submissions.submit(service, batch, "uncertain-click")["state"] == "unknown"
    checked = submissions.verify(service, receipt["submission_id"])
    assert checked["state"] == "draft_saved"
    assert checked["verified_at"] is None
    assert len(destination.writes) == 1


def test_changed_destination_is_never_reported_verified(approved, monkeypatch):
    service, batch = approved
    destination = FixtureERP()
    monkeypatch.setattr(submissions, "adapter", lambda *args: destination)
    receipt = submissions.submit(service, batch, "drift-click")
    destination.document["accounts"][0]["exchange_rate"] = 2
    checked = submissions.verify(service, receipt["submission_id"])
    assert checked["state"] == "drifted"
    assert len(destination.writes) == 2


def test_switching_run_preserves_its_history(approved):
    service, batch = approved
    identifier, payload = service.store.run()
    changed = {**payload, "label": "Another migration"}
    service.store.save_run("another-run", changed)
    service.store.save_run(identifier, payload)
    assert service.store.run()[0] == identifier
    assert service.release_for(batch, service.batch(batch)).state == "approved"
