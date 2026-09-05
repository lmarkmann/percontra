from datetime import date
from pathlib import Path

import pytest
from openpyxl import Workbook

from percontra.db import connect, table_name
from percontra.ingest import file_digest, ingest_all, ingest_file


@pytest.fixture()
def workbook(tmp_path: Path) -> Path:
    wb = Workbook()
    ws = wb.active
    assert ws is not None
    ws.title = "GL"
    ws.append(["Legal Entity", "GL Date", "GL Date", "Amount (Entity Currency)"])
    ws.append(["Entity A", date(2026, 7, 1), date(2026, 7, 2), 100.10])
    ws.append(["Entity B", date(2026, 7, 1), date(2026, 7, 3), -9.09e-13])
    ws2 = wb.create_sheet("Mapping Gaps")
    ws2.append(["GL Account", "Trans Type", "Approval"])
    ws2.append(["40070 - Interest Income - Bank", "Expense: Administration Fees", None])
    ws2.append(["30050 - Partner Transfers", "Expense: Legal & Professional Fees", None])
    path = tmp_path / "fixture.xlsx"
    wb.save(path)
    return path


def test_duplicate_headers_resolve_positionally(workbook: Path, tmp_path: Path) -> None:
    db = tmp_path / "t.duckdb"
    [report] = [ingest_file(connect(db), workbook, role="gl")]
    conn = connect(db)
    table = table_name(report.file_digest, "GL")

    cols = [r[1] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()]
    assert cols == [
        "physical_row",
        "Legal_Entity",
        "GL_Date",
        "GL_Date_2",
        "Amount_(Entity_Currency)",
    ]

    headers = conn.execute(
        "SELECT col_index, header FROM sheet_columns "
        "WHERE file_digest = ? AND sheet_name = 'GL' ORDER BY col_index",
        [report.file_digest],
    ).fetchall()
    assert [h for _, h in headers] == [
        "Legal Entity",
        "GL Date",
        "GL Date",
        "Amount (Entity Currency)",
    ]


def test_physical_rows_match_excel(workbook: Path, tmp_path: Path) -> None:
    db = tmp_path / "t.duckdb"
    report = ingest_file(connect(db), workbook, role="gl")
    conn = connect(db)
    table = table_name(report.file_digest, "GL")

    rows = conn.execute(
        f'SELECT physical_row, "Legal_Entity" FROM {table} ORDER BY physical_row'
    ).fetchall()
    assert [r[0] for r in rows] == [2, 3]

    amounts = conn.execute(
        f'SELECT "Amount_(Entity_Currency)" FROM {table} ORDER BY physical_row'
    ).fetchall()
    assert amounts[0][0] == pytest.approx(100.10)
    assert amounts[1][0] == pytest.approx(-9.09e-13)


def test_reingest_same_file_is_skipped(workbook: Path, tmp_path: Path) -> None:
    db = tmp_path / "t.duckdb"
    conn = connect(db)
    before = ingest_file(conn, workbook, role="gl")
    after = ingest_file(conn, workbook, role="gl")
    assert before.skipped is False
    assert after.skipped is True
    assert before.file_digest == after.file_digest
    assert file_digest(workbook) == before.file_digest


def test_ingest_all_assigns_roles(workbook: Path, tmp_path: Path) -> None:
    db = tmp_path / "t.duckdb"
    ingest_all(db, workbook, workbook, workbook)
    conn = connect(db)
    roles = dict(
        conn.execute("SELECT role, COUNT(DISTINCT file_digest) FROM files GROUP BY role").fetchall()
    )
    # All three are the same file, so the last role wins on re-ingest.
    assert roles == {"reference": 1}


def test_gap_rows_keep_blank_approval(workbook: Path, tmp_path: Path) -> None:
    db = tmp_path / "t.duckdb"
    report = ingest_file(connect(db), workbook, role="reference")
    conn = connect(db)
    table = table_name(report.file_digest, "Mapping Gaps")

    rows = conn.execute(
        f'SELECT "GL_Account", "Trans_Type", "Approval" FROM {table} ORDER BY physical_row'
    ).fetchall()
    assert len(rows) == 2
    assert all(r[2] is None for r in rows)
