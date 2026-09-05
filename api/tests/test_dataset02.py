from collections import Counter

import pytest

from percontra.adapters.source.xlsx_investor_gl import workbook_rows
from percontra.service import PACK, MigrationService

SOURCE = PACK / "source/Investor-Level GL - Q2 activity - all entities (anonymised).xlsx"
pytestmark = pytest.mark.skipif(not SOURCE.exists(), reason="Private dataset 02 is not bundled")


@pytest.fixture(scope="module")
def real_migration(tmp_path_factory):
    service = MigrationService(tmp_path_factory.mktemp("real-migration") / "migration.duckdb")
    service.load()
    return service


def test_chalbury_real_batch_and_selected_reference_fields(real_migration):
    overview = real_migration.overview()
    assert overview["source_count"] == 33902
    batch = next(row for row in overview["batches"] if row["key"]["source_batch_id"] == "639661")
    assert batch["rows"] == 152
    assert batch["statuses"] == {"ready": 152}
    assert batch["totals"] == {"USD": {"debit": "127.19", "credit": "127.19"}}
    comparison = real_migration.compare(batch["id"])
    assert comparison["matched"] == comparison["expected"] == 152
    assert comparison["missing"] == comparison["unexpected"] == 0
    assert len(comparison["fields"]) == 10


def test_both_documented_gaps_are_preserved(real_migration):
    gaps = real_migration.overview()["gaps"]
    assert sorted(row["affected"] for row in gaps) == [8, 11]
    assert all("Chalbury Co-Invest L.P." not in row["entities"] for row in gaps)


def test_westvale_decision_enables_complete_batch_then_invalidates(real_migration):
    service = real_migration
    batches = service.overview()["batches"]
    westvale = next(row["id"] for row in batches if row["key"]["source_batch_id"] == "995747")
    chalbury = next(row["id"] for row in batches if row["key"]["source_batch_id"] == "639661")
    service.approve(chalbury, "Integration test reviewer")
    service.decide(2, 911, "Integration test reviewer", "Accept supplied proposal for this test")
    assert all(row.status == "ready" for row in service.batch(westvale))
    service.approve(westvale, "Integration test reviewer")
    assert service.export(westvale)[0].content
    service.decide(2, 911, "Integration test reviewer", "Reconfirm as a new decision version")
    with pytest.raises(ValueError, match="not approved"):
        service.export(westvale)
    assert service.release_for(chalbury, service.batch(chalbury)).state == "approved"


def test_three_column_identity_is_not_assumed_unique():
    rows = workbook_rows(SOURCE, "Investor-Level GL")
    counts = Counter(
        tuple(
            row.values.get(key)
            for key in ("Legal_Entity", "Journal_Entry_Index", "Transaction_Index")
        )
        for row in rows
    )
    assert sum(counts.values()) == 33902
    assert max(counts.values()) > 1
    assert len(
        {(row.source.file_digest, row.source.sheet, row.source.physical_row) for row in rows}
    ) == len(rows)
