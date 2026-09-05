# ERPNext backend and frontend handoff

Status: live GBP connectivity verified on 2026-09-05; real dataset 02 is tested locally.
Frontend implementation is owned separately. No UI changes are required to run the API tests.

## The evidence we have

The authorised site is https://percontra.l.frappe.cloud. The saved Company record is
`Chalbury Co-Invest L.P.`, abbreviation CCI. Authenticated document and filtered-list
reads both reported GBP, including a no-cache read. This is distinct from a display
format or global default.

At 20:35:35 UTC, the synthetic GBP connectivity run produced receipt
`b28cb40a-acfc-4133-8209-86e1bef2005a`, journal `ACC-JV-2026-00001`, state `verified`.
It contains two GBP lines, 1.00 debit and 1.00 credit, and matching account-level GL entries.
The two newly created accounts are `990001 - Percontra GBP smoke cash - CCI` and
`990002 - Percontra GBP smoke clearing - CCI`, under the existing company asset root.

This proves account provisioning, draft creation, submission and ledger read-back.
It does not prove a USD migration was posted, fund allocation support, or an import
into Investran, Intacct or Entrilia. The GBP fixture and database are separate from
dataset 02. Do not present their amounts as client activity.

## Run and verify the backend

```sh
uv sync --directory api
uv run --directory api pytest -q
uv run --directory api ruff check percontra tests
uv run --directory api pyrefly check 'percontra/**/*.py'
uv run --directory api percontra erpnext-smoke
```

The final command verifies an existing receipt without a remote write. Initial GBP
posting requires `erpnext-smoke --post --confirm-company 'Chalbury Co-Invest L.P.'`.
It is idempotent while its local database is retained. Do not delete that database
to retry, and do not automatically cancel or resubmit a recovered draft.

Verification before the API handoff: 47 pytest tests pass, Ruff passes, and API-scoped
Pyrefly reports zero errors with 37 configured warnings. The broad project check also
scans unrelated `scripts/color/` helpers, whose `palette` imports currently fail; those
frontend-support scripts are outside this API change. The real GBP receipt endpoint
returns HTTP 200, state `verified`, and journal `ACC-JV-2026-00001`.

The normal HTTP operator is `percontra serve --host 127.0.0.1 --port 8080`;
`--live` enables the separate confirmed provision/submit operations. Credentials stay
server-side in the ignored root `.env` or process environment, never in frontend variables.

## Screen and endpoint mapping

| Screen action | Request | Render from response |
|---|---|---|
| Start a handover | `POST /api/upload`, multipart `gl` and `reference`; empty JSON uses the private local pack | `label`, `source_count`, complete `batches`, documented `gaps` |
| Public walkthrough | `POST /api/example` | Explicit synthetic label, the same generation and release engine |
| Select a batch | `GET /api/postings?batch={id}&offset=0&limit=50` | `items` plus `total`; never imply the first page is the whole batch |
| Inspect an amount | `GET /api/postings/{posting_id}/evidence` | `posting`, `source`, `mappings`, `decisions`, `approval` |
| Find a treatment | `GET /api/targets?q=Administration` | Exact chart `row`, `account`, `trans_type`; preserve target spelling |
| Record a decision | `POST /api/decisions` | Refresh overview and selected postings; changed dependencies may now be stale |
| Approve the batch | `POST /api/releases/{batch}/approve` | Full release snapshot and author; not approval of just visible rows |
| Download the loader | `POST /api/exports` | Workbook bytes; filename and label from response headers |
| Check reference parity | `GET /api/compare?batch={id}` | `matched`, `expected`, `missing`, `unexpected`, `fields`, `note` |
| Check connection | `GET /api/connections/erpnext?currency=GBP` | Actual company/currency, `problems`, `live_enabled`, account registry |
| Show the proven connection | `GET /api/connections/erpnext/smoke` | Persisted, clearly synthetic GBP receipt and verification timestamp |
| Refresh the GBP proof | `POST /api/connections/erpnext/smoke` with `{}` | Fresh document/ledger read-back, never a new posting |
| Preview migration accounts | `POST /api/connections/erpnext/preview` | `accounts`: create/reuse, account code, label, root and company |
| Create missing accounts | `POST /api/connections/erpnext/provision` | Re-read account plan; this does not create a journal |
| Submit a migration | `POST /api/submissions` with a stable `Idempotency-Key` | A receipt, not an assumed success banner |
| Refresh a migration receipt | `POST /api/submissions/{id}/verify` | Existing attempt read-back, even after changing the active migration |
| Show adapter coverage | `GET /api/adapters` | Implementation flag and five qualified capabilities |

