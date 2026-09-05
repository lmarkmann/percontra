# ERPNext implementation plan

Status: implementation in progress. Preserve concurrent changes and the JSON contracts.

## Outcome

Implement the real migration core, file adapters and a release-controlled ERPNext connection.
Only https://percontra.l.frappe.cloud and Chalbury Co-Invest L.P. (CCI) may receive writes.
Verify USD, fiscal year 2026 and company-scoped permissions before writing.
Credentials stay in the ignored root .env, never in logs, bundles or committed fixtures.

Two demonstrations share the same core: Westvale and DJ3 supply the two documented
mapping gaps locally; Chalbury batch 639661 supplies 152 real source rows for live posting.
Never relabel those other funds as Chalbury. Chalbury has no documented mapping gap.

## Build order

1. Protect credentials, generate contract models from contracts/*.json, retain source occurrences.
2. Correct workbook ingestion and implement explicit crosswalk generation, decisions,
   version-bound batch approvals, invalidation, comparison and Phase I exports.
3. Add source/destination protocols and registry. CSV needs an explicit column profile;
   Entrilia, Intacct and Investran remain disabled, unverified declarations.
4. Add read-only ERPNext preflight and registries; account provisioning is a separate
   explicit action. Reuse matching USD accounts, reject conflicts, touch no other company.
5. Persist submission intents before writes. Create a draft, read it back, recheck approval,
   submit with frappe.client.submit, then verify the document and GL entries.
6. Add review, evidence, adapter status and receipt UI. Restore one-command demo and tests.

## Invariants

- Core imports contracts, never adapters or persistence. JSON schemas are the contract authority.
- Decimal strings cross internal interfaces; USD display uses comma grouping and dot decimals.
- Preserve duplicate occurrences. Answer-key upload and reconciliation never generate postings.
- Decisions and release history are append-only. Changed dependencies stale only affected approvals.
- Release checks happen server-side before export/submission, and cover complete batches.
- File exports say "Exported; destination not checked". Drafts are not ledger postings.
- ERPNext acceptance requires read-back; unknown outcomes are blocked, never blindly retried.
- Investor/allocation meaning remains in Percontra; ERPNext remarks are references, not fund accounting.
- Live writes require local operator mode. Public hosting has no ERPNext credentials.
- No automatic cancellation, deletion, reclassification or reposting of submitted journals.

## Acceptance

Contract generation is repeatable; exact workbook row references survive blank rows and headers;
11 Westvale and eight in-scope DJ3 postings need decisions; approval changes invalidate the right
batches and persist after restart. Chalbury 639661 balances at USD 127.19 per side with 152 rows.
Test conflicting mappings, foreign-company accounts, wrong currency, missing permissions,
double clicks, ambiguous timeouts, stale submission and draft-versus-submitted receipts.
Verify a real submitted journal and its GL totals, then report the actual achieved scope.

## Sources

- https://docs.frappe.io/framework/user/en/api/rest
- https://docs.frappe.io/erpnext/journal-entry
- https://github.com/frappe/frappe/blob/version-15/frappe/client.py

## Progress

- Credentials excluded from Git and Docker contexts.
