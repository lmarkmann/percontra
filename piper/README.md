# Piper backend — integration guide

## What this is

Piper is an accounting-software migration bridge. A user connects a **source** accounting
system and a **target** accounting system via OAuth, and Piper reads the source data,
reshapes it into the target's schema, and creates it there. Today it supports **Zoho Books**
and **Xero** in both directions. The design is source → canonical record → target, so adding
a third provider means one adapter, not a new pair of mappings.

Why: private-equity fund administrators spend 6–12 months migrating a client between admin
firms, mostly by hand. Piper collapses that to minutes for the structured data.

This document describes the backend API so a dashboard (or Claude Code working on one) can
integrate with it. The backend is a single FastAPI app, Python 3.12+, SQLite, no ORM.

```
Dashboard  ──JWT──▶  Piper API (FastAPI :8000)  ──OAuth2──▶  Xero / Zoho Books
                         │
                         └── piper.db (users, per-user provider tokens)
```

## Files

| File | Purpose |
|---|---|
| `app.py` | FastAPI app, CORS, auth middleware, **Xero** OAuth + API helper, `/api/providers`, HTML index page at `/` |
| `zoho.py` | **Zoho Books** OAuth + API helper, mounted at `/api/zoho/*` |
| `migrate.py` | Migration engine: Zoho and Xero adapters (extract + create), idempotent run, preview, seed |
| `auth.py` | JWT register/login/me, password hashing, `current_user` / `optional_user` dependencies |
| `db.py` | SQLite: `users` and `connections` tables; `current_user_id` contextvar |
| `Dockerfile`, `docker-compose.yml` | Container build; persisted files live in `PIPER_DATA_DIR` (`/data` in Docker) |
| `.env` | Secrets (see below). Not committed. |

## Running locally

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app:app --port 8000 --reload
ngrok http --url=<your-ngrok-domain> 8000      # OAuth callbacks must reach the server
```

Interactive docs: `http://localhost:8000/docs`. A clickable test page is at `/`.

### Environment variables

| Var | Notes |
|---|---|
| `XERO_CLIENT_ID`, `XERO_SECRET` | From the Xero developer portal |
| `XERO_REDIRECT_URI` (or the misspelled `XERO_REDIRECRT_URI`, both accepted) | Must exactly match a redirect URI registered on the Xero app, e.g. `https://<host>/api/xero/callback` |
| `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REDIRECT_URL` | Same idea, `https://<host>/api/zoho/callback` |
| `ZOHO_ACCOUNTS_DOMAIN` | Where the Zoho login starts. Default `https://accounts.zoho.eu`. Multi-DC is enabled so the callback tells us the user's real region. |
| `XERO_SCOPES`, `ZOHO_SCOPES` | Optional overrides. Defaults request every scope the apps have. |
| `JWT_SECRET` | Optional. Dev default exists. Changing it invalidates all issued JWTs. |
| `PIPER_DATA_DIR` | Optional. Where `piper.db`, token files, and migration state are written. Default: project dir. |

## Authentication model

- **Dashboard → Piper:** JWT, HS256, 24h expiry, carries only the user id. Send it as
  `Authorization: Bearer <jwt>`. The host/domain is irrelevant to the token.
- **Browser navigations** (the two OAuth `/login` routes) cannot set headers, so pass
  `?token=<jwt>` instead. The user id is embedded in the OAuth `state` parameter as a
  short-lived signed JWT, so the callback knows which user to attach the connection to.
- **No JWT at all** still works: every route falls back to file-based tokens
  (`xero_tokens.json`, `zoho_tokens.json`). This exists for local testing; the dashboard
  should always send a JWT.
- Passwords are hashed with PBKDF2-SHA256 (stdlib). Minimum length 4 (hackathon setting).
- The current user id is set in an HTTP middleware into a contextvar that all token
  load/save code reads. FastAPI dependencies run in a copied context, so setting it in a
  dependency alone does **not** work; keep it in the middleware.

