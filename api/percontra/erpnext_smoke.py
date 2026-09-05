"""A separate synthetic GBP connectivity check, never a relabelled dataset 02 batch."""

from . import submissions
from .adapters.destination.erpnext import COMPANY
from .core.generate import digest
from .example import example_payload
from .service import ROOT, MigrationService

SMOKE_DB = ROOT / "data/erpnext-gbp-smoke.duckdb"


def payload():
    example = example_payload()
    example["rows"] = example["rows"][:2]
    example["registries"]["Mapping Gaps"] = []
    account_names = {
        "10000 - Cash": ("990001", "Percontra GBP smoke cash"),
        "50080 - Administration fees": ("990002", "Percontra GBP smoke clearing"),
    }
    for source in example["rows"]:
        values = source["values"]
        values.update(
            Legal_Entity=COMPANY,
            Vehicle=COMPANY,
            Batch_ID="SYNTHETIC-GBP-CONNECTIVITY-v1",
            Transaction_Currency="GBP",
            Legal_Entity_Currency="GBP",
        )
        values["Amount_(Local_Currency)"] = (
            "-1.00" if values["Amount_(Local_Currency)"].startswith("-") else "1.00"
        )
        values["Amount_(Entity_Currency)"] = values["Amount_(Local_Currency)"]
    for rows in example["registries"].values():
        for row in rows:
            values = row["values"]
            for field, value in values.items():
                if value == "Example Fund":
                    values[field] = COMPANY
                elif value == "USD":
                    values[field] = "GBP"
                elif value in account_names:
                    code, label = account_names[value]
                    values[field] = code + " - " + label
            if values.get("Account") in ("10000", "50080"):
                previous = (
                    "10000 - Cash"
                    if values["Account"] == "10000"
                    else "50080 - Administration fees"
                )
                code, label = account_names[previous]
                values.update(Account=code, Account_Short_Description=label, Account_Type="Assets")
    example["source_count"] = 2
    example["label"] = "Synthetic GBP 1.00 connectivity check; not client activity or dataset 02"
    example["destination_currency"] = "GBP"
    example["fixture_document"] = {
        "rows": [row["values"] for row in example["rows"]],
        "registries": {
            name: [row["values"] for row in rows] for name, rows in example["registries"].items()
        },
    }
    fixture_digest = digest(example["fixture_document"])
    for row in example["rows"] + [row for rows in example["registries"].values() for row in rows]:
        row["source"]["file_name"] = "synthetic-gbp-connectivity.json"
        row["source"]["file_digest"] = fixture_digest
    return example


def prepare(path=None):
    import json

    service = MigrationService(path or SMOKE_DB)
    fixture = payload()
    (service.store.path.parent / "synthetic-gbp-connectivity.json").write_text(
        json.dumps(fixture["fixture_document"], sort_keys=True, separators=(",", ":"))
    )
    service.store.save_run(digest(fixture), fixture)
    batch = next(iter(service.batches()))
    approval = service.release_for(batch, service.batch(batch))
    if approval is None or approval.state != "approved":
        service.approve(batch, "User-authorised local operator connectivity test")
    return service, batch


def run(*, post=False):
    service, batch = prepare()
    destination = submissions.adapter(service)
    check = destination.preflight()
    account_plan = destination.provisioning(service.approved(batch), check)
    report = {
        "label": "Synthetic GBP connectivity test, not dataset 02",
        "company": COMPANY,
        "currency": "GBP",
        "debit": "1.00",
        "credit": "1.00",
        "accounts": account_plan,
        "problems": check["problems"],
    }
    previous = submissions.latest(service)
    if previous:
        report["receipt"] = submissions.verify(service, previous[-1]["id"])
        return report
    if post:
        destination.provision(service.approved(batch))
        artifact, exported = service.export(batch)
        report["export_digest"] = exported.file_digest
        report["export_bytes"] = len(artifact.content)
        report["receipt"] = submissions.submit(service, batch, "gbp-connectivity-v1")
    return report
