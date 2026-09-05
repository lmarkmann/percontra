"""Ingest workbooks into DuckDB.

A file is ingested once, identified by its sha256. Re-ingesting a
unchanged file is a no-op; a changed file is replaced wholesale. Every
sheet becomes its own table named by `db.table_name`, so a sheet name can
never reach SQL unquoted.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path

import duckdb

from ..db import connect, table_name
from .xlsx import read_sheet, sheet_names


@dataclass(frozen=True)
class IngestReport:
    file_digest: str
    original_name: str
    sheets: dict[str, int]  # sheet name -> data row count
    skipped: bool = False


def file_digest(path: str | Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def ingest_file(
    conn: duckdb.DuckDBPyConnection,
    path: str | Path,
    role: str | None = None,
) -> IngestReport:
    path = Path(path)
    if not path.is_file():
        raise FileNotFoundError(path)

    digest = file_digest(path)
    conn.execute(
        "INSERT OR REPLACE INTO files (file_digest, original_name, role) "
        "VALUES (?, ?, ?)",
        [digest, path.name, role],
    )

    existing_sheet = conn.execute(
        "SELECT sheet_name FROM sheets WHERE file_digest = ?", [digest]
    ).fetchall()
    if (
        existing_sheet
        and role is None
        and conn.execute(
            "SELECT COUNT(*) FROM sheets WHERE file_digest = ?", [digest]
        ).fetchone()[0]
        == len(sheet_names(path))
    ):
        # Same file already ingested: report without rewriting.
        return IngestReport(
            digest, path.name, _sheet_counts(conn, digest), skipped=True
        )

    for sheet in sheet_names(path):
        model = read_sheet(path, sheet)
        tname = table_name(digest, sheet)
        conn.register("__frame", model.frame)
        conn.execute(f"CREATE OR REPLACE TABLE {tname} AS SELECT * FROM __frame")  # noqa: S608  # tname derived from digest, not user input
        conn.unregister("__frame")

        conn.execute(
            "INSERT OR REPLACE INTO sheets (file_digest, sheet_name, table_name, row_count) "
            "VALUES (?, ?, ?, ?)",
            [digest, sheet, tname, model.row_count],
        )
        conn.execute(
            "DELETE FROM sheet_columns WHERE file_digest = ? AND sheet_name = ?",
            [digest, sheet],
        )
        conn.executemany(
            "INSERT INTO sheet_columns (file_digest, sheet_name, col_index, header, column_name) "
            "VALUES (?, ?, ?, ?, ?)",
            [
                (digest, sheet, i, model.headers[i], model.column_names[i])
                for i in range(len(model.headers))
            ],
        )

    return IngestReport(digest, path.name, _sheet_counts(conn, digest))


def _sheet_counts(conn: duckdb.DuckDBPyConnection, digest: str) -> dict[str, int]:
    rows = conn.execute(
        "SELECT sheet_name, row_count FROM sheets WHERE file_digest = ? "
        "ORDER BY sheet_name",
        [digest],
    ).fetchall()
    return {name: count for name, count in rows}


def ingest_all(
    db_path: str | Path,
    gl: str | Path,
    sample: str | Path,
    reference: str | Path,
) -> list[IngestReport]:
    conn = connect(db_path)
    try:
        return [
            ingest_file(conn, gl, role="gl"),
            ingest_file(conn, sample, role="sample"),
            ingest_file(conn, reference, role="reference"),
        ]
    finally:
        conn.close()
