"""
Move data between Zoho Books and Xero, either direction.

  GET /api/migrate/run?source=zoho&target=xero&entities=contacts,items,invoices&limit=50
  GET /api/migrate/preview?...   same params, extracts + transforms but writes nothing
  GET /api/migrate/seed?target=zoho&n=3   create demo contacts/items/invoices to migrate
  GET /api/migrate/state          source_id -> target_id map (makes re-runs idempotent)
  GET /api/migrate/reset

Shape: source.extract() -> canonical dicts -> target.create(). Existing records in the
target are matched by name / code / invoice number so re-running never duplicates.
"""

import json
import os
import re
import time
from pathlib import Path

import requests
from fastapi import APIRouter, Depends, HTTPException

from auth import optional_user

import zoho

HERE = Path(__file__).parent
DATA_DIR = Path(os.environ.get("PIPER_DATA_DIR", HERE))
STATE_FILE = DATA_DIR / "migration_state.json"
ORDER = ["contacts", "items", "invoices"]  # dependency order

router = APIRouter(prefix="/api/migrate")


def _xero(method, path, body=None):
    import app  # lazy: app imports this module
    return app.xero(method, path, body)


def _err(r: requests.Response) -> str:
    try:
        j = r.json()
    except ValueError:
        return r.text[:300]
    if "Elements" in j:  # Xero validation
        msgs = [e["Message"] for el in j["Elements"] for e in el.get("ValidationErrors", [])]
        return "; ".join(msgs) or j.get("Message", str(j)[:300])
    return j.get("message") or j.get("Message") or j.get("Detail") or str(j)[:300]


def _slug(s: str, n: int = 30) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").upper()[:n] or "ITEM"


