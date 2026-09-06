"""
Zoho Books OAuth2 connectivity check (mounted into app.py).

Flow:
  1. GET /api/zoho/login            -> Zoho consent screen (access_type=offline so we get a refresh_token)
  2. GET /api/zoho/callback         -> swap code for tokens, print + save to zoho_tokens.json,
                                       list organisations
  3. GET /api/zoho/check            -> list organisations using the saved token (auto-refresh)
  4. GET /api/zoho/write-read-test  -> create a Contact, read it back, optionally ?cleanup=1 deletes it

Zoho is multi-data-centre. The callback tells us which one the user lives in via
?location=eu&accounts-server=https://accounts.zoho.eu and we persist both, so the
only thing that needs guessing is where to START the login (ZOHO_ACCOUNTS_DOMAIN).
"""

import json
import os
import secrets
import time
from pathlib import Path

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request

import db
import auth
from auth import optional_user
from fastapi.responses import JSONResponse, RedirectResponse

HERE = Path(__file__).parent
DATA_DIR = Path(os.environ.get("PIPER_DATA_DIR", HERE))
load_dotenv(HERE / ".env")

CLIENT_ID = os.environ["ZOHO_CLIENT_ID"]
CLIENT_SECRET = os.environ["ZOHO_CLIENT_SECRET"]
REDIRECT_URI = os.environ["ZOHO_REDIRECT_URL"]
# Where to start the login. Zoho bounces the user to their own DC if Multi-DC is enabled on
# the client; otherwise set this to the right one: accounts.zoho.com / .eu / .in / .com.au / .jp / .uk / .ca
ACCOUNTS_DOMAIN = os.environ.get("ZOHO_ACCOUNTS_DOMAIN", "https://accounts.zoho.eu")
SCOPES = os.environ.get("ZOHO_SCOPES", "ZohoBooks.fullaccess.all")
TOKEN_FILE = DATA_DIR / "zoho_tokens.json"

# location code (from callback) -> Books API host
API_DOMAINS = {
    "us": "https://www.zohoapis.com",
    "eu": "https://www.zohoapis.eu",
    "in": "https://www.zohoapis.in",
    "au": "https://www.zohoapis.com.au",
    "jp": "https://www.zohoapis.jp",
    "uk": "https://www.zohoapis.uk",
    "ca": "https://www.zohoapis.ca",
    "sa": "https://www.zohoapis.sa",
    "cn": "https://www.zohoapis.com.cn",
}

router = APIRouter(prefix="/api/zoho")
_pending_states: set[str] = set()


# ---------- token storage ----------

def save_tokens(tokens: dict) -> dict:
    """Per-user row in SQLite when a user is logged in; falls back to the JSON file otherwise."""
    tokens["expires_at"] = int(time.time()) + int(tokens.get("expires_in", 3600))
    uid = db.current_user_id.get()
    if uid:
        db.save_connection(uid, "zoho", tokens)
        where = f"db (user {uid})"
    else:
        TOKEN_FILE.write_text(json.dumps(tokens, indent=2))
        where = TOKEN_FILE.name
    print(f"=== ZOHO TOKENS saved to {where}: orgs={[o.get('name') for o in tokens.get('organizations', [])]}", flush=True)
    return tokens


def load_tokens() -> dict:
    uid = db.current_user_id.get()
    if uid:
        tokens = db.load_connection(uid, "zoho")
        if not tokens:
            raise HTTPException(401, "Zoho not connected for this user. Visit /api/zoho/login?token=<jwt>.")
        return tokens
    if not TOKEN_FILE.exists():
        raise HTTPException(401, f"No {TOKEN_FILE.name} yet. Visit /api/zoho/login first.")
    return json.loads(TOKEN_FILE.read_text())


def exchange(accounts_server: str, data: dict) -> dict:
    # Zoho docs: params must be sent as query params (not JSON body) on a POST.
    r = requests.post(f"{accounts_server}/oauth/v2/token", params={
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        **data,
    }, timeout=30)
    payload = r.json() if r.headers.get("content-type", "").startswith("application/json") else {"raw": r.text}
    # Zoho returns HTTP 200 with {"error": "invalid_code"} etc, so check the body too.
    if not r.ok or "error" in payload:
        raise HTTPException(400 if r.ok else r.status_code, f"Token endpoint error: {payload}")
    return payload


def refresh_tokens(tokens: dict) -> dict:
    fresh = exchange(tokens["accounts_server"], {
        "grant_type": "refresh_token",
        "refresh_token": tokens["refresh_token"],
    })
    # refresh responses don't echo these back; carry them forward
    for k in ("refresh_token", "accounts_server", "location", "api_domain", "organizations"):
        fresh.setdefault(k, tokens.get(k))
    return save_tokens(fresh)


def valid_tokens() -> dict:
    tokens = load_tokens()
    if time.time() > tokens.get("expires_at", 0) - 60:
        print("zoho access token expired, refreshing...")
        tokens = refresh_tokens(tokens)
    return tokens


# ---------- API helpers ----------

def books(method: str, path: str, params: dict | None = None, json_body: dict | None = None,
          tokens: dict | None = None, org_id: str | None = None) -> requests.Response:
    tokens = tokens or valid_tokens()
    params = dict(params or {})
    if org_id is not False:  # pass org_id=False for endpoints that don't take it (organizations)
        org_id = org_id or (tokens.get("organizations") or [{}])[0].get("organization_id")
        if org_id:
            params["organization_id"] = org_id
    r = requests.request(
        method,
        f"{tokens['api_domain']}/books/v3/{path.lstrip('/')}",
        headers={"Authorization": f"Zoho-oauthtoken {tokens['access_token']}"},
        params=params,
        json=json_body,
        timeout=30,
    )
    print(f"ZOHO {method} {path} -> {r.status_code}", flush=True)
    return r


