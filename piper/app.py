"""
Xero OAuth2 connectivity check.

Flow:
  1. GET /api/xero/login     -> redirects browser to Xero consent screen
  2. Xero redirects to       -> GET /api/xero/callback?code=...&state=...
     we swap the code for tokens, print them, save to xero_tokens.json,
     and look up the tenants (organisations) the user authorised.
  3. GET /api/xero/check     -> uses the saved token (auto-refreshing) to
     call the Organisation endpoint and prove API access works.
  4. GET /api/xero/refresh   -> force a refresh_token exchange.

Run:  .venv/bin/uvicorn app:app --port 8000 --reload
Then point ngrok at 8000 and open http://localhost:8000/
"""

import json
import os
import secrets
import time
from pathlib import Path

import requests
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

import db
import auth
from auth import optional_user
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse

HERE = Path(__file__).parent
DATA_DIR = Path(os.environ.get("PIPER_DATA_DIR", HERE))
load_dotenv(HERE / ".env")

CLIENT_ID = os.environ["XERO_CLIENT_ID"]
CLIENT_SECRET = os.environ["XERO_SECRET"]
# .env has the key misspelled (REDIRECRT); accept both.
REDIRECT_URI = os.environ.get("XERO_REDIRECT_URI") or os.environ["XERO_REDIRECRT_URI"]
# This app uses Xero's granular scopes; legacy umbrella scopes (accounting.transactions,
# accounting.reports.read) are rejected with invalid_scope. This is every scope enabled
# on the app in the Xero developer portal. Write scopes imply read, but listing both is harmless.
# NOTE: changing scopes requires a fresh /api/xero/login - a refresh keeps the old scope set.
ALL_APP_SCOPES = [
    "openid", "profile", "email", "offline_access",
    # "app.connections" is non-tenanted: client_credentials grant ONLY. Requesting it in the
    # browser flow -> access_denied "Requested wrong apps scopes". Not needed: the
    # /connections endpoint works with a normal user token anyway.
    "accounting.settings", "accounting.settings.read",
    "accounting.contacts", "accounting.contacts.read",
    "accounting.attachments", "accounting.attachments.read",
    "accounting.budgets.read",
    "accounting.payments", "accounting.payments.read",
    "accounting.invoices", "accounting.invoices.read",
    "accounting.banktransactions", "accounting.banktransactions.read",
    "accounting.manualjournals", "accounting.manualjournals.read",
    "accounting.reports.aged.read",
    "accounting.reports.balancesheet.read",
    "accounting.reports.banksummary.read",
    "accounting.reports.budgetsummary.read",
    "accounting.reports.executivesummary.read",
    "accounting.reports.profitandloss.read",
    "accounting.reports.trialbalance.read",
    "accounting.reports.taxreports.read",
    # "accounting.reports.tenninetynine.read",  # US 1099 report; left out for a GB org (add back if needed)
    "payroll.employees", "payroll.employees.read",
    "payroll.payruns", "payroll.payruns.read",
    "payroll.payslip", "payroll.payslip.read",
    "payroll.settings", "payroll.settings.read",
    "payroll.timesheets", "payroll.timesheets.read",
    "files", "files.read",
    "assets", "assets.read",
    "projects", "projects.read",
]
SCOPES = os.environ.get("XERO_SCOPES", " ".join(ALL_APP_SCOPES))
TOKEN_FILE = DATA_DIR / "xero_tokens.json"

AUTHORIZE_URL = "https://login.xero.com/identity/connect/authorize"
TOKEN_URL = "https://identity.xero.com/connect/token"
CONNECTIONS_URL = "https://api.xero.com/connections"
API_BASE = "https://api.xero.com/api.xro/2.0"

app = FastAPI(title="Piper - accounting migration bridge")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.middleware("http")
async def attach_user(request: Request, call_next):
    """Set db.current_user_id for the whole request (dependencies run in a copied context, so it must happen here)."""
    tok = auth._token_from_request(request)
    uid = None
    if tok:
        try:
            uid = int(auth.read_token(tok)["sub"])
        except HTTPException:
            uid = None  # the auth dependency will raise a proper 401 on protected routes
    db.current_user_id.set(uid)
    return await call_next(request)

import zoho  # noqa: E402  (mounts /api/zoho/*)
import migrate  # noqa: E402  (mounts /api/migrate/*)
app.include_router(auth.router)
app.include_router(zoho.router)
app.include_router(migrate.router)


# ---------- token storage ----------