# ============================================================ ZOHO
class Zoho:
    name = "zoho"

    def _pages(self, path, params=None):
        page, out = 1, []
        while True:
            r = zoho.books("GET", path, params={**(params or {}), "page": page, "per_page": 200})
            if not r.ok:
                raise HTTPException(r.status_code, f"zoho {path}: {_err(r)}")
            j = r.json()
            out += j.get(path.strip("/"), [])
            if not j.get("page_context", {}).get("has_more_page"):
                return out
            page += 1

    # ---- extract -> canonical
    def extract_contacts(self, limit):
        out = []
        for c in self._pages("/contacts")[:limit]:
            if c.get("status") == "inactive":
                continue
            out.append({"source_id": c["contact_id"], "name": c["contact_name"], "email": c.get("email") or None,
                        "first_name": c.get("first_name") or None, "last_name": c.get("last_name") or None,
                        "phone": c.get("phone") or None, "is_vendor": c.get("contact_type") == "vendor"})
        return out

    def extract_items(self, limit):
        return [{"source_id": i["item_id"], "name": i["name"], "code": i.get("sku") or None,
                 "description": i.get("description") or None, "unit_price": i.get("rate")}
                for i in self._pages("/items")[:limit] if i.get("status") != "inactive"]

    def extract_invoices(self, limit):
        out = []
        for s in self._pages("/invoices")[:limit]:
            if s.get("status") == "void":
                continue
            r = zoho.books("GET", f"/invoices/{s['invoice_id']}")
            if not r.ok:
                continue
            inv = r.json()["invoice"]
            out.append({
                "source_id": inv["invoice_id"], "number": inv.get("invoice_number"),
                "reference": inv.get("reference_number") or None,
                "contact_source_id": inv["customer_id"], "contact_name": inv["customer_name"],
                "date": inv["date"], "due_date": inv.get("due_date") or inv["date"],
                "status": "DRAFT" if inv["status"] == "draft" else ("PAID" if inv["status"] == "paid" else "AUTHORISED"),
                "currency": inv.get("currency_code"), "total": inv.get("total"),
                "lines": [{"description": li.get("description") or li.get("name") or "Line", "name": li.get("name"),
                           "quantity": li.get("quantity", 1), "unit_price": li.get("rate", 0),
                           "item_source_id": li.get("item_id") or None} for li in inv.get("line_items", [])],
            })
        return out

    # ---- find / create in target
    def find_contact(self, name):
        r = zoho.books("GET", "/contacts", params={"contact_name": name})
        for c in (r.json().get("contacts", []) if r.ok else []):
            if c["contact_name"].strip().lower() == name.strip().lower():
                return c["contact_id"]

    def create_contact(self, c):
        body = {"contact_name": c["name"], "contact_type": "vendor" if c.get("is_vendor") else "customer"}
        if c.get("email") or c.get("first_name") or c.get("last_name") or c.get("phone"):
            body["contact_persons"] = [{"first_name": c.get("first_name") or "", "last_name": c.get("last_name") or "",
                                        "email": c.get("email") or "", "phone": c.get("phone") or "",
                                        "is_primary_contact": True}]
        r = zoho.books("POST", "/contacts", json_body=body)
        if not r.ok:
            raise RuntimeError(_err(r))
        return r.json()["contact"]["contact_id"]

    def find_item(self, code, name):
        r = zoho.books("GET", "/items", params={"name": name})
        for i in (r.json().get("items", []) if r.ok else []):
            if i["name"].strip().lower() == name.strip().lower():
                return i["item_id"]

    def create_item(self, i):
        body = {"name": i["name"][:100], "rate": i.get("unit_price") or 0}
        if i.get("description"):
            body["description"] = i["description"]
        if i.get("code"):
            body["sku"] = i["code"]
        r = zoho.books("POST", "/items", json_body=body)
        if not r.ok:
            raise RuntimeError(_err(r))
        return r.json()["item"]["item_id"]

    def find_invoice(self, number):
        if not number:
            return None
        r = zoho.books("GET", "/invoices", params={"invoice_number": number})
        for inv in (r.json().get("invoices", []) if r.ok else []):
            if inv["invoice_number"] == number:
                return inv["invoice_id"]

    def build_invoice(self, inv, contact_id, item_map):
        return {
            "customer_id": contact_id, "invoice_number": inv.get("number"),
            "reference_number": inv.get("reference") or "", "date": inv["date"], "due_date": inv["due_date"],
            "line_items": [{k: v for k, v in {
                "item_id": item_map.get(li.get("item_source_id")),
                "name": (li.get("name") or li["description"])[:100], "description": li["description"],
                "rate": li["unit_price"], "quantity": li["quantity"]}.items() if v is not None}
                for li in inv["lines"]],
        }

    def create_invoice(self, inv, contact_id, item_map, notes):
        body = self.build_invoice(inv, contact_id, item_map)
        r = zoho.books("POST", "/invoices", params={"ignore_auto_number_generation": "true"}, json_body=body)
        if not r.ok and body.get("invoice_number"):
            notes.append(f"invoice {inv['number']}: zoho rejected number ({_err(r)}), let zoho auto-number and kept it in reference")
            body["reference_number"] = f"{body['reference_number']} src#{body.pop('invoice_number')}".strip()
            r = zoho.books("POST", "/invoices", json_body=body)
        if not r.ok:
            raise RuntimeError(_err(r))
        iid = r.json()["invoice"]["invoice_id"]
        if inv["status"] != "DRAFT":
            zoho.books("POST", f"/invoices/{iid}/status/sent")
        if inv["status"] == "PAID":
            notes.append(f"invoice {inv['number']}: was PAID at source; created as sent (payment records not migrated)")
        return iid


