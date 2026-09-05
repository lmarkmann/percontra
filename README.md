# Per Contra

Migration sign-off for fund accounting. When a GL changes, the affected
batches and their approvals are identified, the postings behind each
amount are resolved as version-controlled decisions, and the release is
kept intact against change: an approval is bound to the decision versions
it was granted on, and a changed dependency makes the approval stale
instead of silently re-exporting.

The name is the ledger term for the offsetting side of an entry:
per contra, entry and offset.

## One command

```sh
just demo
```

Builds the web app, ingests the datasets if they are present
(`data/README.md` documents the exact placement), and serves everything
on <http://localhost:8080>.

Other commands:

```sh
just sync    # python environment (first time, or after dependency changes)
just build   # web app only
just ingest  # the three workbooks into DuckDB (idempotent)
just dev     # serve only
just test    # API test suite
just deploy  # Cloud Run
```

## Layout

```
web/           React + TypeScript (Vite), the three app screens
api/           Python 3.14, Django
    percontra/settings  Django settings; no ORM, DuckDB is the store
    percontra/urls      the /api routes and the client-side-route fallback
    percontra/views     the /api surface
    percontra/ingest    xlsx -> DuckDB, keeps (file_digest, sheet, physical_row)
    percontra/generate  candidate postings from source GL + mapping
    percontra/decisions version-controlled decisions
    percontra/release   approvals bound to decision versions; stale on change
    percontra/compare   multiset comparison against the reference loader
data/          the three workbooks (gitignored, see data/README.md)
scripts/       demo orchestration
```

The API serves the built `web/dist` itself through WhiteNoise, so a
deployment is one process and one port. Django runs without its ORM:
`DATABASES` is empty and the auth, sessions and contenttypes apps are
absent, because the data lives in DuckDB and is reached through
`percontra/db.py`.

## Data and privacy

The datasets are real client work, anonymised by Ylookup, and deliberately
not committed. The code reads from the documented local paths in
`data/README.md`; without them the app runs in an empty state that
points reviewers at the dataset pack.

## Contract

The row the two halves of the build agree on is documented in
`docs/posting-contract.md`: a posting with source, mapping, decision and
approval evidence pointers, amounts as decimal strings, identity grouped
by entity.

## Hosting

```sh
gcloud run deploy percontra --source .
```

Single stateless container: the DuckDB file lives in the container,
ingested from a mounted volume or at startup. Multi-user state is
intentionally out of scope for the demo.