def save_tokens(tokens: dict) -> dict:
    """Per-user row in SQLite when a user is logged in; falls back to the JSON file otherwise."""
    tokens["expires_at"] = int(time.time()) + int(tokens.get("expires_in", 1800))
    uid = db.current_user_id.get()
    if uid:
        db.save_connection(uid, "xero", tokens)
        where = f"db (user {uid})"
    else:
        TOKEN_FILE.write_text(json.dumps(tokens, indent=2))
        where = TOKEN_FILE.name
    print(f"=== XERO TOKENS saved to {where}: scope={tokens.get('scope')} tenants={[t.get('tenantName') for t in tokens.get('tenants', [])]}", flush=True)
    return tokens


def load_tokens() -> dict:
    uid = db.current_user_id.get()
    if uid:
        tokens = db.load_connection(uid, "xero")
        if not tokens:
            raise HTTPException(401, "Xero not connected for this user. Visit /api/xero/login?token=<jwt>.")
        return tokens
    if not TOKEN_FILE.exists():
        raise HTTPException(401, f"No {TOKEN_FILE.name} yet. Visit /api/xero/login first.")
    return json.loads(TOKEN_FILE.read_text())


def exchange(data: dict) -> dict:
    r = requests.post(TOKEN_URL, auth=(CLIENT_ID, CLIENT_SECRET), data=data, timeout=30)
    if not r.ok:
        raise HTTPException(r.status_code, f"Token endpoint error: {r.text}")
    return r.json()


def refresh_tokens(tokens: dict) -> dict:
    fresh = exchange({"grant_type": "refresh_token", "refresh_token": tokens["refresh_token"]})
    fresh["tenants"] = tokens.get("tenants", [])
    return save_tokens(fresh)


def valid_tokens() -> dict:
    tokens = load_tokens()
    if time.time() > tokens.get("expires_at", 0) - 60:
        print("access token expired, refreshing...")
        tokens = refresh_tokens(tokens)
    return tokens


def fetch_tenants(access_token: str) -> list[dict]:
    r = requests.get(CONNECTIONS_URL, headers={"Authorization": f"Bearer {access_token}"}, timeout=30)
    r.raise_for_status()
    return r.json()


def xero(method: str, path: str, json_body: dict | None = None) -> requests.Response:
    """Authenticated call against the Accounting API for the first connected tenant."""
    tokens = valid_tokens()
    tenants = tokens.get("tenants") or fetch_tenants(tokens["access_token"])
    if not tenants:
        raise HTTPException(400, "Token has no connected tenants/organisations.")
    r = requests.request(
        method,
        f"{API_BASE}/{path.lstrip('/')}",
        headers={
            "Authorization": f"Bearer {tokens['access_token']}",
            "Xero-tenant-id": tenants[0]["tenantId"],
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        json=json_body,
        timeout=30,
    )
    print(f"{method} {path} -> {r.status_code}", flush=True)
    return r


def body(r: requests.Response):
    try:
        return r.json()
    except ValueError:
        return r.text[:1000]


# ---------- routes ----------

@app.get("/", response_class=HTMLResponse)
def index():
    has_tokens = TOKEN_FILE.exists()
    return f"""
    <h1>Accounting connectivity check</h1>
    <h2>Migrate</h2>
    <ol>
      <li><a href="/api/migrate/seed?target=zoho&n=3">Seed demo data into Zoho</a> · <a href="/api/migrate/seed?target=xero&n=3">into Xero</a></li>
      <li><a href="/api/migrate/preview?source=zoho&target=xero">Preview Zoho → Xero</a> · <a href="/api/migrate/preview?source=xero&target=zoho">Preview Xero → Zoho</a></li>
      <li><a href="/api/migrate/run?source=zoho&target=xero">RUN Zoho → Xero</a> · <a href="/api/migrate/run?source=xero&target=zoho">RUN Xero → Zoho</a></li>
      <li><a href="/api/migrate/state">ID map</a> · <a href="/api/migrate/reset">Reset ID map</a></li>
    </ol>
    <hr>
    <h2>Zoho Books</h2>
    <p>client_id: <code>{zoho.CLIENT_ID}</code><br>
       redirect_uri: <code>{zoho.REDIRECT_URI}</code><br>
       login starts at: <code>{zoho.ACCOUNTS_DOMAIN}</code> (override with ZOHO_ACCOUNTS_DOMAIN)<br>
       tokens on disk: <b>{'yes' if zoho.TOKEN_FILE.exists() else 'no'}</b></p>
    <ol>
      <li><a href="/api/zoho/login">Login with Zoho</a></li>
      <li><a href="/api/zoho/check">Check API access (Organisations)</a></li>
      <li><a href="/api/zoho/write-read-test">Create a Contact, then read it back</a></li>
      <li><a href="/api/zoho/write-read-test?cleanup=1">Same, then delete it</a></li>
      <li><a href="/api/zoho/contacts">List the "Piper Test" contacts</a></li>
      <li><a href="/api/zoho/refresh">Force token refresh</a> · <a href="/api/zoho/tokens">Show stored tokens</a></li>
    </ol>
    <hr>
    <h2>Xero</h2>
    <p>client_id: <code>{CLIENT_ID}</code><br>
       redirect_uri: <code>{REDIRECT_URI}</code><br>
       tokens on disk: <b>{'yes' if has_tokens else 'no'}</b></p>
    <ol>
      <li><a href="/api/xero/login">Login with Xero</a></li>
      <li><a href="/api/xero/check">Check API access (Organisation)</a></li>
      <li><a href="/api/xero/refresh">Force token refresh</a></li>
      <li><a href="/api/xero/tokens">Show stored tokens</a></li>
    </ol>
    <h3>Write + read test</h3>
    <ul>
      <li><a href="/api/xero/write-read-test">Create a Contact, then read it back</a></li>
      <li><a href="/api/xero/write-read-test?cleanup=1">Same, then archive it</a></li>
      <li><a href="/api/xero/contacts">List the "Piper Test" contacts left behind</a></li>
    </ul>
    """


@app.get("/api/xero/login")
def login(scopes: str | None = None, user: dict | None = Depends(optional_user)):
    """Optional ?scopes=a+b+c (or comma separated) overrides the default scope list, for bisecting.
    Pass ?token=<jwt> so the callback knows which user to attach the connection to."""
    scope = " ".join(scopes.replace(",", " ").split()) if scopes else SCOPES
    state = auth.make_token(user["id"] if user else 0, ttl=600, nonce=secrets.token_urlsafe(8))
    params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": scope,
        "state": state,
    }
    print("requesting scopes:", scope)
    url = requests.Request("GET", AUTHORIZE_URL, params=params).prepare().url
    print("redirecting to", url)
    return RedirectResponse(url)


