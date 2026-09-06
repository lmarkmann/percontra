# Architecture

Per Contra takes a fund administrator's source general ledger, generates the
rows a destination accounting system would accept, and refuses to release any
of them until a human has resolved every documented gap and approved the batch
as a whole. The product is the sign-off, not the conversion: every posting
carries pointers back to the exact source cell it came from, and an approval is
bound to the exact decision versions it was granted against.

One repository, four deployables, one language boundary.

## The request path

```text
browser
  |
  v
Cloudflare Access            authenticates; unauthenticated requests stop here
  |
  v
edge/proxy.ts (Worker)       forwards to Cloud Run on Host, adds X-Edge-Auth,
  |                          answers GET /api/session from the Access identity
  v
Cloud Run (Dockerfile)       one container
  |
  +-- WhiteNoise             serves the built SPA from web/dist/client
  +-- Django (api/)          /api/* only
        |
        v
      DuckDB                 data/percontra.duckdb, data/migration.duckdb
```

Cloud Run publishes a URL that is deterministic from the service name, project
number and region, so it cannot be hidden. `api/percontra/edge_auth.py` rejects
anything without the shared `X-Edge-Auth` header, which is what makes the Access
gate the only door rather than merely the front one. An unset secret disables
the check so local development and `./demo.sh` work with no Worker in front.

## The four deployables

| Piece | Lives in | Runs as |
| --- | --- | --- |
| SPA | `web/` | Vite build, static files served by WhiteNoise |
| API | `api/percontra/` | Django ASGI under uvicorn |
| Edge gate | `edge/proxy.ts` | Cloudflare Worker, `edge/wrangler.jsonc` |
| CLI | `api/percontra/cli.py` | `percontra` console script (typer) |

The CLI and the API share every module below the view layer, so `percontra
ingest` and a POST to `/api/example` reach the same generator.

## Data flow

```text
three .xlsx workbooks
  | ingest/xlsx.py, ingest/load.py        digest, sheet, physical_row per cell
  v
DuckDB  (percontra.duckdb)
  | adapters/source/xlsx_investor_gl.py   source rows plus their registries
  v
core/generate.py                          crosswalks, gaps, batch preference
  | one Posting per source row, each ready | needs_decision | blocked
  v
core/decisions.py                         a versioned resolution per gap row
  |
  v
core/release.py                           approval bound to decision versions
  | snapshot() refuses a stale approval
  v
adapters/destination/                     xlsx_phase1_loader.py | erpnext.py
```

Lineage is three columns carried end to end: `file_digest`, `sheet_name`,
`physical_row`. `physical_row` is 1-based and counts the header, so it matches
what a human sees in Excel. The evidence dialog in the UI resolves a posting
back to those coordinates; nothing in the pipeline may drop them.

`core/compare.py` diffs generated output against the client's own verified
loader, which is how the demo shows the tool agreeing with work already done by
hand.

## State

Two DuckDB files, both regenerable, neither committed:

- `data/percontra.duckdb` is ingested workbook content, keyed by file digest.
  Re-ingesting an unchanged file is skipped.
- `data/migration.duckdb` is the service log: one row per run in
  `migration_runs`, and an append-only `migration_events` stream for
  activations, decisions, approvals, exports and submissions.

Each database has exactly one schema owner: `db.py` holds the DDL for the
ingest side, `store.py` for the service log. `views.py` and `ingest/load.py`
query through `db.connect`; nothing else opens a connection. Everything above
`store.py` appends through `MigrationService`, which holds a process-wide
`RLock` because DuckDB is single-writer and the approval check must not
interleave with a release.

## The contract

`contracts/*.schema.json` is the single source. `scripts/contracts.py`
generates `api/percontra/contract/models.py` (pydantic) and
`web/src/contract/migration.ts` (TypeScript) from it, and CI runs the same
script with `--check` so a hand edit to either artifact fails the build. Change
the schema first; both sides follow.

Errors cross the wire as RFC 9457 `application/problem+json`.

## Decisions worth knowing

- The demo is closed by Cloudflare Access, not an in-app password
  ([ADR 008](../adr/008-cloudflare-access-instead-of-basic-auth.md)); the
  operating detail is in [access-gate.md](../access-gate.md).
- First paint comes from a static shell in `index.html`, not SSR
  ([ADR 005](../adr/005-static-shell-not-ssr.md)).
- Colors are the Patina way ([ADR 006](../adr/006-patina-color-way.md)); the
  measured pairs are in [frontend/color-report.md](../frontend/color-report.md).
- Style and comment policy come from
  [ADR 001](../adr/001-mdn-and-google-style-guide-adoption.md) and
  [ADR 004](../adr/004-comment-placement-policy.md).
- The API is Python and the wire format is orjson throughout; the package
  targets 3.14 and uses no pre-3.14 compatibility syntax.

## Deliberately absent

No SSR, no service mesh, no message queue, no ORM, no second database. Mutating
routes are refused unless the request arrives on loopback, so the operator
surface is the local instance and the deployed demo is read-only by
construction. ERPNext writes need `--live` on top of that.

## Running it

```sh
./demo.sh                 # check tools, build, ingest, serve on :8080
just dev                  # serve only
uv run --directory api pytest
just lint                 # ruff, pyrefly, contract drift
```
