# Deploy checklist: vite-template

**Status:** Living document
**Last updated:** 2026-07-11
**Scope:** Cloudflare Workers (thin Hono Worker + static assets), solo/small-team maintained, no on-call rotation. The Worker is stateless and databaseless; there is no separate backend service.

This is the **per-deploy** checklist: what to check before and after every push to `main`. For the one-time-per-domain zone setup (DNS, TLS, WAF, custom domain), see `.claude/CLAUDE.md`, section "First deploy (Cloudflare)"; do not duplicate that list here, link to it. Forks leaving Cloudflare entirely (static host, Tauri, Node): see [detach-cloudflare.md](./detach-cloudflare.md).

Every successful `ci` workflow on `main` triggers `.github/workflows/deploy.yml` for the exact tested commit once `CLOUDFLARE_API_TOKEN` is a repo secret. Failed or cancelled CI runs do not deploy. There is no staging environment or manual approval gate, so the CI suite remains the production gate.

---

## Pre-deploy

- [ ] CI is green on the commit being merged to `main` (`.github/workflows/ci.yml`): oxfmt, oxlint, `tsc -b`, knip, `pnpm audit --prod --audit-level high`, Vitest with coverage, `pnpm build`, `size-limit`, Lighthouse, and all Playwright projects including Worker API and mobile overflow coverage.
- [ ] If you enabled **WorkOS** (`VITE_WORKOS_CLIENT_ID`), **PostHog** (`VITE_POSTHOG_KEY`), or **Sentry** (`VITE_SENTRY_DSN`) since the last deploy: confirm the matching `pnpm add` ran (`@workos-inc/authkit-react`, `posthog-js`, `@sentry/react`) and that `.env.local` values are mirrored into the deploy environment (Cloudflare Pages/Workers env vars or GitHub secrets, since `VITE_*` values are baked in at build time, not read at runtime). The build now fails loudly on this misconfiguration: `optional-seams` throws at resolve time when a seam env var is set but its SDK is not installed, naming the exact `pnpm add` command. Only with the env var unset does the silent no-op stub ship, which is the intended fresh-clone behavior.
- [ ] `package.json#size-limit` budgets still make sense for what actually shipped (`pnpm build && pnpm size`); a budget bump needs a one-line reason in the PR, never a silent raise to make a red check pass.
- [ ] If `public/_headers` or the wired analytics/auth origins changed: re-derive the policy per "Composing the CSP" below; a CSP that doesn't list every connect/script origin you just wired (PostHog, WorkOS) will break in production, not in dev.
- [ ] `wrangler.jsonc` still has no `routes` or custom-domain entry (that field is set once by hand in the dashboard, never in config; see the rule in `.claude/CLAUDE.md`).
- [ ] No secrets in the diff: `VITE_*` vars are public-by-construction (client bundle); nothing server-only (a future `WORKOS_API_KEY`, DB credentials) belongs in this repo's env files.

## Deploy

- [ ] Push to `main` or merge the PR. After `ci` succeeds, `deploy.yml` checks out that workflow's exact commit, runs `pnpm build`, and deploys through `wrangler-action` only when `CLOUDFLARE_API_TOKEN` is present. With no token, the deploy workflow exits without shipping.
- [ ] Watch the Action run: `pnpm build` writes `dist/client/` (browser assets) plus `dist/vite_template/` (Worker bundle and generated `dist/vite_template/wrangler.json`); `wrangler deploy` follows the `.wrangler/deploy` redirect automatically. A failure here is almost always a build failure caught late, not a Cloudflare-side issue; check the build step's log first.
- [ ] If this is a first deploy or the Worker config changed: confirm `main` is `server/index.ts` and `run_worker_first` still covers `/api/*` in `wrangler.jsonc`; API routes silently falling through to asset serving is the failure mode this catches.

## Post-deploy smoke test

