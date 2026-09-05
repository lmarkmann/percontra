import json
import os
import shlex
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from decimal import Decimal
from pathlib import Path

from percontra.contract import Capabilities

from ..base import Block, ExportArtifact

SITE = "https://percontra.l.frappe.cloud"
COMPANY = "Chalbury Co-Invest L.P."


class ERPError(Exception):
    def __init__(self, message, *, uncertain=False):
        super().__init__(message)
        self.uncertain = uncertain


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ERPError("ERPNext redirected the request; refusing to forward credentials")


class DestinationDriftError(ERPError):
    pass


@dataclass(frozen=True)
class Connection:
    url: str
    key: str = field(repr=False)
    secret: str = field(repr=False)
    live: bool = False

    @classmethod
    def load(cls):
        configured = {}
        path = Path(__file__).resolve().parents[4] / ".env"
        if path.exists():
            for line in path.read_text().splitlines():
                if "=" not in line or line.lstrip().startswith("#"):
                    continue
                key, value = line.split("=", 1)
                if key.strip() in ("ERPNEXT_URL", "ERPNEXT_API_KEY", "ERPNEXT_API_SECRET"):
                    parts = shlex.split(value, comments=True)
                    configured[key.strip()] = parts[0] if parts else ""
        configured.update(
            {
                key: os.environ[key]
                for key in ("ERPNEXT_URL", "ERPNEXT_API_KEY", "ERPNEXT_API_SECRET")
                if key in os.environ
            }
        )
        return cls(
            configured.get("ERPNEXT_URL", SITE).rstrip("/"),
            configured.get("ERPNEXT_API_KEY", ""),
            configured.get("ERPNEXT_API_SECRET", ""),
            os.environ.get("PERCONTRA_LIVE") == "1",
        )


