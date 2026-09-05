from datetime import date
from decimal import Decimal
from io import BytesIO

from openpyxl import Workbook

from percontra.contract import Capabilities

from ..base import Block, ExportArtifact

HEADERS = [
    "Batch Index",
    "JE Index",
    "Transaction Index",
    "Legal Entity",
    "Legal Entity ID",
    "GL Date",
    "Effective Date",
    "Deal Name",
    "Deal ID",
    "Position",
    "Position ID",
    "Trans Type",
    "Transaction Currency",
    "Investor Amount (Local)",
    "Is Debit",
    "Investor Amount (LE)",
    "Batch Type",
    "Batch Comments",
    "Transaction Comments",
    "Allocation Rule",
    "Investor Account ID",
    "Vehicle",
    "Bank Account",
    "UDF Lookup",
    "UDF Text",
    "Supplier",
    "Investor Quantity",
]


def loader_row(posting, batch_index):
    target = posting.destination
    if target is None:
        raise ValueError("Cannot render an unresolved posting")
    return [
        batch_index,
        posting.source_identity.je_index,
        posting.source_identity.transaction_index,
        target.legal_entity,
        target.legal_entity_id,
        target.gl_date,
        target.effective_date,
        target.deal_name,
        target.deal_id,
        target.position,
        target.position_id,
        target.trans_type,
        target.transaction_currency,
        Decimal(target.investor_amount_local.amount),
        "Y" if target.is_debit else "N",
        Decimal(target.investor_amount_le.amount),
        target.batch_type,
        target.batch_comments,
        target.transaction_comments,
        target.allocation_rule,
        target.investor_account_id,
        target.vehicle,
        target.bank_account,
        target.udf_lookup,
        target.udf_text,
        target.supplier,
        Decimal(target.investor_quantity) if target.investor_quantity else None,
    ]


class Phase1Adapter:
    name = "xlsx_phase1_loader"
    capabilities = Capabilities(
        source_evidence="partial",
        investor_allocation="verified",
        decision_author_reason="partial",
        destination_receipt="not_applicable",
        change_impact="partial",
    )

    def registries(self, *, handle):
        return handle.registries

    def validate(self, *, postings, registries):
        if any(row.destination is None or row.status != "ready" for row in postings):
            return [Block("unresolved", "Only resolved postings can be rendered")]
        investors = {
            (row.values["Legal_Entity"], row.values["Corvus_Specific_ID"])
            for row in registries.get("Investors List", [])
        }
        deals = {row.values["Corvus_Deal_ID"] for row in registries.get("Deals List", [])}
        types = {row.values["Trans_Type"] for row in registries.get("Corvus CoA", [])}
        problems = []
        for posting in postings:
            target = posting.destination
            if target.trans_type not in types:
                problems.append(
                    Block("transaction_type", "Target transaction type is not registered")
                )
            if investors and (target.legal_entity, target.investor_account_id) not in investors:
                problems.append(
                    Block("investor", "Target investor account is not registered for this entity")
                )
            if deals and target.deal_id and target.deal_id not in deals:
                problems.append(Block("deal", "Target deal is not registered"))
        return problems

    def render(self, *, postings):
        workbook = Workbook()
        sheet = workbook.active
        sheet.title = "Sheet1"
        sheet.append(HEADERS)
        batches = {
            key: number
            for number, key in enumerate(
                sorted({row.batch_key.model_dump_json() for row in postings}), 1
            )
        }
        for posting in postings:
            values = loader_row(posting, batches[posting.batch_key.model_dump_json()])
            sheet.append(values)
            for cell in sheet[sheet.max_row]:
                if isinstance(cell.value, str):
                    cell.data_type = "s"
                elif isinstance(cell.value, date):
                    cell.number_format = "yyyy-mm-dd"
                elif isinstance(cell.value, Decimal):
                    cell.number_format = "#,##0.00"
        sheet.freeze_panes = "A2"
        sheet.auto_filter.ref = sheet.dimensions
        output = BytesIO()
        workbook.save(output)
        return ExportArtifact(
            output.getvalue(),
            "phase1-approved.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

    def submit(self, *, artifact):
        return None