- [ ] Load `/`, `/showcase`, `/login`, `/dashboard` (should redirect to `/login` unauthenticated), and an unknown path (should render the in-app 404, not `public/404.html`; that file is only a fallback for non-GET/asset misses).
- [ ] `curl -sI https://<domain>/` and confirm `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` are present (`public/_headers`), and that `/assets/*` responses carry `Cache-Control: public, max-age=31536000, immutable`.
- [ ] If WorkOS is enabled: actually sign in with a real WorkOS account and confirm `/dashboard` loads. Do not rely on the demo-login E2E test passing as a proxy for this, it exercises a different code path (see the auth-seam item in the review below).
- [ ] Confirm `robots.txt` served correctly and, if this is a first deploy, that Cloudflare's **AI Bot Blocking** and **AI Labyrinth** are OFF in the dashboard (Cloudflare defaults new zones to blocking AI crawlers, which silently overrides this repo's welcoming `robots.txt`).
- [ ] Spot-check the Cloudflare dashboard zone settings haven't drifted from the one-time setup (TLS Full-strict, Always Use HTTPS, the `www` to apex redirect rule); these are dashboard-side, not in git, so nothing catches drift automatically.

## Rollback

- [ ] Cloudflare Workers keeps deployment history: roll back from the dashboard (Workers & Pages > your Worker > Deployments) to the last known-good version, or redeploy the last known-good commit (`git checkout <sha> -- . && pnpm deploy:cf`, or re-run the GitHub Action on that commit).
- [ ] The Worker and the assets version together as one deployment, and the Worker is stateless (no database, no migrations), so rollback is still just "ship the previous version"; the main advantage of this deploy shape over anything with persistent state.
- [ ] Log what broke and what you rolled back in [incident-response.md](./incident-response.md)'s postmortem template if it was user-visible (SEV1/SEV2 per that doc's severity table).

## Ongoing

- [ ] Dependency automation is optional (ADR-1). If Renovate is installed later, re-add `renovate.json` with patch automerge and `platformAutomerge: false` until branch protection exists.
- [ ] If a status page is wired (ADR-4, Upptime): confirm `.upptimerc.yml` still points at the right endpoint after any domain or routing change.

---

## Composing the CSP

`public/_headers` ships without a CSP by design; write one per project once the telemetry and auth
surface is wired (ADR 034 fixes that surface: PostHog EU, WorkOS, optionally Sentry). Derive it
from the origins actually configured, never a copied policy. A policy missing a wired origin
breaks in production, not in dev.

Skeleton, mirroring the existing header posture:

```
Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; connect-src 'self' <wired origins>; script-src 'self' <inline hashes>; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; form-action 'self' <auth domain>
```

Fill the placeholders from what is actually set:

- **`connect-src`**: add `https://eu.i.posthog.com` (or the `VITE_POSTHOG_HOST` override) when
  PostHog is wired; `https://api.workos.com` (or `VITE_WORKOS_API_HOSTNAME`) when AuthKit is
  wired; the org's Sentry ingest host (`https://oNNN.ingest.sentry.io` or the EU
  `ingest.de.sentry.io` form) when Sentry is wired; and `VITE_API_BASE_URL` if the API lives on
  another origin.
- **`script-src`**: `'self'` suffices for the SDKs (posthog-js and @sentry/react are bundled via
  pnpm, nothing is injected from a third-party origin). The inline theme-boot and static-shell
  scripts in `index.html` need `'sha256-...'` hashes, computed from the **built**
  `dist/client/index.html` (the critical-css plugin rewrites it); recompute when the inline
  scripts change, or fall back to `'unsafe-inline'` and accept the weaker policy.
- **`style-src 'unsafe-inline'`** is required by the inlined critical CSS; `font-src 'self'`
  is complete because fonts are always self-hosted (never a CDN origin); `frame-ancestors 'none'`
  mirrors the existing `X-Frame-Options: DENY`.
- **`form-action`**: add the WorkOS AuthKit domain when hosted login is used; the sign-in redirect
  is a top-level navigation, not a fetch, so it does not belong in `connect-src`.

Validate on the preview deployment with the browser console open before promoting: CSP violations
are report-only nowhere in this setup, they block.

## Related documentation

| Doc                                            | Content                                                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [architecture.md](./architecture.md)           | System design, layer model, build pipeline                                                    |
| [adr/README.md](../adr/README.md)              | Accepted decisions, including Renovate (ADR 001) and status page (ADR 004)                    |
| [incident-response.md](./incident-response.md) | Severity scale, comms template, postmortem template                                           |
| `.claude/CLAUDE.md`                            | "First deploy (Cloudflare)" one-time zone setup; "New-project bootstrap" pre-launch checklist |