@app.get("/api/xero/callback")
def callback(request: Request, code: str | None = None, state: str | None = None,
             error: str | None = None, error_description: str | None = None):
    print("callback hit:", dict(request.query_params))
    if error:
        raise HTTPException(400, f"Xero returned error: {error} - {error_description}")
    if not code:
        raise HTTPException(400, "Missing ?code= in callback")
    uid = int(auth.read_token(state or "")["sub"]) if state else 0
    db.current_user_id.set(uid or None)

    tokens = exchange({
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
    })
    try:
        tokens["tenants"] = fetch_tenants(tokens["access_token"])
    except Exception as e:  # noqa: BLE001
        print("could not fetch tenants:", e)
        tokens["tenants"] = []
    save_tokens(tokens)

    return JSONResponse({
        "ok": True,
        "saved_to": str(TOKEN_FILE),
        "scope": tokens.get("scope"),
        "expires_in": tokens.get("expires_in"),
        "tenants": [
            {"tenantId": t["tenantId"], "tenantName": t.get("tenantName"), "tenantType": t.get("tenantType")}
            for t in tokens["tenants"]
        ],
        "next": "/api/xero/check",
    })


@app.get("/api/xero/check")
def check(user: dict | None = Depends(optional_user)):
    tokens = valid_tokens()
    tenants = tokens.get("tenants") or fetch_tenants(tokens["access_token"])
    if not tenants:
        raise HTTPException(400, "Token has no connected tenants/organisations.")
    results = []
    for t in tenants:
        r = requests.get(
            f"{API_BASE}/Organisation",
            headers={
                "Authorization": f"Bearer {tokens['access_token']}",
                "Xero-tenant-id": t["tenantId"],
                "Accept": "application/json",
            },
            timeout=30,
        )
        org = r.json().get("Organisations", [{}])[0] if r.ok else None
        results.append({
            "tenantId": t["tenantId"],
            "tenantName": t.get("tenantName"),
            "status": r.status_code,
            "organisation": {k: org.get(k) for k in ("Name", "LegalName", "OrganisationID", "CountryCode", "BaseCurrency", "OrganisationType")} if org else r.text[:300],
        })
    print("check:", json.dumps(results, indent=2), flush=True)
    return {"ok": all(x["status"] == 200 for x in results), "results": results}


