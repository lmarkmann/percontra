# Environment variables

This file is the env contract for the template. There is no `.env.example` on purpose: `.gitignore` ignores `.env` and `.env.*` without negations, so an example file could never be committed. Instead, create a gitignored `.env.local` at the repo root and copy the lines you need from the block below.

Rules:

- Never commit a file matching `.env*`; the ignore rules exist so a real key cannot land in history.
- Never put server secrets in `VITE_*` vars. Everything with the `VITE_` prefix is inlined into the public browser bundle.
- Every var is optional. A fresh clone builds and runs with none set; each seam stays inert until its keys appear.
- The typed surface is `src/env.ts` (`@t3-oss/env-core` + zod). Add new vars there first, then document them here.

```sh
# --- Site identity ---------------------------------------------------------
# Public origin, no trailing slash. Unlocks absolute OG/Twitter images,
# home canonical + og:url, WebSite JSON-LD, and dist/sitemap.xml emit.
#VITE_APP_URL=https://example.com

# --- API -------------------------------------------------------------------
# HTTP origin for api-client, session, and dashboard fetches (cookie
# credentials included). Unset = demo mode (local fixtures, no network).
# Set to http://localhost:5173 during `pnpm dev` to exercise the local Worker
# (server/index.ts, GET /api/dashboard) instead of demo mode.
#VITE_API_BASE_URL=https://api.example.com

# --- Analytics (requires `pnpm add posthog-js`) -----------------------------
# PostHog project key; enables the lazy, cookieless analytics seam.
#VITE_POSTHOG_KEY=phc_xxxxxxxx
# Override the default EU ingestion host.
#VITE_POSTHOG_HOST=https://eu.i.posthog.com

# --- Error reporting (requires `pnpm add @sentry/react`) --------------------
# Sentry DSN; enables the lazy error-reporting seam (support IDs become
# searchable server-side). Inert without it.
#VITE_SENTRY_DSN=https://xxxxxxxx@o0.ingest.sentry.io/0

# --- Enterprise SSO (requires `pnpm add @workos-inc/authkit-react`) ----------
# WorkOS Client ID (client_...); enables the AuthKit SPA seam.
#VITE_WORKOS_CLIENT_ID=client_xxxxxxxx
# Must match a Redirect URI in the WorkOS Dashboard exactly.
#VITE_WORKOS_REDIRECT_URI=http://localhost:5173
# Custom Authentication API hostname, only if configured in WorkOS.
#VITE_WORKOS_API_HOSTNAME=auth.example.com

```

## Server (Worker) vars

The Worker reads its own vars, separate from the `VITE_*` build-time surface. They live in `wrangler.jsonc` `"vars"` (production; typed into `Env` by `pnpm cf-typegen`) and in a gitignored `.dev.vars` file at the repo root for local dev (`wrangler` and `@cloudflare/vite-plugin` both read it).

```sh
# WorkOS Client ID for server-side JWT verification (server/auth.ts). Not a
# secret; same value as VITE_WORKOS_CLIENT_ID. Verification is keyless (JWKS),
# so no WORKOS_API_KEY exists anywhere in this template. Unset: GET /api/session
# answers 501 and /api/dashboard serves demo fixtures unguarded.
#WORKOS_CLIENT_ID=client_xxxxxxxx
```