The default migration connection is USD. The optional GBP preflight and smoke
receipt do not change a migration's currency. Never send USD values as GBP to make
a green connection status appear.

## Mutation payloads

Fetch `GET /api/csrf`, retain its cookie, then send `X-CSRFToken` with each POST.
Only a loopback caller with a local hostname can mutate the review store. There
is no production user authentication in the hackathon build.

Decision:

```json
{"gap_row":2,"target_row":911,"author":"Local reviewer","reason":"Accept the supplied administration-fee proposal after review"}
```

The row numbers refer to the loaded Mapping Gaps and Corvus CoA sheets. Do not
hardcode these as universal IDs; request them from the current run. The two
documented expense gaps accept expense chart rows only.

Approval: `{"author":"Local reviewer"}`. Export and account operations:
`{"batch":"<batch id from overview>"}`. Submission adds
`"confirm_company":"Chalbury Co-Invest L.P."` and the idempotency header.
Persist that header across network retries; do not generate a new key on every click.

Errors use `application/problem+json` with `title`, `status`, `detail`, and `type`.
CSRF failures can return Django's standard 403 page, so the frontend must not assume
every error body is JSON. ERPNext error bodies and credentials are not forwarded.

## Receipt states and language

| State | Meaning | Safe next action |
|---|---|---|
| `prepared` | Intent persisted before the network write | Verify; never assume nothing reached ERPNext |
| `draft_saved` | A saved journal exists, but no ledger posting is claimed | Open the draft; no automatic submit/repost |
| `submitted` | Submission returned, verification not yet complete | Verify |
| `verified` | Submitted document and account-level GL match | Show journal link, digest and verification time |
| `rejected` | Definite rejection before a confirmed remote document | Explain rejection; no automatic retry |
| `unknown` | Outcome cannot be established | Read back by saved name or unique attempt marker; do not repost |
| `drifted` | Document, status, currency, exchange rate or ledger totals changed | Show the mismatch; do not repair the journal automatically |

`posted_at` is intentionally null when the exact posting timestamp is not established.
Use `verified_at` as verification time, not posting time. An Excel artifact always says
`Exported; destination not checked`, regardless of whether the download succeeded.

## Review behavior the UI must preserve

- Treat deciding a mapping and approving a batch as different actions. Require an author and reason for the first, then complete-batch sign-off for the second.
- A new decision version, including the same target with a new reason, invalidates an affected approval. Reverting a target never restores the old approval automatically.
- Display blocked rows and unresolved counts alongside totals. Partial resolved totals are not the balance of a complete batch.
- Amount evidence must show source filename/digest, sheet and physical row, mapping references/versions, decision history and current approval. A graph alone is insufficient.
- Retain the gap's proposed treatment as a proposal, not an approval. The input Approval column is empty.
- Keep the real USD batch, local mapping-gap examples, and synthetic GBP receipt visibly separate.

Real local evidence: Chalbury 639661 has 152 rows and balances at USD 127.19 per side.
All 152 match the reference on ten selected fields, not the full loader. Westvale
995747 has 11 documented gap rows within 44 source rows; DJ3 518551 has eight within
652, plus unsupported mappings that remain blocked. No gap belongs to Chalbury.

## ERPNext documentation behind the implementation

[Frappe REST API](https://docs.frappe.io/framework/user/en/api/rest) documents token
authentication, filtered/paginated resource reads and resource creation. The adapter
creates `/api/resource/Account` and `/api/resource/Journal Entry`; it does not confuse
creation with posting. [frappe.client.submit](https://github.com/frappe/frappe/blob/version-15/frappe/client.py)
provides the explicit document submission operation. [Journal Entry](https://docs.frappe.io/erpnext/journal-entry)
describes the accounting document being submitted.

Read-back verifies company, posting date, voucher type and the multiset of account,
amounts, currency, exchange rate, cost center and posting-ID remarks. The GL check
is per account and currency, not just a global zero balance.