## Provider connections

Each user has at most one connection per provider, stored as a JSON blob in
`connections(user_id, provider, tokens)`. The blob holds access + refresh tokens, expiry,
and the tenants (Xero) or organisations (Zoho). Access tokens refresh automatically when
within 60 seconds of expiry. All API calls target the **first** tenant/organisation.

Provider quirks that are already handled:

- **Xero** uses granular scopes only (app created after March 2026). Legacy umbrella scopes
  such as `accounting.transactions` return `invalid_scope`. `app.connections` is
  client-credentials-only and must not be requested in the browser flow. Scopes are
  additive; changing them requires a fresh consent.
- **Zoho** only issues a refresh token when `access_type=offline` and `prompt=consent` are
  both sent. Grant codes are single-use and expire in 2 minutes. Token endpoint params must
  be query params. The callback's `accounts-server` and `location` decide which regional
  host to use for tokens and API calls.

## Endpoints

All JSON. Errors are FastAPI-style `{"detail": ...}` with 4xx/5xx.

### Auth

| Method | Path | Body / params | Returns |
|---|---|---|---|
| POST | `/api/auth/register` | `{email, password}` | `{token, token_type, expires_in, user:{id,email}}` |
| POST | `/api/auth/login` | `{email, password}` | same |
| GET | `/api/auth/me` | Bearer | `{id, email, created_at}` |

409 if the email already exists, 401 on bad credentials.

### Providers

| Method | Path | Notes |
|---|---|---|
| GET | `/api/providers` | `[{id, name, login, check, connected, organisations:[names], updated_at}]` for the current user |
| GET | `/api/xero/login?token=<jwt>` | Redirects to Xero consent. Open in a new tab. Optional `&scopes=a+b` override. |
| GET | `/api/zoho/login?token=<jwt>` | Redirects to Zoho consent. Same. |
| GET | `/api/xero/callback`, `/api/zoho/callback` | Hit by the provider, not the dashboard. Exchanges the code, stores tokens on the user, returns a JSON summary. |
| GET | `/api/xero/check` | Calls Xero `Organisation` for every tenant → `{ok, results:[{tenantId, tenantName, status, organisation}]}` |
| GET | `/api/zoho/check` | Lists Zoho organisations → `{ok, organizations:[{organization_id, name, country, currency_code}]}` |
| DELETE | `/api/providers/{xero\|zoho}` | Removes the connection for this user |
| POST | `/api/providers/{xero\|zoho}/adopt-file` | Copies the file-based tokens onto this user. Dev convenience. |

**Connect flow for the dashboard:** open the login URL in a new tab, then poll
`/api/providers` until the provider shows `connected: true`. The callback tab can be closed.

### Migration

