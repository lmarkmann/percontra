"""DuckDB connection and schema.

Lineage identity is (file_digest, sheet_name, physical_row). physical_row is
1-based and includes the header row, so it matches what a human sees in
Excel. Every sheet data table carries physical_row as its first column and
is the authority for that row; nothing that identifies a row is inferred.
"""

from __future__ import annotations

from pathlib import Path

import duckdb

DB_NAME = "percontra.duckdb"

SCHEMA = """
CREATE TABLE IF NOT EXISTS files (
	file_digest TEXT PRIMARY KEY,
	original_name TEXT NOT NULL,
	role TEXT,
	ingested_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sheets (
	file_digest TEXT NOT NULL REFERENCES files(file_digest),
	sheet_name TEXT NOT NULL,
	table_name TEXT NOT NULL,
	row_count INTEGER NOT NULL,
	PRIMARY KEY (file_digest, sheet_name)
);

CREATE TABLE IF NOT EXISTS sheet_columns (
	file_digest TEXT NOT NULL,
	sheet_name TEXT NOT NULL,
	col_index INTEGER NOT NULL,
	header TEXT NOT NULL,
	column_name TEXT NOT NULL,
	PRIMARY KEY (file_digest, sheet_name, col_index)
);

CREATE TABLE IF NOT EXISTS decision (
	id TEXT NOT NULL,
	version INTEGER NOT NULL,
	gap_ref TEXT,
	author TEXT NOT NULL,
	reason TEXT NOT NULL,
	target TEXT NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT now(),
	PRIMARY KEY (id, version)
);

CREATE TABLE IF NOT EXISTS release (
	batch_ref TEXT NOT NULL,
	status TEXT NOT NULL CHECK (status IN ('approved', 'stale', 'withheld')),
	decision_version TEXT NOT NULL,
	file_digest TEXT,
	approved_by TEXT,
	approved_at TIMESTAMP,
	superseded_at TIMESTAMP,
	PRIMARY KEY (batch_ref, approved_at)
);

CREATE TABLE IF NOT EXISTS compare_diff (
	run_at TIMESTAMP NOT NULL DEFAULT now(),
	kind TEXT NOT NULL CHECK (kind IN ('match', 'missing', 'unexpected', 'count')),
	identity TEXT,
	file_digest TEXT,
	sheet_name TEXT,
	physical_row INTEGER,
	detail TEXT
);
"""


# One DuckDB table per (file, sheet). The table name is derived from the
# digest, not from user input, so a sheet name cannot be used for SQL
# injection.
def table_name(file_digest: str, sheet_name: str) -> str:
    slug = "".join(c if c.isalnum() else "_" for c in sheet_name)
    return f"s_{file_digest[:8]}_{slug.lower()}"


def connect(db_path: str | Path) -> duckdb.DuckDBPyConnection:
    path = Path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = duckdb.connect(str(path))
    conn.execute(SCHEMA)
    return conn