@app.get("/api/xero/write-read-test")
def write_read_test(cleanup: bool = False, user: dict | None = Depends(optional_user)):
    """
    Create a Contact, then read it back by ID. Proves write + read access.
    ?cleanup=1 archives the contact afterwards (Xero contacts can't be deleted via API).
    """
    name = f"Piper Test Contact {time.strftime('%Y-%m-%d %H:%M:%S')}"
    created = xero("PUT", "/Contacts", {
        "Contacts": [{
            "Name": name,
            "FirstName": "Piper",
            "LastName": "Test",
            "EmailAddress": "piper-test@example.com",
        }]
    })
    if not created.ok:
        raise HTTPException(created.status_code, {"step": "create", "response": body(created)})
    contact = created.json()["Contacts"][0]
    contact_id = contact["ContactID"]

    read = xero("GET", f"/Contacts/{contact_id}")
    if not read.ok:
        raise HTTPException(read.status_code, {"step": "read", "contact_id": contact_id, "response": body(read)})
    read_back = read.json()["Contacts"][0]

    result = {
        "ok": read_back["Name"] == name,
        "created": {"ContactID": contact_id, "Name": contact["Name"], "UpdatedDateUTC": contact.get("UpdatedDateUTC")},
        "read_back": {k: read_back.get(k) for k in ("ContactID", "Name", "FirstName", "LastName", "EmailAddress", "ContactStatus")},
    }

    if cleanup:
        archived = xero("POST", f"/Contacts/{contact_id}", {"Contacts": [{"ContactID": contact_id, "ContactStatus": "ARCHIVED"}]})
        result["archived"] = archived.ok
        if not archived.ok:
            result["archive_error"] = body(archived)

    print("write-read-test:", json.dumps(result, indent=2), flush=True)
    return result


@app.get("/api/xero/contacts")
def list_contacts(where: str = 'Name.StartsWith("Piper Test")', user: dict | None = Depends(optional_user)):
    """List contacts (default: only the test ones) so you can see what the write test left behind."""
    r = xero("GET", "/Contacts", None) if not where else \
        xero("GET", f"/Contacts?where={requests.utils.quote(where)}")
    if not r.ok:
        raise HTTPException(r.status_code, body(r))
    return [{k: c.get(k) for k in ("ContactID", "Name", "EmailAddress", "ContactStatus")} for c in r.json()["Contacts"]]


@app.get("/api/xero/refresh")
def refresh(user: dict | None = Depends(optional_user)):
    tokens = refresh_tokens(load_tokens())
    return {"ok": True, "expires_in": tokens.get("expires_in"), "expires_at": tokens["expires_at"]}


@app.get("/api/xero/tokens")
def show_tokens(user: dict | None = Depends(optional_user)):
    return load_tokens()


# ---------- providers / connections (for the dashboard) ----------

PROVIDERS = [
    {"id": "xero", "name": "Xero", "login": "/api/xero/login", "check": "/api/xero/check"},
    {"id": "zoho", "name": "Zoho Books", "login": "/api/zoho/login", "check": "/api/zoho/check"},
]


@app.get("/api/providers")
def providers(user: dict | None = Depends(optional_user)):
    """Providers plus whether the current user has connected each one."""
    conns = db.list_connections(user["id"]) if user else {}
    out = []
    for p in PROVIDERS:
        t = conns.get(p["id"])
        if p["id"] == "xero":
            orgs = [x.get("tenantName") for x in (t or {}).get("tenants", [])]
        else:
            orgs = [x.get("name") for x in (t or {}).get("organizations", [])]
        out.append({**p, "connected": bool(t), "organisations": orgs, "updated_at": (t or {}).get("updated_at")})
    return out


@app.post("/api/providers/{provider}/adopt-file")
def adopt_file(provider: str, user: dict = Depends(auth.current_user)):
    """Attach the tokens from xero_tokens.json / zoho_tokens.json (from the file-based flow) to this user."""
    f = {"xero": TOKEN_FILE, "zoho": zoho.TOKEN_FILE}.get(provider)
    if not f:
        raise HTTPException(404, "unknown provider")
    if not f.exists():
        raise HTTPException(404, f"{f.name} not found")
    db.save_connection(user["id"], provider, json.loads(f.read_text()))
    return {"ok": True, "provider": provider, "user": user["email"]}


@app.delete("/api/providers/{provider}")
def disconnect(provider: str, user: dict = Depends(auth.current_user)):
    db.delete_connection(user["id"], provider)
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=True)