| Method | Path | Params (all optional) |
|---|---|---|
| GET | `/api/migrate/preview` | `source=zoho` `target=xero` `entities=contacts,items,invoices` `limit=50` |
| GET or POST | `/api/migrate/run` | same |
| GET | `/api/migrate/seed` | `target=zoho` `n=3` — creates demo contacts, items, and invoices in that provider |
| GET | `/api/migrate/state` | The source-id → target-id map, keyed `user<id>:<source>-><target>` |
| GET | `/api/migrate/reset` | Deletes the map (records already in the target are still matched by name/number, so re-running won't duplicate) |

`source` and `target` are any two different values of `zoho`, `xero`.
`entities` is a subset of `contacts`, `items`, `invoices`; they always run in that order
because invoices depend on contacts and items.

Preview and run return the same shape. Preview extracts and transforms but writes nothing.

```json
{
  "ok": true,
  "direction": "zoho->xero",
  "dry_run": false,
  "seconds": 4.2,
  "entities": {
    "contacts": {
      "extracted": 3,
      "created": 1,
      "matched_existing": 2,
      "already_migrated": 0,
      "failed": [{"source_id": "…", "name": "…", "error": "provider's message"}],
      "sample_payload": {"…first record as it will be sent to the target…"}
    },
    "items": {"…"},
    "invoices": {"…"}
  },
  "notes": [
    "invoice DEMO-1: number already used in xero, kept in Reference",
    "invoice INV-7: was PAID at source; created AUTHORISED (payment records not migrated)"
  ]
}
```

- `ok` is false if any entity has failures. Failures never abort the run.
- `notes` lists every place the data had to be adapted rather than copied. Surface these
  to the user; they are the "what to check by hand" list.

### Debug / utility

| Path | Purpose |
|---|---|
| `GET /api/xero/write-read-test?cleanup=1` | Creates a Contact in Xero, reads it back, archives it |
| `GET /api/zoho/write-read-test?cleanup=1` | Same in Zoho, deletes it |
| `GET /api/xero/contacts?where=…` / `GET /api/zoho/contacts?search=…` | List contacts (defaults to the test ones) |
| `GET /api/{xero\|zoho}/refresh` | Force a token refresh |
| `GET /api/{xero\|zoho}/tokens` | Dump the stored token blob for the current user |

## How the migration engine works

`migrate.py` has one adapter class per provider (`Zoho`, `Xero`) with the same surface:

```
extract_contacts / extract_items / extract_invoices   -> list of canonical dicts
find_contact(name) / find_item(code, name) / find_invoice(number)  -> target id or None
create_contact / create_item / create_invoice          -> target id
build_invoice(inv, contact_id, item_map)               -> target payload (used by preview)
```

Canonical records are plain dicts:

```
contact: {source_id, name, email, first_name, last_name, phone, is_vendor}
item:    {source_id, name, code, description, unit_price}
invoice: {source_id, number, reference, contact_source_id, contact_name, date, due_date,
          status: DRAFT|AUTHORISED|PAID, currency, total,
          lines: [{description, name, quantity, unit_price, item_source_id}]}
```

`run_migration` walks the entities in dependency order. For each source record:

1. If its source id is already in the id map → `already_migrated`, skip.
2. Else look it up in the target by name (contacts), code (items), or invoice number → if
   found, record the mapping as `matched_existing`.
3. Else create it and record the new id as `created`.
4. Any exception is caught per record and appended to `failed`.

For invoices the engine resolves the contact through the id map, then by name in the
target, and as a last resort creates a minimal contact. Line items link to migrated items
where the id map knows them, otherwise they are free-text lines.

Field adaptations that get written to `notes`:

- Duplicate invoice number in the target → number moved into the reference field.
- Currency not enabled in Xero → dropped, base currency used.
- Xero rejects an authorised invoice (account/tax) → saved as draft.
- Paid invoices → created as authorised/sent; payments are not migrated yet.

Not yet migrated: chart of accounts, tax rates, payments, bills, bank transactions,
credit notes, attachments. Zoho line-item taxes are ignored; Xero applies the sales
account's default tax. Xero's sales account is auto-detected (prefers code `200`).

## Adding a provider

1. Create `<provider>.py` with OAuth login/callback/refresh, `save_tokens`/`load_tokens`
   using `db.save_connection`/`db.load_connection` with the `db.current_user_id` contextvar,
   and an authenticated request helper. Copy `zoho.py` as the template.
2. Add an adapter class in `migrate.py` with the surface above and register it in `ADAPTERS`.
3. Add an entry to `PROVIDERS` in `app.py` and include the router.

## Demo notes

- A demo user exists in the local DB: `demo@piper.dev` / `demo1234`, connected to both providers.
- Connected orgs: Xero "mcnix ltd" (GB, GBP), Zoho Books "codini" (UK, GBP).
- Demo script: seed into Zoho → preview Zoho→Xero → run → show Xero → run Xero→Zoho.
- Xero rate limit is ~60 calls/min per tenant; the demo volumes are far below this.
- Deploying elsewhere requires registering the new callback URLs on both developer apps and
  re-consenting. For the demo, ngrok is the registered host; keep using it.
