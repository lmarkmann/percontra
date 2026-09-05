from collections.abc import Iterator
from datetime import date, datetime

from percontra.contract import Capabilities, SourceRef, SourceRow
from percontra.ingest import file_digest
from percontra.ingest.xlsx import read_sheet, sheet_names

from ..base import Registries, SourceHandle, UploadedFile

REFERENCE_SHEETS = (
    "LE Mapping",
    "CoA Mapping",
    "Investor Mapping",
    "Deal Mapping",
    "Batch Preference",
    "Corvus CoA",
    "Mapping Gaps",
    "Entity Listing",
    "Deals List",
    "Investors List",
    "Suppliers List",
)


def text_value(value):
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def workbook_rows(path, name):
    digest = file_digest(path)
    sheet = read_sheet(path, name)
    return [
        SourceRow(
            values={key: text_value(value) for key, value in row.items() if key != "physical_row"},
            source=SourceRef(
                file_digest=digest,
                file_name=path.name,
                sheet=name,
                physical_row=row["physical_row"],
            ),
        )
        for row in sheet.frame.iter_rows(named=True)
    ]


class InvestorGLAdapter:
    name = "xlsx_investor_gl"
    capabilities = Capabilities(
        source_evidence="verified",
        investor_allocation="verified",
        decision_author_reason="not_applicable",
        destination_receipt="not_applicable",
        change_impact="partial",
    )

    def open(self, *, files: list[UploadedFile]) -> SourceHandle:
        by_role = {file.role: file.path for file in files}
        if "gl" not in by_role or "reference" not in by_role:
            raise ValueError("Source GL and reference workbook are required")
        available = sheet_names(by_role["reference"])
        registries = {
            name: workbook_rows(by_role["reference"], name)
            for name in REFERENCE_SHEETS
            if name in available
        }
        return SourceHandle(workbook_rows(by_role["gl"], "Investor-Level GL"), registries)

    def read_rows(self, *, handle: SourceHandle) -> Iterator[SourceRow]:
        yield from handle.rows

    def read_registries(self, *, handle: SourceHandle) -> Registries:
        return handle.registries
