import hashlib
from datetime import UTC, datetime
from uuid import uuid4

import orjson

from percontra.contract import Receipt

from .adapters.destination.erpnext import COMPANY, DestinationDriftError, ERPError, ERPNextAdapter
from .core.generate import digest
from .core.release import snapshot
from .service import LOCK


def adapter(service, run_id=None):
    _, payload, handle, _ = service.context(run_id)
    return ERPNextAdapter(
        chart=handle.registries["Corvus CoA"], currency=payload.get("destination_currency", "USD")
    )


def latest(service):
    attempts = {}
    for event in service.store.events("submission"):
        attempts[event["id"]] = event
    return list(attempts.values())


def record(service, attempt, state, detail, response=None):
    receipt = Receipt(
        submission_id=attempt["id"],
        company=COMPANY,
        state=state,
        doc_names=[attempt["doc_name"]] if attempt.get("doc_name") else [],
        artifact_digest=attempt["artifact_digest"],
        response_digest=digest(response) if response else None,
        verified_at=datetime.now(UTC).isoformat() if state == "verified" else None,
        posted_at=None,
        detail=detail,
    )
    attempt = {**attempt, "receipt": receipt.model_dump(mode="json")}
    service.store.append("submission", attempt["run_id"], attempt)
    return attempt


def submit(service, batch, idempotency_key):
    if not idempotency_key or len(idempotency_key) > 128:
        raise ValueError("An idempotency key of at most 128 characters is required")
    with LOCK:
        current_run = service.context()[0]
        for prior in latest(service):
            if prior["idempotency_key"] == idempotency_key:
                if prior["batch"] != batch or prior["run_id"] != current_run:
                    raise ValueError(
                        "Idempotency key already belongs to another batch or migration"
                    )
                if snapshot(service.approved(batch)) != prior["approval_digest"]:
                    raise ValueError(
                        "This key belongs to an older approval; verify its receipt, do not repost"
                    )
                return prior["receipt"]
            if prior["batch"] == batch and prior["receipt"]["state"] != "rejected":
                raise ValueError(
                    "This batch already has a submission; verify its receipt instead of reposting"
                )
        postings = service.approved(batch)
        destination = adapter(service)
        artifact = destination.render(postings=postings)
        run_id, _, _, _ = service.context()
        identifier = str(uuid4())
        document = orjson.loads(artifact.content)
        document["user_remark"] += "; attempt " + identifier
        attempt = {
            "id": identifier,
            "run_id": run_id,
            "batch": batch,
            "idempotency_key": idempotency_key,
            "approval_digest": snapshot(postings),
            "artifact_digest": hashlib.sha256(artifact.content).hexdigest(),
            "document": document,
            "doc_name": None,
        }
        attempt = record(
            service, attempt, "prepared", "Approved artifact persisted before network write"
        )
        try:
            service.approved(batch)
            saved = destination.request("POST", "/api/resource/Journal Entry", body=document)[
                "data"
            ]
            attempt["doc_name"] = saved["name"]
            attempt = record(
                service, attempt, "draft_saved", "Draft saved; nothing posted to the ledger", saved
            )
            stored = destination.request("GET", "/api/resource/Journal Entry/" + saved["name"])[
                "data"
            ]
            destination.verify_document(document, stored)
            if snapshot(service.approved(batch)) != attempt["approval_digest"]:
                raise ERPError("Approval changed before submission")
            submitted = destination.request(
                "POST", "/api/method/frappe.client.submit", body={"doc": stored}
            )["message"]
            attempt = record(
                service, attempt, "submitted", "Submitted; ledger verification pending", submitted
            )
            return verify(service, identifier)
        except ERPError as error:
            state = "unknown" if error.uncertain or attempt.get("doc_name") else "rejected"
            return record(service, attempt, state, str(error))["receipt"]


def verify(service, identifier):
    with LOCK:
        attempt = next((item for item in latest(service) if item["id"] == identifier), None)
        if attempt is None:
            raise ValueError("Submission not found")
        destination = adapter(service, attempt["run_id"])
        try:
            if not attempt.get("doc_name"):
                matches = destination.records(
                    "Journal Entry",
                    ["name", "company"],
                    [
                        ["company", "=", COMPANY],
                        ["user_remark", "like", "%attempt " + identifier + "%"],
                    ],
                )
                if len(matches) != 1:
                    return record(
                        service,
                        attempt,
                        "unknown",
                        "No unique destination record found; no write retried",
                    )["receipt"]
                attempt["doc_name"] = matches[0]["name"]
            document = destination.request(
                "GET", "/api/resource/Journal Entry/" + attempt["doc_name"]
            )["data"]
            destination.verify_document(attempt["document"], document)
            if document["docstatus"] == 0:
                return record(
                    service,
                    attempt,
                    "draft_saved",
                    "Destination draft exists; no ledger posting claimed",
                    document,
                )["receipt"]
            if document["docstatus"] != 1:
                return record(
                    service,
                    attempt,
                    "drifted",
                    "Destination journal is cancelled or no longer submitted",
                    document,
                )["receipt"]
            entries = destination.verify_ledger(document)
            return record(
                service,
                attempt,
                "verified",
                "Submitted journal and account-level ledger totals match",
                {"journal": document, "ledger": entries},
            )["receipt"]
        except ERPError as error:
            state = "drifted" if isinstance(error, DestinationDriftError) else "unknown"
            return record(service, attempt, state, str(error))["receipt"]
