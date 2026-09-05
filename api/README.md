# Percontra API

The backend owns migration generation, versioned decisions, complete-batch approval,
export, and ERPNext submission receipts. It runs without the frontend.

Validation: 47 API tests pass, Ruff passes, and API-scoped Pyrefly reports zero errors
with 37 configured warnings. Private-data tests skip when the client pack is absent.

From the repository root:

```sh
uv sync --directory api
uv run --directory api pytest -q
uv run --directory api percontra serve --host 127.0.0.1 --port 8080
```

## Verified live GBP connection

On 2026-09-05 the separate synthetic GBP smoke check created and submitted
`ACC-JV-2026-00001` at https://percontra.l.frappe.cloud, company
`Chalbury Co-Invest L.P.`. Read-back verified both the submitted document and
account-level GL entries: GBP 1.00 debit and GBP 1.00 credit.

It created only `990001 - Percontra GBP smoke cash - CCI` and
`990002 - Percontra GBP smoke clearing - CCI`. Both are GBP asset accounts
under that company's existing asset root. This is test activity, not migrated
client activity; dataset 02 was not relabelled or converted.

Read the existing receipt again, without writing to ERPNext:

```sh
uv run --directory api percontra erpnext-smoke
```

For a fresh test site, explicit initial posting is:

```sh
uv run --directory api percontra erpnext-smoke --post \
  --confirm-company 'Chalbury Co-Invest L.P.'
```

Repeated execution with the same retained smoke database verifies the existing
receipt rather than posting another journal. Do not delete the database to retry
an uncertain outcome. The GBP posting now leaves real test ledger history; no
cancellation or currency change is performed automatically.

Credentials are loaded from the ignored repository-root `.env` or process
environment: `ERPNEXT_URL`, `ERPNEXT_API_KEY`, `ERPNEXT_API_SECRET`. They never
belong in browser configuration. Only the fixed authorised site is accepted;
redirects are refused rather than forwarding credentials.

## Persistence and release safety

- `data/migration.duckdb`: private migrations, decisions, approvals and receipts.
- `data/erpnext-gbp-smoke.duckdb`: separate synthetic live-check history.
- `data/synthetic-gbp-connectivity.json`: the explicit test fixture evidence.
- `data/exports/`: exported workbooks retained by SHA-256 digest.
- `data/uploads/`: original uploaded workbooks.

Core imports generated contracts, not adapters or storage. JSON schemas in
`contracts/` are authoritative; generated Pydantic models ship in this package.
The selected source GL batches are complete, but they are not the entire dataset.

Approvals bind full posting snapshots. New decision versions invalidate affected
approvals even when the target value stays the same. Exports and submissions check
approval on the server. File exports never claim destination acceptance.

Submission intent is persisted before the first remote write. Creation yields a
draft; submission and document/GL read-back are separate operations. Unknown
outcomes block blind retries. Verification uses the original run's registry and
currency, even if the operator has since selected another migration.

## API surface

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/csrf` | CSRF token and cookie for local mutations |
| POST | `/api/example` | Load labelled public fixtures |
| POST | `/api/upload` | Multipart `gl` and `reference`, or local dataset 02 with empty JSON |
| GET | `/api/overview` | Batches, row statuses, totals, gap history and release states |
| GET | `/api/postings?batch=...&offset=0&limit=50` | Paginated canonical postings; limit capped at 200 |
| GET | `/api/postings/{id}/evidence` | Original source rows, mappings, decisions and approval |
| GET | `/api/targets?q=...` | Evidenced expense chart rows for the two documented gaps |
| POST | `/api/decisions` | `gap_row`, `target_row`, `author`, `reason` |
| POST | `/api/releases/{batch}/approve` | Named `author`, complete resolved batch only |
| POST | `/api/exports` | Approved `batch` to workbook bytes |
| GET | `/api/compare?batch=...` | Multiset comparison of ten reference fields |
| GET | `/api/adapters` | Implemented versus declared capability status |
| GET | `/api/connections/erpnext` | Read-only USD migration preflight |
| GET | `/api/connections/erpnext?currency=GBP` | Read-only GBP connectivity preflight |
| GET | `/api/connections/erpnext/smoke` | Persisted, labelled synthetic GBP receipt |
| POST | `/api/connections/erpnext/smoke` | Re-verify the existing GBP journal; never repost |
| POST | `/api/connections/erpnext/preview` | Approved `batch` account plan, no remote writes |
| POST | `/api/connections/erpnext/provision` | Create only missing company-scoped accounts |
| POST | `/api/submissions` | Approved `batch`, `confirm_company`, and `Idempotency-Key` header |
| GET | `/api/submissions` | Latest persisted receipt for each attempt |
| POST | `/api/submissions/{id}/verify` | Read back an existing attempt; no ERPNext write |

POST calls need the CSRF cookie and `X-CSRFToken`, a loopback caller and a local
hostname. ERPNext writes additionally require `serve --live`; the server refuses
non-loopback live binds. There is no production authentication or multi-user
permission system in this demo. Reviewer names are attributed, not authenticated.

The regular migration connection remains USD and still blocks the current GBP
company. GBP verification proves the connection and posting protocol, not that
USD migration amounts can be posted as GBP. See [integration handoff](../docs/erpnext-integration.md)
for frontend states, payloads and evidence requirements.