class ERPNextAdapter:
    name = "erpnext"
    capabilities = Capabilities(
        source_evidence="partial",
        investor_allocation="partial",
        decision_author_reason="partial",
        destination_receipt="unverified",
        change_impact="unverified",
    )

    def __init__(self, connection=None, chart=None, currency="USD"):
        if currency not in ("USD", "GBP"):
            raise ERPError("The live adapter supports same-currency USD or GBP journals only")
        self.connection = connection or Connection.load()
        self.chart = chart or []
        self.currency = currency

    def request(self, method, route, *, params=None, body=None):
        config = self.connection
        if config.url != SITE or not config.key or not config.secret:
            raise ERPError("Configure credentials for the authorised ERPNext site")
        if method != "GET" and not config.live:
            raise ERPError("Live writes are disabled; start the local operator with --live")
        url = config.url + urllib.parse.quote(route, safe="/%")
        if params:
            url += "?" + urllib.parse.urlencode(params)
        headers = {
            "Authorization": "token " + config.key + ":" + config.secret,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        request = urllib.request.Request(
            url,
            method=method,
            headers=headers,
            data=json.dumps(body, default=str).encode() if body is not None else None,
        )
        try:
            with urllib.request.build_opener(NoRedirect).open(request, timeout=20) as response:
                return json.loads(response.read(), parse_float=Decimal)
        except urllib.error.HTTPError as error:
            raise ERPError(
                f"ERPNext returned HTTP {error.code}",
                uncertain=method != "GET" and error.code >= 500,
            ) from None
        except urllib.error.URLError, TimeoutError, json.JSONDecodeError:
            raise ERPError("ERPNext response unavailable", uncertain=method != "GET") from None

    def records(self, doctype, fields, filters):
        records = []
        offset = 0
        while True:
            response = self.request(
                "GET",
                "/api/resource/" + doctype,
                params={
                    "fields": json.dumps(fields),
                    "filters": json.dumps(filters),
                    "limit_start": offset,
                    "limit_page_length": 200,
                    "order_by": "name asc",
                },
            )
            page = response["data"]
            records.extend(page)
            if len(page) < 200:
                return records
            offset += len(page)

    def preflight(self):
        company = self.request("GET", "/api/resource/Company/" + COMPANY)["data"]
        if company.get("name") != COMPANY:
            raise ERPError("Company identity does not match the authorised test company")
        accounts = self.records(
            "Account",
            [
                "name",
                "company",
                "account_name",
                "account_number",
                "account_currency",
                "is_group",
                "root_type",
                "parent_account",
                "disabled",
            ],
            {"company": COMPANY},
        )
        centers = self.records(
            "Cost Center", ["name", "company", "is_group", "disabled"], {"company": COMPANY}
        )
        years = self.records(
            "Fiscal Year", ["name", "year_start_date", "year_end_date", "disabled"], {"disabled": 0}
        )
        problems = []
        if company.get("default_currency") != self.currency:
            problems.append(
                f"Company default currency must be {self.currency}; currently "
                + str(company.get("default_currency"))
            )
        if not any(row["year_start_date"] <= "2026-06-30" <= row["year_end_date"] for row in years):
            problems.append("No enabled fiscal year covers 2026-06-30")
        if not any(
            row["name"] == "Main - CCI" and not row["is_group"] and not row["disabled"]
            for row in centers
        ):
            problems.append("Main - CCI cost center is unavailable")
        return {
            "url": SITE,
            "company": COMPANY,
            "currency": company.get("default_currency"),
            "live_enabled": self.connection.live,
            "problems": problems,
            "accounts": accounts,
            "cost_centers": centers,
            "fiscal_years": years,
        }

    def registries(self, *, handle):
        return self.preflight()

    def account_spec(self, posting):
        target = posting.destination
        matches = [
            row
            for row in self.chart
            if row.values["Trans_Type"] == target.trans_type
            and any(
                ref.table == "CorvusCoA" and ref.source == row.source
                for ref in posting.mappings_used
            )
        ]
        choices = {
            (
                row.values["Account"],
                row.values["Account_Short_Description"],
                row.values["Account_Type"],
            )
            for row in matches
        }
        if len(choices) != 1:
            raise ERPError("Posting has no unambiguous evidenced destination account")
        code, label, kind = choices.pop()
        roots = {
            "Assets": "Asset",
            "Liabilities": "Liability",
            "Capital": "Equity",
            "Equity": "Equity",
            "Revenues": "Income",
            "Expenses": "Expense",
        }
        if kind not in roots:
            raise ERPError("Unsupported account root type")
        return {
            "account_number": code,
            "account_name": label,
            "root_type": roots[kind],
            "company": COMPANY,
            "account_currency": self.currency,
            "is_group": 0,
        }

    def validate(self, *, postings, registries):
        problems = [Block("preflight", message) for message in registries.get("problems", [])]
        debit = credit = Decimal(0)
        dates = set()
        batches = set()
        for posting in postings:
            target = posting.destination
            if posting.status != "ready" or target is None:
                problems.append(Block("unresolved", "Every posting must be resolved"))
                continue
            batches.add(posting.batch_key.model_dump_json())
            dates.add(target.gl_date)
            if target.legal_entity != COMPANY or posting.batch_key.legal_entity != COMPANY:
                problems.append(
                    Block("company", "Only Chalbury postings may leave for this connection")
                )
            if (
                target.transaction_currency != self.currency
                or target.investor_amount_local.currency != self.currency
                or target.investor_amount_le.currency != self.currency
            ):
                problems.append(
                    Block("currency", f"Local and entity amounts must both be {self.currency}")
                )
            value = Decimal(target.investor_amount_local.amount)
            if value != Decimal(target.investor_amount_le.amount):
                problems.append(
                    Block("fx", "Local and entity amounts must agree; no implicit FX conversion")
                )
            if target.investor_quantity not in (None, "", "0"):
                problems.append(
                    Block("quantity", "Journal adapter does not post investment quantities")
                )
            if target.is_debit:
                debit += value
            else:
                credit += value
        if not postings or debit != credit or debit == 0:
            problems.append(Block("balance", "A nonzero, fully balanced journal is required"))
        if len(dates) != 1 or len(batches) != 1:
            problems.append(Block("batch", "One complete batch with one posting date is required"))
        return problems

    def provisioning(self, postings, preflight):
        problems = self.validate(postings=postings, registries=preflight)
        if problems:
            raise ERPError("; ".join(sorted({problem.message for problem in problems})))
        specifications = {
            self.account_spec(posting)["account_number"]: self.account_spec(posting)
            for posting in postings
        }
        plan = []
        for code, spec in specifications.items():
            existing = [row for row in preflight["accounts"] if row.get("account_number") == code]
            if existing:
                if (
                    len(existing) != 1
                    or any(
                        existing[0].get(key) != spec[key]
                        for key in ("company", "account_currency", "root_type", "is_group")
                    )
                    or existing[0].get("disabled")
                ):
                    raise ERPError("Existing account conflicts with approved mapping: " + code)
                plan.append({"action": "reuse", "name": existing[0]["name"], "spec": spec})
            else:
                roots = [
                    row
                    for row in preflight["accounts"]
                    if row["company"] == COMPANY
                    and row["root_type"] == spec["root_type"]
                    and row["is_group"]
                    and not row["parent_account"]
                ]
                if len(roots) != 1:
                    raise ERPError("No unique company root for " + spec["root_type"])
                plan.append(
                    {"action": "create", "spec": {**spec, "parent_account": roots[0]["name"]}}
                )
        return plan

    def provision(self, postings):
        plan = self.provisioning(postings, self.preflight())
        for item in plan:
            if item["action"] == "create":
                saved = self.request("POST", "/api/resource/Account", body=item["spec"])["data"]
                if saved.get("company") != COMPANY:
                    raise ERPError("Unexpected company in account response", uncertain=True)
        return self.provisioning(postings, self.preflight())

    def render(self, *, postings):
        plan = self.provisioning(postings, self.preflight())
        if any(item["action"] != "reuse" for item in plan):
            raise ERPError("Provision the previewed accounts before submitting")
        names = {item["spec"]["account_number"]: item["name"] for item in plan}
        accounts = []
        for posting in postings:
            target = posting.destination
            spec = self.account_spec(posting)
            accounts.append(
                {
                    "account": names[spec["account_number"]],
                    "debit_in_account_currency": target.investor_amount_local.amount
                    if target.is_debit
                    else "0.00",
                    "credit_in_account_currency": "0.00"
                    if target.is_debit
                    else target.investor_amount_local.amount,
                    "exchange_rate": 1,
                    "account_currency": self.currency,
                    "cost_center": "Main - CCI",
                    "user_remark": "Percontra posting " + posting.posting_id,
                }
            )
        document = {
            "doctype": "Journal Entry",
            "company": COMPANY,
            "voucher_type": "Journal Entry",
            "posting_date": str(postings[0].destination.gl_date),
            "accounts": accounts,
            "user_remark": "Percontra batch "
            + postings[0].batch_key.source_batch_id
            + "; investor allocation evidence retained in Percontra",
        }
        return ExportArtifact(
            json.dumps(document, sort_keys=True).encode(),
            "erpnext-journal.json",
            "application/json",
        )

    def submit(self, *, artifact):
        raise ERPError("Submit through the persisted release-controlled submission service")

    def verify_document(self, expected, document):
        for key in ("company", "posting_date", "voucher_type"):
            if document.get(key) != expected[key]:
                raise DestinationDriftError("Destination changed journal field: " + key)

        def lines(rows):
            return Counter(
                (
                    row["account"],
                    Decimal(str(row.get("debit_in_account_currency", 0))),
                    Decimal(str(row.get("credit_in_account_currency", 0))),
                    row.get("cost_center") or "",
                    row.get("user_remark") or "",
                    Decimal(str(row.get("exchange_rate", 1))),
                    row.get("account_currency") or self.currency,
                )
                for row in rows
            )

        if lines(document["accounts"]) != lines(expected["accounts"]):
            raise DestinationDriftError(
                "Destination journal lines differ from the approved artifact"
            )

    def verify_ledger(self, document):
        entries = self.records(
            "GL Entry",
            ["account", "debit", "credit", "account_currency", "company", "is_cancelled"],
            {"company": COMPANY, "voucher_type": "Journal Entry", "voucher_no": document["name"]},
        )
        expected = defaultdict(lambda: [Decimal(0), Decimal(0)])
        actual = defaultdict(lambda: [Decimal(0), Decimal(0)])
        for row in document["accounts"]:
            expected[row["account"]][0] += Decimal(str(row.get("debit_in_account_currency", 0)))
            expected[row["account"]][1] += Decimal(str(row.get("credit_in_account_currency", 0)))
        for row in entries:
            if (
                row["company"] != COMPANY
                or row.get("is_cancelled")
                or row["account_currency"] != self.currency
            ):
                raise DestinationDriftError(
                    "Ledger contains unexpected company, currency or cancellation"
                )
            actual[row["account"]][0] += Decimal(str(row["debit"]))
            actual[row["account"]][1] += Decimal(str(row["credit"]))
        if dict(actual) != dict(expected):
            raise DestinationDriftError("Ledger totals do not match the approved journal")
        return entries
