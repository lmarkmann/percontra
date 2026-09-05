# Detaching from Cloudflare

How to take a fork of this template off Cloudflare Workers: to a static host, a Tauri shell, or a
Node server. Living doc; sibling decision: [ADR 035](../adr/035-hono-on-workers-not-nitro.md)
(choosing a server stack), [deploy-checklist.md](./deploy-checklist.md) (staying on Cloudflare).

**TL;DR:** the client is host-agnostic by design. `src/lib/api-client.ts` talks to
`VITE_API_BASE_URL`, and `session-api.ts` / `dashboard-data.ts` fall back to demo mode when it is
unset, so no `src/` application code depends on Cloudflare. Detaching is config surgery, not app
surgery: delete the Worker config, strip the Vite plugin, and decide what happens to `server/`.

## 1. Delete outright

- `wrangler.jsonc` (Worker entry, assets binding, `not_found_handling`, `vars`)
- `.github/workflows/deploy.yml` (wrangler-action deploy; replace with the new host's deploy)
- `server/tsconfig.json`, plus the `server/tsconfig.json` argument in the `build` and `typecheck`
  scripts and the `typerun` and `typewatch` recipes (delete only if `server/` goes too; a Node fork
  repurposes it with `"types": ["node"]`)
- Generated and gitignored leftovers: `worker-configuration.d.ts`, `.wrangler/`,
  `dist/vite_template/`
- Optional: the `.wrangler` / `worker-configuration.d.ts` / `.dev.vars*` lines in `.gitignore`

## 2. Edit

**`package.json`**

- Remove the `cf-typegen` script and the `pnpm cf-typegen && ` prefix from both `build` and
  `typecheck`.
- Remove `deploy:cf`; add the new host's deploy script if any.
- Remove `wrangler` and `@cloudflare/vite-plugin` from devDependencies.

**`vite.config.ts`**

- Remove the dynamic `@cloudflare/vite-plugin` import (the `underVitest`-gated block) and the
  `cloudflarePlugin?.()` entry in the plugins array.
- The `environments.client` block exists only to scope the HTML inputs away from the plugin's
  Worker environment. Once the plugin is gone, lift its `build.rollupOptions.input` map to a
  top-level `build.rollupOptions` and delete the `environments` key.
- Leave the other `VITEST` gates alone; `filter-modulepreload`, `emit-service-worker`,
  `emit-sitemap`, and `critical-css` are ours and host-independent.
- Without the plugin, `vite build` emits a single flat `dist/` instead of `dist/client/` +
  `dist/vite_template/`. Update the `dist/client/assets/*` globs in `package.json#size-limit` and
  check the output-dir assumptions in `vite/plugins/critical-css.ts` and `emit-sitemap.ts`.

## 3. Decide the fate of `server/`

The Worker is a thin Hono app (`/api/session`, `/api/dashboard`). Two fork shapes:

**Static or Tauri (no server): delete `server/`.** The client degrades automatically: with
`VITE_API_BASE_URL` unset, sessions come from the localStorage demo (`src/lib/session.ts`) and the
dashboard serves demo fixtures. Then:

- Remove the `server/**` include and its 97% coverage threshold from the Vitest config in
  `vite.config.ts`, or CI coverage fails on a folder that no longer exists.
- Delete `e2e/api.spec.ts`; it asserts problem+json responses from the live Worker that
  `vite preview` runs today via the Cloudflare plugin.

**Node (keep the API): `server/` ports almost unchanged.** Hono runs on Node via
`@hono/node-server`; `server/auth.ts` uses jose over WebCrypto, no workerd APIs. Replace the two
Cloudflare-isms:

- The `app.notFound` handler proxies asset misses through the `ASSETS` binding
  (`c.env.ASSETS.fetch`); on Node, serve the SPA shell with static-file middleware instead.
- `AppEnv.Bindings` in `server/auth.ts` picks from the generated `Env` type; hand-write the env
  type (`WORKOS_CLIENT_ID: string`) once `worker-configuration.d.ts` is gone, and move the var
  from `wrangler.jsonc` `vars` / `.dev.vars` to the host's env mechanism.
- Add the server entry to `package.json#knip.entry`; today knip discovers `server/index.ts`
  through its wrangler plugin reading `wrangler.jsonc`, and it will flag the whole folder as
  unused otherwise.
- Keep `e2e/api.spec.ts` but point Playwright's `webServer` at a command that runs both the built
  client and the Node server.

Either way, the MSW handlers (`src/test/mocks/handlers.ts`) mirror the server routes with
wildcard hosts; update them only if `/api/session` or `/api/dashboard` change shape or disappear
from the tests' perspective.

## 4. Semi-portable pieces

- `public/_headers` is a Cloudflare/Netlify format. On any other host, re-express its rules
  (nosniff, frame deny, referrer and permissions policies, the immutable `Cache-Control` on
  fingerprinted assets) in the host's config: nginx headers, Node middleware, or Tauri's webview
  settings.
- SPA deep-link fallback: `not_found_handling: "single-page-application"` dies with
  `wrangler.jsonc`. The portable equivalent is the host's rewrite-to-`index.html` rule; the
  TanStack catch-all `src/routes/$.tsx` keeps rendering the not-found UI unchanged, and
  `public/404.html` stays the plain-HTML fallback for hosts that serve one.
- Fully portable, no action: `public/404.html`, `robots.txt`, `llms.txt`, the service worker, all
  fonts and static assets, and every `vite/plugins/*` except the output-dir globs noted above.

## 5. Docs that assume Cloudflare

After detaching, the Cloudflare-scoped docs stop applying to the fork:
[deploy-checklist.md](./deploy-checklist.md) wholesale, the deploy sections of
[architecture.md](./architecture.md), the "Server (Worker) vars" section of [env.md](./env.md)
(`.dev.vars` is read by wrangler), and [ADR 018](../adr/018-generate-worker-types-instead-of-committing-them.md). Point them at the fork's
replacements rather than editing history.
