# Environment variables

Every variable Per Contra reads, in one place. There is no `.env.example` on
purpose: `.gitignore` ignores `.env` and `.env.*` without negations, so an
example file could never be committed. Create a gitignored `.env` at the
repository root and copy the lines you need.

Rules:

- Never commit a file matching `.env*`. The ignore rules exist so a real key
  cannot land in history, and the submission repo is public.
- Never put a secret in a `VITE_*` var. Everything with that prefix is inlined
  into the public browser bundle.
- Every variable is optional. A fresh clone builds, runs and passes its tests
  with none set; `./demo.sh` needs none of them.
- The client surface is typed in `web/src/env.ts` (`@t3-oss/env-core` plus
  `zod/mini`). Add a client var there first, then document it here.

## Client, build time

Inlined into the bundle. Public by construction.

| Var | Effect when set |
| --- | --- |
| `VITE_APP_URL` | Public origin, no trailing slash. Unlocks absolute OG images, the home canonical, and `dist/sitemap.xml`. Inert behind Access, which is where this deployment sits |
| `VITE_API_BASE_URL` | HTTP origin for the API client. Unset means same-origin, which is what the container serves |
| `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST` | Enables the lazy analytics seam. The package is not installed, so this is inert |
| `VITE_SENTRY_DSN` | Enables the lazy error-reporting seam. The package is not installed, so this is inert |

## Server, runtime

Read by Django in `api/percontra/settings.py` unless noted.

| Var | Default | Effect |
| --- | --- | --- |
| `PERCONTRA_DB` | `data/percontra.duckdb` | Ingested workbook content |
| `PERCONTRA_MIGRATION_DB` | `data/migration.duckdb` | The service log: runs, decisions, approvals, submissions |
| `PERCONTRA_WEB_DIR` | unset | Built SPA for WhiteNoise to serve. Unset means API only |
| `PERCONTRA_SECRET_KEY` | random per process | Django secret. Leaving it unset invalidates sessions on restart, which is fine for the demo and wrong for anything durable |
| `PERCONTRA_DEBUG` | off | `1` turns on Django debug. Never in a deployed instance |
| `PERCONTRA_ALLOWED_HOSTS` | `*` | Comma-separated `ALLOWED_HOSTS` |
| `PERCONTRA_EDGE_TOKEN` | unset | Shared secret the edge Worker sends as `X-Edge-Auth` (`api/percontra/edge_auth.py`). **Unset disables the check**, which is what lets local development run with no Worker in front. Set but blank fails closed |
| `PERCONTRA_LIVE` | `0` | `1` permits ERPNext writes. The CLI sets it from `--live` and `--post`; do not set it by hand |

## ERPNext credentials

Read by `api/percontra/adapters/destination/erpnext.py` from the repository-root
`.env` or the process environment. Only the one authorised site is accepted, and
redirects are refused rather than followed with credentials attached.

| Var | Notes |
| --- | --- |
| `ERPNEXT_URL` | Must equal the authorised site or every request is refused |
| `ERPNEXT_API_KEY` | |
| `ERPNEXT_API_SECRET` | Never logged; `Connection` marks both `repr=False` |

## Edge Worker

Set in `edge/wrangler.jsonc` (`ORIGIN`) and as a Worker secret (`EDGE_TOKEN`),
not in any `.env`.

| Var | Notes |
| --- | --- |
| `ORIGIN` | The Cloud Run URL the Worker forwards to |
| `EDGE_TOKEN` | Sent as `X-Edge-Auth`; must match `PERCONTRA_EDGE_TOKEN` on the origin. `wrangler secret put EDGE_TOKEN` |

The Access gate itself is configured in Cloudflare Zero Trust, not here. See
[access-gate.md](../access-gate.md).
