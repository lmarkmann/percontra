import csv
from collections.abc import Iterator

from percontra.contract import SourceRef, SourceRow
from percontra.ingest import file_digest

from ..base import Registries, SourceHandle, UploadedFile
from .xlsx_investor_gl import InvestorGLAdapter


class CSVAdapter:
    name = "csv_generic"
    capabilities = InvestorGLAdapter.capabilities.model_copy()

    def __init__(self, columns: dict[str, str], registries: Registries):
        self.columns = columns
        self.source_registries = registries

    def open(self, *, files: list[UploadedFile]) -> SourceHandle:
        if len(files) != 1 or not self.columns:
            raise ValueError(
                "One CSV and an explicit canonical-to-source column profile are required"
            )
        path = files[0].path
        digest = file_digest(path)
        rows = []
        with path.open(newline="", encoding="utf-8-sig") as stream:
            reader = csv.reader(stream)
            headers = next(reader, [])
            if not set(self.columns.values()).issubset(headers):
                raise ValueError("CSV is missing configured columns")
            previous_line = reader.line_num
            for fields in reader:
                physical_row = previous_line + 1
                previous_line = reader.line_num
                if not fields:
                    continue
                record = dict(zip(headers, fields, strict=True))
                rows.append(
                    SourceRow(
                        values={key: record[column] or "" for key, column in self.columns.items()},
                        source=SourceRef(
                            file_digest=digest,
                            file_name=path.name,
                            sheet="CSV",
                            physical_row=physical_row,
                        ),
                    )
                )
        return SourceHandle(rows, self.source_registries)

    def read_rows(self, *, handle: SourceHandle) -> Iterator[SourceRow]:
        yield from handle.rows

    def read_registries(self, *, handle: SourceHandle) -> Registries:
        return handle.registries
