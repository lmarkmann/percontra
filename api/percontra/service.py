from collections import Counter, defaultdict
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from threading import RLock
from uuid import uuid4

from percontra.contract import Decision, Export, Release, SourceRow

from .adapters.base import SourceHandle, UploadedFile
from .adapters.destination.xlsx_phase1_loader import Phase1Adapter, loader_row
from .adapters.source.xlsx_investor_gl import InvestorGLAdapter, workbook_rows
from .core import decisions, release
from .core.compare import compare
from .core.generate import digest, generate
from .store import Store

ROOT = Path(__file__).resolve().parents[2]
PACK = ROOT / "data/02-investor-level-gl-to-loader"
DEMO_BATCHES = {
    ("Chalbury Co-Invest L.P.", "639661"),
    ("Kestrel Westvale Co-Invest LP", "995747"),
    ("Kestrel DJ3 Co-Invest LP", "518551"),
}
LOCK = RLock()


class MigrationService:
    def __init__(self, path=None):
        self.store = Store(path or ROOT / "data/migration.duckdb")

    def load(self, files=None):
        files = files or [
            UploadedFile(
                PACK / "source/Investor-Level GL - Q2 activity - all entities (anonymised).xlsx",
                "gl",
            ),
            UploadedFile(
                PACK / "output/Tranche 1 - reference and verified loader v4c (anonymised).xlsx",
                "reference",
            ),
        ]
        adapter = InvestorGLAdapter()
        handle = adapter.open(files=files)
        selected = [
            row
            for row in handle.rows
            if (row.values["Legal_Entity"], row.values["Batch_ID"]) in DEMO_BATCHES
        ]
        if not selected:
            raise ValueError("No configured demonstration batches found in source")
        payload = {
            "rows": [row.model_dump(mode="json") for row in selected],
            "registries": {
                name: [row.model_dump(mode="json") for row in rows]
                for name, rows in handle.registries.items()
            },
            "source_count": len(handle.rows),
            "label": "Real dataset 02; three complete demonstration batches",
        }
        identifier = digest(payload)
        self.store.save_run(identifier, payload)
        return self.overview()

    def context(self, run_id=None):
        stored = self.store.run(run_id)
        if stored is None:
            raise ValueError("Load dataset 02 or the public example first")
        identifier, payload = stored
        handle = SourceHandle(
            [SourceRow.model_validate(row) for row in payload["rows"]],
            {
                name: [SourceRow.model_validate(row) for row in rows]
                for name, rows in payload["registries"].items()
            },
        )
        history = [
            Decision.model_validate(row) for row in self.store.events("decision", identifier)
        ]
        return identifier, payload, handle, history

    def postings(self):
        _, _, handle, history = self.context()
        return generate(handle.rows, handle.registries, history)

    def batches(self):
        grouped = defaultdict(list)
        for posting in self.postings():
            grouped[digest(posting.batch_key.model_dump())].append(posting)
        return grouped

    def release_for(self, batch, postings):
        identifier, _, _, _ = self.context()
        candidates = [
            Release.model_validate(row)
            for row in self.store.events("release", identifier)
            if digest(row["batch_key"]) == batch
        ]
        if not candidates:
            return None
        previous = candidates[-1]
        current = release.current(previous, postings)
        if current.state != previous.state:
            self.store.append("release", identifier, current.model_dump(mode="json"))
        return current

    def overview(self):
        if self.store.run() is None:
            return {"loaded": False, "batches": [], "gaps": [], "source_count": 0}
        identifier, payload, handle, history = self.context()
        batches = []
        for batch, postings in self.batches().items():
            approval = self.release_for(batch, postings)
            totals = defaultdict(lambda: {"debit": Decimal(0), "credit": Decimal(0)})
            for posting in postings:
                if posting.destination:
                    target = posting.destination
                    totals[target.transaction_currency][
                        "debit" if target.is_debit else "credit"
                    ] += Decimal(target.investor_amount_local.amount)
            batches.append(
                {
                    "id": batch,
                    "key": postings[0].batch_key.model_dump(),
                    "rows": len(postings),
                    "statuses": dict(Counter(row.status for row in postings)),
                    "release": approval.model_dump(mode="json") if approval else None,
                    "totals": {
                        currency: {key: str(value) for key, value in amounts.items()}
                        for currency, amounts in totals.items()
                    },
                }
            )
        gaps = []
        for gap in handle.registries.get("Mapping Gaps", []):
            affected = [
                row
                for row in handle.rows
                if (row.values["GL_Account"], row.values["Trans_Type"])
                == (gap.values["GL_Account"], gap.values["Trans_Type"])
            ]
            related = [
                item.model_dump(mode="json")
                for item in history
                if item.gap.source_gl_account == gap.values["GL_Account"]
                and item.gap.source_trans_type == gap.values["Trans_Type"]
            ]
            gaps.append(
                {
                    "row": gap.source.physical_row,
                    "source": gap.source.model_dump(),
                    "values": gap.values,
                    "affected": len(affected),
                    "history": related,
                    "entities": sorted({row.values["Legal_Entity"] for row in affected}),
                }
            )
        return {
            "loaded": True,
            "run_id": identifier,
            "label": payload["label"],
            "source_count": payload["source_count"],
            "batches": batches,
            "gaps": gaps,
        }

    def decide(self, gap_row, target_row, author, reason):
        identifier, _, handle, history = self.context()
        gap = next(
            (
                row
                for row in handle.registries["Mapping Gaps"]
                if row.source.physical_row == gap_row
            ),
            None,
        )
        target = next(
            (
                row
                for row in handle.registries["Corvus CoA"]
                if row.source.physical_row == target_row
            ),
            None,
        )
        if gap is None or target is None:
            raise ValueError("Select an existing gap and a valid target chart row")
        if target.values.get("Account_Type") != "Expenses":
            raise ValueError("These documented expense gaps require an expense chart row")
        decision = decisions.decide(handle.rows, gap, target, author, reason, history)
        self.store.append("decision", identifier, decision.model_dump(mode="json"))
        return self.overview()

    def approve(self, batch, author):
        identifier, _, _, _ = self.context()
        postings = self.batch(batch)
        approval = release.approve(postings, author)
        self.store.append("release", identifier, approval.model_dump(mode="json"))
        return approval.model_dump(mode="json")

    def batch(self, batch):
        postings = self.batches().get(batch)
        if postings is None:
            raise ValueError("Batch not found in current migration")
        return postings

    def approved(self, batch):
        postings = self.batch(batch)
        release.require_approved(self.release_for(batch, postings), postings)
        return postings

    def export(self, batch):
        identifier, _, handle, _ = self.context()
        postings = self.approved(batch)
        destination = Phase1Adapter()
        problems = destination.validate(postings=postings, registries=handle.registries)
        if problems:
            raise ValueError("; ".join(sorted({problem.message for problem in problems})))
        artifact = destination.render(postings=postings)
        import hashlib

        record = Export(
            export_id=str(uuid4()),
            created_at=datetime.now(UTC),
            scope="approved_only",
            batch_keys=[postings[0].batch_key],
            release_states_at_export={batch: "approved"},
            file_digest=hashlib.sha256(artifact.content).hexdigest(),
            label=artifact.label,
        )
        folder = self.store.path.parent / "exports"
        folder.mkdir(exist_ok=True)
        path = folder / (record.file_digest + ".xlsx")
        if not path.exists():
            path.write_bytes(artifact.content)
        self.store.append("export", identifier, record.model_dump(mode="json"))
        return artifact, record

    def evidence(self, posting_id):
        _, _, handle, history = self.context()
        posting = next((row for row in self.postings() if row.posting_id == posting_id), None)
        if posting is None:
            raise ValueError("Posting not found")
        wanted = {(ref.file_digest, ref.sheet, ref.physical_row) for ref in posting.source_refs}
        mappings = {
            (ref.source.file_digest, ref.source.sheet, ref.source.physical_row)
            for ref in posting.mappings_used
        }
        source = [
            row.model_dump(mode="json")
            for row in handle.rows
            if (row.source.file_digest, row.source.sheet, row.source.physical_row) in wanted
        ]
        mapped = [
            row.model_dump(mode="json")
            for rows in handle.registries.values()
            for row in rows
            if (row.source.file_digest, row.source.sheet, row.source.physical_row) in mappings
        ]
        approval = self.release_for(
            digest(posting.batch_key.model_dump()),
            self.batch(digest(posting.batch_key.model_dump())),
        )
        return {
            "posting": posting.model_dump(mode="json"),
            "source": source,
            "mappings": mapped,
            "decisions": [
                row.model_dump(mode="json")
                for row in history
                if any(ref.decision_id == row.decision_id for ref in posting.decisions_used)
            ],
            "approval": approval.model_dump(mode="json") if approval else None,
        }

    def compare(self, batch):
        postings = self.batch(batch)
        expected = workbook_rows(
            PACK / "output/Tranche 1 - reference and verified loader v4c (anonymised).xlsx",
            "Upload Template (VERIFIED v4c)",
        )
        key = postings[0].batch_key
        columns = [
            "Legal_Entity",
            "Batch_ref",
            "JE_Index",
            "Transaction_Index",
            "Investor_Account_ID",
            "Trans_Type",
            "Transaction_Currency",
            "Investor_Amount_(Local)",
            "Is_Debit",
            "Investor_Amount_(LE)",
        ]

        def normalize(row):
            return tuple(
                format(Decimal(value), ".2f") if i in (7, 9) else value
                for i, value in enumerate(row)
            )

        reference = [
            normalize([row.values.get(column, "") for column in columns])
            for row in expected
            if row.values["Legal_Entity"] == key.legal_entity
            and row.values["Batch_ref"] == key.source_batch_id
        ]
        actual = []
        for posting in postings:
            if posting.destination:
                row = loader_row(posting, 1)
                actual.append(
                    normalize(
                        [
                            str(value)
                            for value in [
                                row[3],
                                key.source_batch_id,
                                row[1],
                                row[2],
                                row[20],
                                row[11],
                                row[12],
                                row[13],
                                row[14],
                                row[15],
                            ]
                        ]
                    )
                )
        return {
            **compare(actual, reference),
            "fields": columns,
            "note": "Selected identity, classification and amount fields; not full loader-field reproduction",
        }
