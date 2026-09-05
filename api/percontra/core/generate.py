import hashlib
import json
from collections import Counter, defaultdict
from decimal import ROUND_HALF_UP, Decimal

from percontra.contract import MappingRef, Posting, SourceRow


def digest(value) -> str:
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, separators=(",", ":"), default=str).encode()
    ).hexdigest()


def amount(value: str) -> str:
    number = Decimal(value)
    if not number.is_finite():
        raise ValueError("Amount must be finite")
    return format(abs(number).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), "f")


def gap_id(row: SourceRow) -> str:
    return digest([row.source.file_digest, row.values["GL_Account"], row.values["Trans_Type"]])


def index(rows, fields):
    found = defaultdict(list)
    for row in rows:
        found[tuple(row.values.get(field, "") for field in fields)].append(row)
    return found


def unique(rows, fields, label):
    if not rows:
        raise ValueError(f"Missing {label} mapping")
    values = {tuple(row.values.get(field, "") for field in fields) for row in rows}
    if len(values) != 1:
        raise ValueError(f"Conflicting {label} mappings")
    return rows[0].values


def generate(
    rows: list[SourceRow], registries: dict[str, list[SourceRow]], decisions: list
) -> list[Posting]:
    tables = {
        "LE": index(registries.get("LE Mapping", []), ["Legal_Entity"]),
        "CoA": index(
            registries.get("CoA Mapping", []),
            ["Helio_GL_Account", "Helio_Account_Type", "Helio_Trans_Type"],
        ),
        "Investor": index(
            registries.get("Investor Mapping", []),
            ["Legal_Entity", "Vehicle", "Specific_External_Ref_1"],
        ),
        "Deal": index(registries.get("Deal Mapping", []), ["Deal_Name", "Position", "Currency"]),
        "CorvusCoA": index(registries.get("Corvus CoA", []), ["Trans_Type"]),
    }
    gaps = {
        (row.values["GL_Account"], row.values["Trans_Type"])
        for row in registries.get("Mapping Gaps", [])
    }
    latest = {}
    for decision in decisions:
        previous = latest.get(decision.decision_id)
        if not previous or decision.version > previous.version:
            latest[decision.decision_id] = decision
    occurrences = Counter()
    postings = []
    for source in rows:
        values = source.values
        required = (
            "Legal_Entity",
            "Vehicle",
            "Batch_ID",
            "Journal_Entry_Index",
            "Transaction_Index",
            "RFX_ID",
            "GL_Account",
            "Account_Type",
            "Trans_Type",
        )
        if any(field not in values for field in required):
            raise ValueError("Source profile is missing canonical GL fields")
        identity = dict(
            zip(
                ("legal_entity", "vehicle", "batch_id", "je_index", "transaction_index", "rfx_id"),
                (values[field] for field in required[:6]),
                strict=True,
            )
        )
        duplicate_key = tuple(identity.values())
        identity["occurrence_index"] = occurrences[duplicate_key]
        occurrences[duplicate_key] += 1
        posting = {
            "contract_version": 1,
            "posting_id": digest(source.source.model_dump()),
            "batch_key": {
                "legal_entity": values["Legal_Entity"],
                "source_batch_id": values["Batch_ID"],
            },
            "source_identity": identity,
            "source_refs": [source.source],
            "mappings_used": [],
            "decisions_used": [],
            "status": "ready",
            "destination": None,
            "warnings": [],
        }
        refs = posting["mappings_used"]
        pair = (values["GL_Account"], values["Trans_Type"])
        if pair in gaps and gap_id(source) not in latest:
            posting.update(
                status="needs_decision",
                block_reason="Documented mapping gap needs a recorded decision",
            )
            postings.append(Posting.model_validate(posting))
            continue

        def mapped(table, key, fields, refs=refs):
            matches = tables[table].get(key, [])
            mapped_values = unique(matches, fields, table)
            refs.extend({"table": table, "source": match.source, "version": 1} for match in matches)
            return mapped_values

        try:
            entity = mapped(
                "LE", (values["Legal_Entity"],), ["Corvus_LE", "Corvus_LE_ID", "Corvus_Currency"]
            )
            investor = mapped(
                "Investor",
                (values["Legal_Entity"], values["Vehicle"], values["RFX_ID"]),
                ["Corvus_Specific_Id", "Corvus_Veh_Name"],
            )
            position = values.get("Position", "") if values.get("Position_ID") else ""
            deal = mapped(
                "Deal",
                (values.get("Deal_Name", ""), position, values["Transaction_Currency"]),
                [
                    "Corvus_Deal_Name",
                    "Corvus_Deal_ID",
                    "Corvus_Position_Name",
                    "Corvus_Position_ID",
                ],
            )
            if values.get("Position") and not values.get("Position_ID"):
                posting["warnings"].append(
                    {
                        "code": "position_without_id",
                        "message": "Source position label has no ID; using the explicit deal-only mapping",
                        "refs": [source.source],
                    }
                )
            signed = Decimal(values["Amount_(Local_Currency)"])
            signed_le = Decimal(values["Amount_(Entity_Currency)"])
            debit = (signed if signed != 0 else signed_le) >= 0
            pair = (values["GL_Account"], values["Trans_Type"])
            decision = latest.get(gap_id(source)) if pair in gaps else None
            if pair in gaps and not decision:
                posting.update(
                    status="needs_decision",
                    block_reason="Documented mapping gap needs a recorded decision",
                )
                postings.append(Posting.model_validate(posting))
                continue
            if decision:
                target_type = decision.target.trans_type
                target_account = decision.target.gl_account
                posting["decisions_used"] = [
                    {"decision_id": decision.decision_id, "version": decision.version}
                ]
                coa = {"Batch_Type": "Expense", "QUANTITY_(optional)": "False"}
            else:
                key = (values["GL_Account"], values["Account_Type"], values["Trans_Type"])
                if key not in tables["CoA"]:
                    key = ("", "", values["Trans_Type"])
                coa = mapped(
                    "CoA",
                    key,
                    [
                        "Verado_II_GL_Account",
                        "Verado_II_TransType_(Default)",
                        "Verado_II_TransType_(Debit)",
                        "Batch_Type",
                        "UDF_Lookup",
                        "SUPPLIER",
                    ],
                )
                target_type = (coa.get("Verado_II_TransType_(Debit)") if debit else "") or coa[
                    "Verado_II_TransType_(Default)"
                ]
                target_account = coa.get("Verado_II_GL_Account", "")
            candidates = tables["CorvusCoA"].get((target_type,), [])
            if target_account:
                candidates = [
                    row for row in candidates if row.values["GL_Account"] == target_account
                ]
            chart = unique(candidates, ["GL_Account"], "target transaction type")
            refs.extend(
                {"table": "CorvusCoA", "source": row.source, "version": 1} for row in candidates
            )
            if chart.get("Position") == "Required" and not deal.get("Corvus_Position_ID"):
                raise ValueError("Target transaction type requires a position")
            if coa.get("MANDATORY_SUPPLIER?") in ("True", "Yes") and not coa.get("SUPPLIER"):
                raise ValueError("Required supplier is not mapped")
            if signed * signed_le < 0:
                raise ValueError("Local and entity amounts disagree on debit/credit sign")
            posting["destination"] = {
                "legal_entity": entity["Corvus_LE"],
                "legal_entity_id": entity["Corvus_LE_ID"],
                "gl_date": values["GL_Date"],
                "effective_date": values["Effective_Date"],
                "deal_name": deal.get("Corvus_Deal_Name") or None,
                "deal_id": deal.get("Corvus_Deal_ID") or None,
                "position": deal.get("Corvus_Position_Name") or None,
                "position_id": deal.get("Corvus_Position_ID") or None,
                "trans_type": target_type,
                "transaction_currency": values["Transaction_Currency"],
                "investor_amount_local": {
                    "amount": amount(str(signed)),
                    "currency": values["Transaction_Currency"],
                },
                "investor_amount_le": {
                    "amount": amount(str(signed_le)),
                    "currency": values["Legal_Entity_Currency"],
                },
                "is_debit": debit,
                "batch_type": coa.get("Batch_Type") or values["Batch_Type"],
                "batch_comments": values.get("Comments_Batch") or None,
                "transaction_comments": values.get("Comments_transaction") or None,
                "allocation_rule": values.get("Allocation_Rule", ""),
                "investor_account_id": investor["Corvus_Specific_Id"],
                "vehicle": investor["Corvus_Veh_Name"],
                "bank_account": values.get("Bank_Account") or None,
                "udf_lookup": coa.get("UDF_Lookup") or None,
                "udf_text": None,
                "supplier": coa.get("SUPPLIER") or None,
                "investor_quantity": values.get("Quantity")
                if coa.get("QUANTITY_(optional)") == "True"
                else None,
            }
        except (ValueError, KeyError) as error:
            posting.update(status="blocked", block_reason=str(error), destination=None)
        postings.append(Posting.model_validate(posting))
    preferences = {row.values["Batch_Type"]: row for row in registries.get("Batch Preference", [])}
    batches = defaultdict(list)
    for posting in postings:
        batches[posting.batch_key.model_dump_json()].append(posting)
    for batch in batches.values():
        ready = [posting for posting in batch if posting.destination]
        priorities = [preferences.get(posting.destination.batch_type) for posting in ready]
        if any(row is None or not row.values.get("Prioritization") for row in priorities):
            for posting in ready:
                posting.status = "blocked"
                posting.block_reason = "Batch type has no documented priority"
            continue
        if priorities:
            preference = min(priorities, key=lambda row: Decimal(row.values["Prioritization"]))
            for posting in ready:
                posting.destination.batch_type = preference.values["Batch_Type"]
                posting.mappings_used.append(
                    MappingRef(table="BatchPreference", source=preference.source, version=1)
                )
    return [Posting.model_validate(posting.model_dump()) for posting in postings]
