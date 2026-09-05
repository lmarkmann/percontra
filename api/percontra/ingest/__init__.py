"""xlsx to DuckDB. Every row keeps (file_digest, sheet, physical_row)."""

from .load import IngestReport, file_digest, ingest_all, ingest_file

__all__ = ["IngestReport", "file_digest", "ingest_all", "ingest_file"]