# ============================================================ XERO
class Xero:
    name = "xero"
    _sales_account = None

    def _pages(self, path, key):
        page, out = 1, []
        while True:
            sep = "&" if "?" in path else "?"
            r = _xero("GET", f"{path}{sep}page={page}")
            if not r.ok:
                raise HTTPException(r.status_code, f"xero {path}: {_err(r)}")
            batch = r.json().get(key, [])
            out += batch
            if len(batch) < 100:
                return out
            page += 1

    def sales_account(self):
        if not self._sales_account:
            r = _xero("GET", "/Accounts?where=" + requests.utils.quote('Type=="REVENUE" OR Type=="SALES"'))
            accts = r.json().get("Accounts", []) if r.ok else []
            codes = [a["Code"] for a in accts if a.get("Code") and a.get("Status") == "ACTIVE"]
            self._sales_account = "200" if "200" in codes else (codes[0] if codes else "200")
        return self._sales_account

    def extract_contacts(self, limit):
        out = []
        for c in self._pages("/Contacts", "Contacts")[:limit]:
            if c.get("ContactStatus") != "ACTIVE":
                continue
            phone = next((p["PhoneNumber"] for p in c.get("Phones", []) if p.get("PhoneNumber")), None)
            out.append({"source_id": c["ContactID"], "name": c["Name"], "email": c.get("EmailAddress") or None,
                        "first_name": c.get("FirstName") or None, "last_name": c.get("LastName") or None,
                        "phone": phone, "is_vendor": bool(c.get("IsSupplier")) and not c.get("IsCustomer")})
        return out

    def extract_items(self, limit):
        r = _xero("GET", "/Items")
        if not r.ok:
            raise HTTPException(r.status_code, _err(r))
        return [{"source_id": i["ItemID"], "name": i.get("Name") or i["Code"], "code": i["Code"],
                 "description": i.get("Description") or None,
                 "unit_price": (i.get("SalesDetails") or {}).get("UnitPrice")}
                for i in r.json().get("Items", [])[:limit]]

    def extract_invoices(self, limit):
        path = "/Invoices?Statuses=DRAFT,SUBMITTED,AUTHORISED,PAID&where=" + requests.utils.quote('Type=="ACCREC"')
        out = []
        for inv in self._pages(path, "Invoices")[:limit]:
            out.append({
                "source_id": inv["InvoiceID"], "number": inv.get("InvoiceNumber"), "reference": inv.get("Reference") or None,
                "contact_source_id": inv["Contact"]["ContactID"], "contact_name": inv["Contact"]["Name"],
                "date": inv["DateString"][:10], "due_date": (inv.get("DueDateString") or inv["DateString"])[:10],
                "status": "DRAFT" if inv["Status"] in ("DRAFT", "SUBMITTED") else inv["Status"],
                "currency": inv.get("CurrencyCode"), "total": inv.get("Total"),
                "lines": [{"description": li.get("Description") or "Line", "name": li.get("ItemCode"),
                           "quantity": li.get("Quantity", 1), "unit_price": li.get("UnitAmount", 0),
                           "item_source_id": (li.get("Item") or {}).get("ItemID") or li.get("ItemCode") or None}
                          for li in inv.get("LineItems", [])],
            })
        return out

    def find_contact(self, name):
        r = _xero("GET", "/Contacts?where=" + requests.utils.quote(f'Name=="{name.replace(chr(34), chr(92) + chr(34))}"'))
        cs = r.json().get("Contacts", []) if r.ok else []
        return cs[0]["ContactID"] if cs else None

    def create_contact(self, c):
        body = {"Name": c["name"][:255]}
        for src, dst in (("email", "EmailAddress"), ("first_name", "FirstName"), ("last_name", "LastName")):
            if c.get(src):
                body[dst] = c[src]
        if c.get("phone"):
            body["Phones"] = [{"PhoneType": "DEFAULT", "PhoneNumber": c["phone"]}]
        r = _xero("PUT", "/Contacts", {"Contacts": [body]})
        if not r.ok:
            raise RuntimeError(_err(r))
        return r.json()["Contacts"][0]["ContactID"]

    def find_item(self, code, name):
        code = code or _slug(name)
        r = _xero("GET", "/Items?where=" + requests.utils.quote(f'Code=="{code}"'))
        items = r.json().get("Items", []) if r.ok else []
        return items[0]["ItemID"] if items else None

    def create_item(self, i):
        body = {"Code": i.get("code") or _slug(i["name"]), "Name": i["name"][:50]}
        if i.get("description"):
            body["Description"] = i["description"][:4000]
        if i.get("unit_price") is not None:
            body["SalesDetails"] = {"UnitPrice": i["unit_price"], "AccountCode": self.sales_account()}
        r = _xero("PUT", "/Items", {"Items": [body]})
        if not r.ok:
            raise RuntimeError(_err(r))
        return r.json()["Items"][0]["ItemID"]

    def find_invoice(self, number):
        if not number:
            return None
        r = _xero("GET", "/Invoices?where=" + requests.utils.quote(f'InvoiceNumber=="{number}"'))
        invs = r.json().get("Invoices", []) if r.ok else []
        return invs[0]["InvoiceID"] if invs else None

    def build_invoice(self, inv, contact_id, item_map):
        body = {
            "Type": "ACCREC", "Contact": {"ContactID": contact_id},
            "Date": inv["date"], "DueDate": inv["due_date"], "LineAmountTypes": "Exclusive",
            "Status": "DRAFT" if inv["status"] == "DRAFT" else "AUTHORISED",
            "LineItems": [{"Description": li["description"][:4000], "Quantity": li["quantity"],
                           "UnitAmount": li["unit_price"], "AccountCode": self.sales_account()} for li in inv["lines"]],
        }
        if inv.get("number"):
            body["InvoiceNumber"] = inv["number"]
        if inv.get("reference"):
            body["Reference"] = inv["reference"]
        if inv.get("currency"):
            body["CurrencyCode"] = inv["currency"]
        return body

    def create_invoice(self, inv, contact_id, item_map, notes):
        body = self.build_invoice(inv, contact_id, item_map)
        for _ in range(3):
            r = _xero("PUT", "/Invoices", {"Invoices": [body]})
            if r.ok:
                if inv["status"] == "PAID":
                    notes.append(f"invoice {inv['number']}: was PAID at source; created AUTHORISED (payment records not migrated)")
                return r.json()["Invoices"][0]["InvoiceID"]
            msg = _err(r)
            if "unique" in msg.lower() and "InvoiceNumber" in body:
                body["Reference"] = f"{body.get('Reference', '')} src#{body.pop('InvoiceNumber')}".strip()
                notes.append(f"invoice {inv['number']}: number already used in xero, kept in Reference")
            elif "currency" in msg.lower() and "CurrencyCode" in body:
                notes.append(f"invoice {inv['number']}: currency {body.pop('CurrencyCode')} not enabled in xero, used base currency")
            elif "account" in msg.lower() and body["Status"] == "AUTHORISED":
                body["Status"] = "DRAFT"
                notes.append(f"invoice {inv['number']}: {msg}; saved as DRAFT")
            else:
                raise RuntimeError(msg)
        raise RuntimeError(msg)