def body(r: requests.Response):
    try:
        return r.json()
    except ValueError:
        return r.text[:1000]


def fetch_organizations(tokens: dict) -> list[dict]:
    r = books("GET", "/organizations", tokens=tokens, org_id=False)
    if not r.ok:
        raise HTTPException(r.status_code, {"step": "organizations", "response": body(r)})
    return [
        {k: o.get(k) for k in ("organization_id", "name", "country", "currency_code", "is_default_org")}
        for o in r.json().get("organizations", [])
    ]


# ---------- routes ----------

@router.get("/login")
def login(scopes: str | None = None, user: dict | None = Depends(optional_user)):
    """Pass ?token=<jwt> so the callback knows which user to attach the connection to."""
    scope = " ".join(scopes.replace(",", " ").split()) if scopes else SCOPES
    state = auth.make_token(user["id"] if user else 0, ttl=600, nonce=secrets.token_urlsafe(8))
    params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": scope,
        "access_type": "offline",   # required to get a refresh_token
        "prompt": "consent",        # Zoho only issues a refresh_token on an explicit consent
        "state": state,
    }
    url = requests.Request("GET", f"{ACCOUNTS_DOMAIN}/oauth/v2/auth", params=params).prepare().url
    print("zoho: redirecting to", url)
    return RedirectResponse(url)


@router.get("/callback")
def callback(request: Request, code: str | None = None, state: str | None = None,
             location: str | None = None, error: str | None = None):
    q = dict(request.query_params)
    print("zoho callback hit:", q)
    if error:
        raise HTTPException(400, f"Zoho returned error: {error}")
    if not code:
        raise HTTPException(400, "Missing ?code= in callback")
    uid = int(auth.read_token(state or "")["sub"]) if state else 0
    db.current_user_id.set(uid or None)

    accounts_server = q.get("accounts-server") or ACCOUNTS_DOMAIN
    tokens = exchange(accounts_server, {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
    })
    tokens["accounts_server"] = accounts_server
    tokens["location"] = location
    # Zoho's token response includes api_domain; fall back to the location map.
    tokens["api_domain"] = tokens.get("api_domain") or API_DOMAINS.get(location or "", "https://www.zohoapis.com")
    if "refresh_token" not in tokens:
        print("WARNING: no refresh_token in response - was this client already consented? Revoke and retry.")
    save_tokens(tokens)  # save before org lookup so a failure there still leaves us with tokens

    try:
        tokens["organizations"] = fetch_organizations(tokens)
    except HTTPException as e:
        print("could not fetch organisations:", e.detail)
        tokens["organizations"] = []
    save_tokens(tokens)

    return JSONResponse({
        "ok": True,
        "saved_to": str(TOKEN_FILE),
        "location": location,
        "accounts_server": accounts_server,
        "api_domain": tokens["api_domain"],
        "scope": tokens.get("scope"),
        "has_refresh_token": "refresh_token" in tokens,
        "organizations": tokens["organizations"],
        "next": "/api/zoho/check",
    })


@router.get("/check")
def check(user: dict | None = Depends(optional_user)):
    tokens = valid_tokens()
    orgs = fetch_organizations(tokens)
    tokens["organizations"] = orgs
    save_tokens(tokens)
    print("zoho check:", json.dumps(orgs, indent=2), flush=True)
    return {"ok": bool(orgs), "organizations": orgs}


@router.get("/write-read-test")
def write_read_test(cleanup: bool = False, user: dict | None = Depends(optional_user)):
    """Create a Contact in Zoho Books, read it back by id, optionally delete it (?cleanup=1)."""
    name = f"Piper Test Contact {time.strftime('%Y-%m-%d %H:%M:%S')}"
    created = books("POST", "/contacts", json_body={
        "contact_name": name,
        "contact_type": "customer",
        "contact_persons": [{"first_name": "Piper", "last_name": "Test",
                             "email": "piper-test@example.com", "is_primary_contact": True}],
    })
    if not created.ok:
        raise HTTPException(created.status_code, {"step": "create", "response": body(created)})
    contact = created.json()["contact"]
    contact_id = contact["contact_id"]

    read = books("GET", f"/contacts/{contact_id}")
    if not read.ok:
        raise HTTPException(read.status_code, {"step": "read", "contact_id": contact_id, "response": body(read)})
    read_back = read.json()["contact"]

    result = {
        "ok": read_back["contact_name"] == name,
        "created": {"contact_id": contact_id, "contact_name": contact["contact_name"], "created_time": contact.get("created_time")},
        "read_back": {k: read_back.get(k) for k in ("contact_id", "contact_name", "contact_type", "email", "status")},
    }
    if cleanup:
        deleted = books("DELETE", f"/contacts/{contact_id}")
        result["deleted"] = deleted.ok
        if not deleted.ok:
            result["delete_error"] = body(deleted)

    print("zoho write-read-test:", json.dumps(result, indent=2), flush=True)
    return result


@router.get("/contacts")
def list_contacts(search: str = "Piper Test", user: dict | None = Depends(optional_user)):
    r = books("GET", "/contacts", params={"contact_name_contains": search})
    if not r.ok:
        raise HTTPException(r.status_code, body(r))
    return [{k: c.get(k) for k in ("contact_id", "contact_name", "email", "status")} for c in r.json().get("contacts", [])]


@router.get("/refresh")
def refresh(user: dict | None = Depends(optional_user)):
    tokens = refresh_tokens(load_tokens())
    return {"ok": True, "expires_in": tokens.get("expires_in"), "expires_at": tokens["expires_at"]}


@router.get("/tokens")
def show_tokens(user: dict | None = Depends(optional_user)):
    return load_tokens()
