# vite-template

[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![React](https://img.shields.io/badge/React-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?logo=cloudflareworkers&logoColor=white)](https://developers.cloudflare.com/workers/)

Personal starter for design-forward SPAs. **Vite + React + TanStack Router + Tailwind v4 + shadcn (Base UI) + oxlint + oxfmt**, deployed as static assets plus a thin **Hono Worker** on Cloudflare. Aligned with the 2026 frontend stack decision map (SPA row).

In the box: a static home shell and critical-CSS split for fast first paint, a build-generated service worker with network-first navigations, file-based routing with an authenticated layout, demo auth with a WorkOS seam, a scripted chat demo with an IndexedDB offline queue, and CI gates for bundle size, Lighthouse, coverage, and e2e.

## New project

The Node version lives in exactly one place, `.node-version`, with `engines.node` in `package.json` carrying the supported floor (ADR 023). Nothing else names a version: `fnm use` reads the file locally, `actions/setup-node` reads it in CI through `node-version-file`, and `pnpm/action-setup` takes the package-manager version from `packageManager` in `package.json`. Use **fnm** locally; fish is already wired with `fnm env --use-on-cd`.

```sh
gh repo create NAME --template lmarkmann/vite-template --private --clone
cd NAME
fnm use
pnpm install
prek install
pnpm dev
```

## Scripts

| command               | does                                                                   |
| --------------------- | ---------------------------------------------------------------------- |
| `pnpm dev`            | dev server (runs inside workerd, so the Worker and headers behave)     |
| `pnpm build`          | cf-typegen + routes:gen + typecheck + production build                 |
| `pnpm preview`        | preview the production build                                           |
| `pnpm check`          | oxfmt write + oxlint --fix                                             |
| `pnpm lint`           | oxfmt check + oxlint (read-only)                                       |
| `pnpm format`         | oxfmt write                                                            |
| `pnpm typecheck`      | cf-typegen + routes:gen + `tsc -b` over both projects, no emit         |
| `pnpm cf-typegen`     | Worker env types from `wrangler.jsonc` (runs inside build/typecheck)   |
| `pnpm routes:gen`     | regenerate `src/routeTree.gen.ts` (also runs inside build/typecheck)   |
| `pnpm test`           | vitest watch                                                           |
| `pnpm test:run`       | vitest single run                                                      |
| `pnpm test:coverage`  | vitest with v8 coverage (thresholded per folder)                       |
| `pnpm test:e2e`       | Playwright E2E                                                         |
| `pnpm format:check`   | oxfmt check only                                                       |
| `pnpm lint:github`    | oxlint with GitHub annotations (used by CI)                            |
| `pnpm knip`           | unused files/exports/deps                                              |
| `pnpm type-spec-gate` | every declared font family is justified in the type spec               |
| `pnpm size`           | bundle budgets after build                                             |
| `pnpm perf:ci`        | Lighthouse CI against `vite preview`                                   |
| `pnpm ci:local`       | the full CI pipeline locally, same order as `.github/workflows/ci.yml` |
| `pnpm deploy:cf`      | build + `wrangler deploy`                                              |

## Routing

**TanStack Router** (file-based) is wired in: routes under `src/routes/`, tree in `src/routeTree.gen.ts`, `src/router.tsx` creates the router, `main.tsx` renders `RouterProvider`. Config lives in `tsr.config.json`. `/` is a lean product home; `/showcase` lazy-loads the design-system preview. Protected pages live under `src/routes/_authenticated/` (a pathless layout whose `beforeLoad` runs `requireAuth`; URLs are unaffected): drop a new route file there and it inherits the gate, no per-file ritual. `/dashboard` lives there today; `requireAuth` (`src/lib/require-auth.ts`) resolves the session via `sessionQueryOptions` / `resolveSession` from `src/lib/session-api.ts`, dual-mode: demo `localStorage` without `VITE_API_BASE_URL`, `GET /api/session` against the Worker otherwise, with server-side WorkOS verification shipped in `server/auth.ts` (ADR-6). Dashboard search (`view`, `debug`) is **validated** via zod. Catch-all `/$` renders `src/routes/$.tsx`; `public/404.html` is only a fallback for non-GET/asset misses.

## Auth (decision map §9)

| Mode         | When                                      | What ships                                                                                          |
| ------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Demo session | Fresh clone (default)                     | `session.ts` localStorage + login form                                                              |
| WorkOS       | Enterprise SSO (archetype C)              | Env-gated seam: `auth-provider.tsx`, login button, server-side JWKS verification (`server/auth.ts`) |
| Better Auth  | Fork needs first-party auth + own user DB | Evaluated, **not adopted** (ADR-6): the template keeps hosted auth and stores no credentials        |

## API ports and the Worker

The client ports work against any HTTP origin behind `VITE_API_BASE_URL` (Django, Tauri sidecar, etc.), and a thin same-origin **Hono Worker** ships as the default server half.

| Port         | Modules                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Transport    | `src/lib/api-client.ts`, `src/lib/api-problem.ts` (RFC 9457)                                                           |
| Contract     | `src/contract/` (zod schemas + fixtures), imported by client **and** Worker                                            |
| Session      | `src/lib/session-api.ts` dual-mode (demo localStorage / `GET /api/session`)                                            |
| Server state | `@tanstack/react-query` + dashboard `ensureQueryData`                                                                  |
| Server       | `server/index.ts` (Hono: `GET /api/dashboard`, `GET /api/session`), `server/auth.ts` (WorkOS JWKS verification, ADR-6) |

Demo mode (no base URL, no env vars) stays the zero-config default.

## Offline and the chat demo

`src/features/chat/` is a scripted-transport chat demo: composer, attachments, inline error recovery with support IDs, and an offline queue. The transport seam is `src/lib/chat-transport.ts` (simulated latency and failure paths; swap in `@ai-sdk/react` or your API here). Offline sends persist in IndexedDB (`src/lib/offline-queue.ts`, in-memory fallback for private mode) and flush exactly once on reconnect, serialized across tabs via `navigator.locks`.

The build also emits a service worker (`vite/plugins/emit-service-worker.ts`, ADR-17): it precaches the home shell and first-paint assets, serves navigations network-first with the cached shell as offline fallback, and `/assets/*` cache-first. The cache name is content-addressed, so each deploy evicts the previous one. Registration is production-only (`src/lib/register-service-worker.ts`).

## Language

The template ships English copy directly in components and keeps `<html lang="en">`. Internationalization is a product decision. Add it when a product has real locale, catalog, routing, and deployment requirements; see ADR 032.

## SEO / crawlers

Single source of truth: `src/lib/site.ts` (identity) + `src/lib/seo.ts` (per-route title, description, robots). `DocumentSeo` applies head on navigation; home first paint stays in `index.html` (keep aligned with `routeSeo.home`).

| Default            | Routes                                         |
| ------------------ | ---------------------------------------------- |
| `index,follow`     | `/`                                            |
| `noindex,nofollow` | `/showcase`, `/login`, `/dashboard`, catch-all |

**"Private" pages come in three tiers** (ADR 027); pick per route, e.g. a pricing page: discoverable -> crawlable + `index,follow`; public but kept out of search results -> crawlable + meta `noindex` from `routeSeo` (never a robots.txt `Disallow` for these: a blocked crawler can never see the noindex, so the URL can still be indexed from external links); genuinely confidential -> behind `requireAuth`. Neither robots.txt nor noindex is access control.

Set `VITE_APP_URL` (no trailing slash) for absolute social images, home canonical/`og:url`, WebSite JSON-LD, and build-time `dist/sitemap.xml`. `public/llms.txt` is a truthful template stub; rewrite for product content. Full ranking/GEO still needs prerender because many crawlers skip JavaScript: the launch gate is TanStack Start's prerendering (same router; Start is v0, evaluate at fork time). vite-react-ssg does not support file-based TanStack Router (verified 2026-07-10); the home route stays covered by the static shell in `index.html`.

**Fork todos** (check off in [`.claude/rules/seo.md`](.claude/rules/seo.md), and the table in `docs/frontend/template-gaps.md` §5 SEO/GEO): fill `site.ts` + `routeSeo`, mirror home into `index.html`, set `VITE_APP_URL`, update `llms.txt` / OG art, add Sitemap after deploy, prerender (TanStack Start) only if crawlers must see body HTML beyond the home shell.

## Performance and quality gates

First paint is engineered: a static home shell inlined in `index.html` paints before React boots, `src/critical.css` is inlined at build while the full stylesheet loads async, and fonts are self-hosted with `font-display: optional` plus metric-matched fallbacks (Inter for UI and headings, vendored Charter for prose), so a slow font never shifts layout.

Four budget families fail CI when breached:

- **size-limit**: home boot graph 113 kB brotli (every unclassified new chunk joins the aggregate and fails closed), showcase route 48 kB, motion shell 14 kB, CSS 27 kB.
- **Lighthouse** (`lighthouserc.cjs`, desktop, 3 runs): home performance >= 0.9 with LCP <= 1700ms and FCP <= 1400ms; showcase >= 0.8 with LCP <= 4000ms and FCP <= 3000ms.
- **Coverage** (v8, per folder): `src/lib` 80, `src/hooks` 90, `server` 97, `vite/plugins` 59 (lines).
- **knip + audit**: no unused files/exports/deps, no known-high production vulnerabilities.

CI (`.github/workflows/ci.yml`) runs format check, typecheck, lint, knip, audit, unit tests with coverage, build, size-limit, Lighthouse, then Playwright; `pnpm ci:local` mirrors that order. Raising any budget takes a one-line justification in the PR. Two more workflows guard the edges: `workflows-lint.yml` runs actionlint and zizmor over the workflow files themselves, and `release.yml` publishes the GitHub release on a `v*` tag, refusing any tag that does not match `package.json` and `CHANGELOG.md`. Versioning is [changesets](https://github.com/changesets/changesets): `just changeset` at the repo root records a change, `just release` applies the pending ones (bump `package.json`, write `CHANGELOG.md`, commit, tag). `package.json` is the only place the version is written; `api/pyproject.toml` reads it at build time. Never a bare `git tag`.

## Deploy

Deploys to Cloudflare Workers via `wrangler.jsonc`: `main` is the Hono Worker (`server/index.ts`) and `run_worker_first` routes `/api/*` to it before static asset matching. `vite build` writes `dist/client/` (assets) plus the Worker bundle and a generated wrangler config that `wrangler deploy` follows. A successful `ci` workflow on `main` triggers deployment of that exact commit once `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set. Forks targeting a different host (static, Tauri, Node) follow [docs/reference/detach-cloudflare.md](docs/reference/detach-cloudflare.md).

## Division of labor

- **oxfmt** owns formatting, import sort, and Tailwind class sorting (`sortTailwindcss` on `className` plus the functions `cn`, `cva`, `clsx`, `tailwindMerge`).
- **oxlint** is the sole linter, full tree and type-aware (plugins unicorn, oxc, typescript, react, jsx-a11y, vitest, import, promise; policy in [docs/reference/tooling.md](docs/reference/tooling.md)). `react/only-export-components` is error-level on UI primitives (`src/components/ui/**`, `motion-primitives.tsx`, `motion-shell.tsx`).
- **prek** runs oxfmt write, `tsc -b --noEmit`, oxlint, and the type-spec gate on commit; Vitest on pre-push. Every hook delegates to a `justfile` recipe, so local and CI run the same command.
- **shadcn CLI** owns its dependency graph. Never hand-install `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`; `pnpm exec shadcn add <component>` brings what it needs.
- No Biome, no ESLint, no Prettier, no PostCSS, no autoprefixer, no `tailwind.config.js`. Tailwind v4 is configured via `@theme` in the CSS entry.
- **tweakcn** (tweakcn.com) edits the OKLCH theme: dial in color, radius, and type with a live WCAG contrast check, then paste exported variables into the theme tokens.

## Add on first need, not at init

- `react-hook-form` + `@hookform/resolvers` arrive with `shadcn add form` (`zod` is already here)
- `cmdk` via `shadcn add command`
- `@tanstack/react-table` via `shadcn add data-table`
- `react-day-picker` and `date-fns` via `shadcn add calendar`
- `recharts` via `shadcn add chart`
- `embla-carousel-react` via `shadcn add carousel`
- `input-otp` via `shadcn add input-otp`
- `react-resizable-panels` via `shadcn add resizable`
- `shiki` via `pnpm add shiki` when documentation needs syntax highlighting
- `motion` when animation is the point (`tw-animate-css` already covers component enter/exit)
- **Better Auth** only if a fork needs first-party auth with its own user database; evaluated and deliberately not adopted for the template (ADR-6)
- WorkOS AuthKit only for **enterprise SSO** (archetype C bolt-on)

Skip axios (native fetch), jsdom (happy-dom is configured), husky/lint-staged (prek), any second component library, and the animated-component kits (Magic UI, Aceternity).

## Optional seams (env-gated, SDK not installed)

Each seam is inert until its env var is set; the SDK loads via dynamic import and never enters the entry bundle. Setting the env var without installing the SDK fails the build with the exact `pnpm add` command.

| Seam            | Transport                    | Enable                                                         |
| --------------- | ---------------------------- | -------------------------------------------------------------- |
| Analytics       | `src/lib/analytics.ts`       | `pnpm add posthog-js` + `VITE_POSTHOG_KEY`                     |
| Error reporting | `src/lib/error-reporting.ts` | `pnpm add @sentry/react` + `VITE_SENTRY_DSN`                   |
| Enterprise SSO  | `src/lib/auth-provider.tsx`  | `pnpm add @workos-inc/authkit-react` + `VITE_WORKOS_CLIENT_ID` |

## Architecture

System design, layer boundaries, build pipeline, and extension seams live in [`docs/reference/architecture.md`](docs/reference/architecture.md) (the living map). Accepted decisions are 39 ADRs indexed in [`docs/adr/README.md`](docs/adr/README.md). Historical pass records live in [`docs/synthesis/`](docs/synthesis/).

Agent-facing operational rules ship with the template in [`.claude/`](.claude/): `CLAUDE.md` is the index (identity, hard nevers, docs map) and `.claude/rules/` holds one file per topic, read on demand rather than loaded every session.

Create a gitignored `.env.local` from the contract in [`docs/reference/env.md`](docs/reference/env.md) when enabling PostHog, `VITE_APP_URL`, or enterprise WorkOS.

## UI craft notes

Design docs live in `docs/frontend/`. The design-system showcase is at `/showcase` (`pnpm dev`, then open `/showcase`).

## Credits

Code ported into this template from other open source projects. One row per ported file: where it landed, where it came from, the license, the donor HEAD sha and the date it was checked, and what changed in the adaptation.

| Ported into                                                      | Source repo                                                                 | Source file(s)                                            | License   | HEAD / checked                           | Adaptation                                                                                                                   |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- | --------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `server/index.ts`                                                | [kriasoft/react-starter-kit](https://github.com/kriasoft/react-starter-kit) | `apps/api/worker.ts`, `apps/api/lib/app.ts`               | MIT       | 3c5132e (2026-02-18), checked 2026-07-10 | Single Worker instead of a service-bound pair; REST JSON instead of tRPC; problem+json error shape; no Bun.                  |
| `server/auth.ts` (+ middleware arrangement in `server/index.ts`) | [kriasoft/react-starter-kit](https://github.com/kriasoft/react-starter-kit) | `apps/api/worker.ts`                                      | MIT       | 3c5132e, checked 2026-07-10              | WorkOS JWKS verification (jose) instead of Better Auth session lookup; single Worker; secureHeaders + origin check kept.     |
| `src/routes/_authenticated/route.tsx`                            | [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin)           | `src/routes/_authenticated/route.tsx`                     | MIT       | e16c87f, checked 2026-07-10              | Adapted to `requireAuth` and this router context; no Clerk variants, no sidebar shell.                                       |
| `e2e/helpers/session.ts`                                         | [epicweb-dev/epic-stack](https://github.com/epicweb-dev/epic-stack)         | `tests/playwright-utils.ts`                               | MIT       | faaa217, checked 2026-07-10              | Fixture philosophy only: localStorage demo seed instead of a DB insert plus signed cookie.                                   |
| (reference only, no code copied)                                 | [mugnavo/tanstarter](https://github.com/mugnavo/tanstarter)                 | `src/lib/auth/middleware.ts`                              | Unlicense | f8766d0, checked 2026-07-10              | Shape reference for a 401-returning auth middleware and the fresh-session idea (here: short-lived JWT verified per request). |
| `src/test/mocks/*`                                               | [alan2207/bulletproof-react](https://github.com/alan2207/bulletproof-react) | `apps/react-vite/src/testing/mocks/{server.ts,handlers/}` | MIT       | 9506629 (2026-05-14), checked 2026-07-10 | Handlers built from the shared contract module instead of @mswjs/data models; no browser worker; no persistence layer.       |