ADAPTERS = {"zoho": Zoho, "xero": Xero}


# ============================================================ engine
def load_state():
    return json.loads(STATE_FILE.read_text()) if STATE_FILE.exists() else {}


def save_state(s):
    STATE_FILE.write_text(json.dumps(s, indent=2))


def _adapters(source, target):
    if source not in ADAPTERS or target not in ADAPTERS or source == target:
        raise HTTPException(400, f"source/target must be two different of {list(ADAPTERS)}")
    return ADAPTERS[source](), ADAPTERS[target]()


def run_migration(source, target, entities, limit, dry_run):
    src, dst = _adapters(source, target)
    import db
    key = f"user{db.current_user_id.get() or 0}:{source}->{target}"
    state = load_state()
    idmap = state.setdefault(key, {k: {} for k in ORDER})
    notes, report, t0 = [], {}, time.time()

    def ensure_contact(inv):
        cid = idmap["contacts"].get(inv["contact_source_id"]) or dst.find_contact(inv["contact_name"])
        if not cid and not dry_run:
            cid = dst.create_contact({"name": inv["contact_name"]})
            notes.append(f"invoice {inv['number']}: contact '{inv['contact_name']}' was missing in {target}, created it")
        if cid:
            idmap["contacts"][inv["contact_source_id"]] = cid
        return cid or "<contact-would-be-created>"

    for kind in [k for k in ORDER if k in entities]:
        records = getattr(src, f"extract_{kind}")(limit)
        rep = {"extracted": len(records), "created": 0, "matched_existing": 0, "already_migrated": 0,
               "failed": [], "sample_payload": None}
        for rec in records:
            sid = rec["source_id"]
            try:
                if sid in idmap[kind]:
                    rep["already_migrated"] += 1
                    continue
                if kind == "contacts":
                    existing = dst.find_contact(rec["name"])
                    make = lambda: dst.create_contact(rec)  # noqa: E731
                elif kind == "items":
                    existing = dst.find_item(rec.get("code"), rec["name"])
                    make = lambda: dst.create_item(rec)  # noqa: E731
                else:
                    existing = dst.find_invoice(rec.get("number"))
                    cid = ensure_contact(rec)
                    if rep["sample_payload"] is None:
                        rep["sample_payload"] = dst.build_invoice(rec, cid, idmap["items"])
                    make = lambda: dst.create_invoice(rec, cid, idmap["items"], notes)  # noqa: E731
                if existing:
                    idmap[kind][sid] = existing
                    rep["matched_existing"] += 1
                elif dry_run:
                    rep["created"] += 1
                else:
                    idmap[kind][sid] = make()
                    rep["created"] += 1
            except Exception as e:  # noqa: BLE001
                rep["failed"].append({"source_id": sid, "name": rec.get("name") or rec.get("number"), "error": str(e)})
        if kind != "invoices":
            rep["sample_payload"] = records[0] if records else None
        report[kind] = rep
        if not dry_run:
            save_state(state)

    return {"ok": not any(r["failed"] for r in report.values()), "direction": key, "dry_run": dry_run,
            "seconds": round(time.time() - t0, 1), "entities": report, "notes": notes}


