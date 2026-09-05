from .contract import SourceRef, SourceRow
from .core.generate import digest


def example_payload():
    def row(sheet, number, values):
        return SourceRow(
            values=values,
            source=SourceRef(
                file_digest=digest(["public-example", sheet]),
                file_name="public-example.json",
                sheet=sheet,
                physical_row=number,
            ),
        ).model_dump(mode="json")

    registries = {
        "LE Mapping": [
            row(
                "LE Mapping",
                3,
                {
                    "Legal_Entity": "Example Fund",
                    "Corvus_LE": "Example Fund",
                    "Corvus_LE_ID": "7001",
                    "Corvus_Currency": "USD",
                },
            )
        ],
        "Investor Mapping": [
            row(
                "Investor Mapping",
                2,
                {
                    "Legal_Entity": "Example Fund",
                    "Vehicle": "Example Fund",
                    "Specific_External_Ref_1": "LP-A",
                    "Corvus_Specific_Id": "8001",
                    "Corvus_Veh_Name": "Example Fund",
                },
            )
        ],
        "Deal Mapping": [
            row(
                "Deal Mapping",
                2,
                {
                    "Deal_Name": "Operations",
                    "Position": "",
                    "Currency": "USD",
                    "Corvus_Deal_Name": "Operations",
                    "Corvus_Deal_ID": "9001",
                    "Corvus_Position_Name": "",
                    "Corvus_Position_ID": "",
                },
            )
        ],
        "CoA Mapping": [
            row(
                "CoA Mapping",
                2,
                {
                    "Helio_GL_Account": "10010 - Cash",
                    "Helio_Account_Type": "Assets",
                    "Helio_Trans_Type": "Cash paid",
                    "Verado_II_GL_Account": "10000 - Cash",
                    "Verado_II_TransType_(Default)": "Cash paid",
                    "Batch_Type": "General",
                },
            ),
            row(
                "CoA Mapping",
                3,
                {
                    "Helio_GL_Account": "50020 - Administration",
                    "Helio_Account_Type": "Expenses",
                    "Helio_Trans_Type": "Administration",
                    "Verado_II_GL_Account": "50080 - Administration fees",
                    "Verado_II_TransType_(Default)": "Expense: Administration fees",
                    "Batch_Type": "Expense",
                },
            ),
        ],
        "Corvus CoA": [
            row(
                "Corvus CoA",
                2,
                {
                    "Trans_Type": "Cash paid",
                    "GL_Account": "10000 - Cash",
                    "Account": "10000",
                    "Account_Short_Description": "Cash",
                    "Account_Type": "Assets",
                    "Position": "Optional",
                },
            ),
            row(
                "Corvus CoA",
                3,
                {
                    "Trans_Type": "Expense: Administration fees",
                    "GL_Account": "50080 - Administration fees",
                    "Account": "50080",
                    "Account_Short_Description": "Administration fees",
                    "Account_Type": "Expenses",
                    "Position": "Optional",
                },
            ),
            row(
                "Corvus CoA",
                4,
                {
                    "Trans_Type": "Expense: Legal fees",
                    "GL_Account": "50090 - Legal fees",
                    "Account": "50090",
                    "Account_Short_Description": "Legal fees",
                    "Account_Type": "Expenses",
                    "Position": "Optional",
                },
            ),
        ],
        "Batch Preference": [
            row("Batch Preference", 2, {"Batch_Type": "General", "Prioritization": "10"}),
            row("Batch Preference", 3, {"Batch_Type": "Expense", "Prioritization": "8"}),
        ],
        "Mapping Gaps": [
            row(
                "Mapping Gaps",
                2,
                {
                    "GL_Account": "40070 - Bank interest",
                    "Trans_Type": "Administration",
                    "Proposed_Verado_II_TransType": "Expense: Administration fees",
                },
            )
        ],
    }
    rows = []
    for number, batch, account, kind, transaction, value in [
        (2, "public-clean", "50020 - Administration", "Expenses", "Administration", "125.50"),
        (3, "public-clean", "10010 - Cash", "Assets", "Cash paid", "-125.50"),
        (4, "public-gap", "40070 - Bank interest", "Revenues", "Administration", "76.25"),
        (5, "public-gap", "10010 - Cash", "Assets", "Cash paid", "-76.25"),
    ]:
        rows.append(
            row(
                "Investor-Level GL",
                number,
                {
                    "Legal_Entity": "Example Fund",
                    "Vehicle": "Example Fund",
                    "Batch_ID": batch,
                    "Journal_Entry_Index": "1",
                    "Transaction_Index": str(number),
                    "RFX_ID": "LP-A",
                    "GL_Account": account,
                    "Account_Type": kind,
                    "Trans_Type": transaction,
                    "Position": "",
                    "Position_ID": "",
                    "Deal_Name": "Operations",
                    "Transaction_Currency": "USD",
                    "Legal_Entity_Currency": "USD",
                    "Amount_(Local_Currency)": value,
                    "Amount_(Entity_Currency)": value,
                    "GL_Date": "2026-06-30",
                    "Effective_Date": "2026-06-30",
                    "Batch_Type": "General",
                    "Allocation_Rule": "Example allocation",
                    "Quantity": "0",
                },
            )
        )
    return {
        "rows": rows,
        "registries": registries,
        "source_count": len(rows),
        "label": "Public synthetic example; real release-control engine; not sent to ERPNext",
    }


def load_example(service):
    payload = example_payload()
    service.store.save_run(digest(payload), payload)
    return service.overview()