# ============================================================ routes
def _parse(source, target, entities):
    ents = [e.strip() for e in entities.split(",") if e.strip()]
    bad = [e for e in ents if e not in ORDER]
    if bad:
        raise HTTPException(400, f"unknown entities {bad}; choose from {ORDER}")
    return source.lower(), target.lower(), ents


@router.get("/preview")
def preview(source: str = "zoho", target: str = "xero", entities: str = "contacts,items,invoices", limit: int = 50, user: dict | None = Depends(optional_user)):
    s, t, e = _parse(source, target, entities)
    return run_migration(s, t, e, limit, dry_run=True)


@router.get("/run")
@router.post("/run")
def run(source: str = "zoho", target: str = "xero", entities: str = "contacts,items,invoices", limit: int = 50, user: dict | None = Depends(optional_user)):
    s, t, e = _parse(source, target, entities)
    result = run_migration(s, t, e, limit, dry_run=False)
    print("migration:", json.dumps(result, indent=2), flush=True)
    return result


@router.get("/seed")
def seed(target: str = "zoho", n: int = 3, user: dict | None = Depends(optional_user)):
    """Create demo contacts, items and invoices in `target` so there is something to migrate."""
    dst = ADAPTERS[target.lower()]()
    tag = time.strftime("%H%M%S")
    contacts = [{"name": f"{nm}", "email": f"{nm.split()[0].lower()}@example.com", "first_name": "Jane", "last_name": "Doe"}
                for nm in ["Harbourline Growth Fund II LP", "Northgate Capital Partners", "Cedar Vale Advisory Ltd",
                           "Ashford Infrastructure Fund", "Meridian Secondary Opportunities"][:n]]
    items = [{"name": nm, "code": _slug(nm), "description": f"{nm} (demo)", "unit_price": price}
             for nm, price in [("Fund Administration Fee", 2500), ("NAV Calculation Service", 1200),
                               ("Investor Reporting Package", 800), ("Capital Call Processing", 450),
                               ("Audit Support", 1500)][:n]]
    out = {"contacts": [], "items": [], "invoices": [], "failed": []}
    cids, item_ids = [], {}
    for c in contacts:
        try:
            cid = dst.find_contact(c["name"]) or dst.create_contact(c)
            cids.append(cid); out["contacts"].append({"id": cid, "name": c["name"]})
        except Exception as e:  # noqa: BLE001
            out["failed"].append({"contact": c["name"], "error": str(e)})
    for i in items:
        try:
            iid = dst.find_item(i["code"], i["name"]) or dst.create_item(i)
            item_ids[i["code"]] = iid; out["items"].append({"id": iid, "name": i["name"]})
        except Exception as e:  # noqa: BLE001
            out["failed"].append({"item": i["name"], "error": str(e)})
    for k, cid in enumerate(cids):
        inv = {"number": f"DEMO-{tag}-{k + 1}", "reference": f"Q3 2026 services", "date": "2026-09-01",
               "due_date": "2026-09-30", "status": "AUTHORISED", "currency": None,
               "lines": [{"description": it["description"], "name": it["name"], "quantity": 1 + k,
                          "unit_price": it["unit_price"], "item_source_id": it["code"]} for it in items[:2]]}
        try:
            iid = dst.create_invoice(inv, cid, item_ids, [])
            out["invoices"].append({"id": iid, "number": inv["number"]})
        except Exception as e:  # noqa: BLE001
            out["failed"].append({"invoice": inv["number"], "error": str(e)})
    return out


@router.get("/state")
def state(user: dict | None = Depends(optional_user)):
    return load_state()


@router.get("/reset")
def reset(user: dict | None = Depends(optional_user)):
    STATE_FILE.unlink(missing_ok=True)
    return {"ok": True}
