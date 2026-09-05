# Slimming & reconfiguration reference

**Status:** Historical record (July 2026 slimming pass); see [architecture.md](../reference/architecture.md) for current defaults
**Last updated:** 2026-07-03 (banner 2026-07-11)  
**Audience:** Future you, when revisiting template defaults after a fork

Several defaults moved on after this pass: General Translation briefly replaced the English-only store and was removed again under ADR 032, Charter prose returned (with preload and metric fallbacks), Playwright returned to `package.json` and CI, and the Hono Worker API landed. Sections below describe the state at the time of the pass.

This document records what changed during the **dependency audit + P0-P6 debt cleanup** pass (July 2026) and the reasoning behind each change. Treat it as a decision log you can argue with later, not a mandate to keep everything as-is.

Accepted, repo-wide decisions that survived review live in [`adr/`](../adr/README.md). This file covers the _exploratory_ slimming work, especially trade-offs that were good enough for a personal starter but may be wrong for a specific product.

---

## At a glance

| Area                         | What changed                                              | Primary reason                                                            | When to change                                         |
| ---------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| Routes                       | `/` = lean home; `/showcase` lazy                         | Smaller entry bundle; showcase is preview, not product                    | Your lander _is_ the design preview                    |
| Shiki                        | Removed; `CodeBlock` = plain `<pre>`                      | ~300 JS chunks -> 15; huge brotli cost for a template demo                | You ship docs/blog with syntax highlighting            |
| `@shadcn/react`              | Removed; local `message-scroller`                         | One compound component didn't justify the package                         | shadcn ships scroller hooks you prefer over local copy |
| PostHog / WorkOS             | Removed from default `dependencies`                       | Template clones shouldn't pay install/audit cost until wired              | You want analytics/auth on day one of every fork       |
| Storybook / Playwright       | Not in default CI or `package.json`                       | Reference scaffold only; Babel + dep weight for solo template             | Team needs isolated primitive docs or CI e2e gate      |
| Showcase                     | Trimmed sections + 4-state matrix                         | Preview surface, not a second product                                     | You use showcase as a living design QA lab             |
| Chat re-exports              | Deleted `ui/{bubble,...}.tsx` shims                       | Single import path: `@/components/ui/chat`                                | You want shorter paths for non-chat consumers          |
| i18n / fonts                 | English-only; Inter only; Charter removed                 | Template velocity; GDPR-safe Fontsource path stays                        | Product is DE-first or editorial (serif display)       |
| `size-limit`                 | Home boot 113 kB, showcase 48 kB, motion 14 kB, CSS 27 kB | Aggregate, fail-closed home coverage (see §9)                             | Home boot graph changes intentionally                  |
| Motion shell                 | `LazyMotion` only on `/showcase` (lazy chunk)             | ~25 kB brotli was in entry via global wrapper + `AnimatePresence` on home | Product routes need motion on `/`                      |
| `optional-seams` Vite plugin | Virtual stubs when SDKs missing                           | `pnpm build` works before `pnpm add posthog-js`                           | You prefer failing builds until SDKs installed         |

---

## 1. Route split: `/` home + lazy `/showcase`

### What changed

- **Before:** Design-system showcase tended to dominate `/` (or shared the entry path).
- **After:** `HomeRoute` is eager at `/`; TanStack Router's generated split component lazy-loads `ShowcaseRoute` at `/showcase`.
- **E2E:** `e2e/showcase.spec.ts`, home assertions on `/`, showcase assertions on `/showcase`.
- **Critical CSS:** `src/critical.css` `@source` lists only the first-paint home shell (today `index.tsx`, `skip-link`, `theme-toggle-lean`, `button`), not showcase sections.

### Reasoning

The template is a **starter**, not a design-system product. Most forks will replace `/` with a real lander; they should not download showcase sections, chat demo, and code-block gallery on first visit. Lazy `/showcase` keeps the preview one click away without taxing the entry chunk.

`size-limit` budgets the full home boot graph as an aggregate and keeps separate showcase and Motion rows. Every JavaScript chunk is included unless its prefix is explicitly deferred.

### When to change

- Your fork _is_ a component gallery (Storybook-style product).
- SEO requires the showcase content on `/` (then consider SSG on `/` per `.claude/CLAUDE.md`).
- You delete showcase entirely: remove the route and its showcase size budget.

### Key files

- `src/routes/index.tsx` (was `home.tsx` at the time), `src/routes/showcase.tsx`
- `src/router.tsx`, `src/routeTree.gen.ts`
- `src/critical.css`, `package.json#size-limit`

---

## 2. Removed Shiki; plain `CodeBlock`

### What changed

- **Removed:** `shiki` dependency and any language-specific highlighter chunks.
- **Added:** `src/components/code-block.tsx`, semantic `<figure>` / `<pre>` / `<code>` with copy button and language label via `src/lib/lang-labels.ts`.
- **Showcase:** `code-block-section.tsx` demonstrates the plain block.

### Reasoning

Shiki pulled **~300 language/theme assets** into the production graph for a template that only needed a few static examples. Brotli entry size and deploy surface grew disproportionate to value. A plain pre block is good enough for a starter; syntax highlighting is a **product feature**, not template infrastructure.

`.claude/CLAUDE.md` already lists `shiki` under "add on first need."

### When to change

- You ship developer docs, a blog, or in-app code samples where highlighting is core UX.
- **Path back:** `pnpm add shiki`, wrap `CodeBlock` with a Shiki highlighter (consider lazy-loading per language).

### Measured impact (approx.)

- Production JS chunks dropped from **~312 -> ~15** after Shiki removal (per build analysis in the cleanup pass).
- Main chunk still ~566 kB gzip raw (motion, router, UI; Shiki was the worst _chunk explosion_, not the only weight.

---

## 3. Inlined message scroller (dropped `@shadcn/react`)

### What changed

- **Removed:** `@shadcn/react` (was used mainly for `MessageScroller` / `useMessageScroller*`).
- **Kept:** Local compound component in `src/components/ui/chat/message-scroller.tsx`.

### Reasoning

One chat primitive does not justify a separate package and its transitive graph. The scroller behavior is small, chat-specific, and already forked into `ui/chat/`. Local ownership matches how other chat primitives (`bubble`, `message`, `attachment`) are maintained.

### When to change

- Upstream shadcn/react scroller gains features you need (virtualization, sticky headers, a11y fixes) and you do not want to port them.
- **Path back:** `pnpm add @shadcn/react` and thin-wrap or replace the local file.

---

## 4. Optional vendor seams (PostHog, WorkOS)

### What changed

- **Removed from default install:** `posthog-js`, `@workos-inc/authkit-react`.
- **Kept seams:** `src/lib/analytics.ts`, `src/lib/auth-provider.tsx`, `src/routes/workos-login-button.tsx`.
- **Added:**
  - `src/types/vendor-seams.d.ts`. TypeScript module stubs until packages are installed.
  - `vite/plugins/optional-seams.ts`, at build/test time, resolves missing SDK imports to no-op virtual modules so `pnpm build` passes without `pnpm add`.
- **Deleted:** `src/lib/auth.tsx` (logic folded into `auth-provider.tsx`).
- **knip:** `ignoreDependencies` for the two optional packages; `vendor-seams.d.ts` in `ignore` (declaration-only file).

### Reasoning

Every `pnpm install` on a fresh clone was paying for SDKs most forks never configure on day one. The **seam pattern** (env-gated init, dynamic `import()`) was already correct; the gap was making **zero-install** builds typecheck and bundle cleanly.

`optional-seams.ts` is a template-specific compromise: real packages win when present (`require.resolve`), stubs otherwise. That avoids forcing newcomers to install PostHog/WorkOS before their first deploy.

### Trade-offs

| Pro                            | Con                                                         |
| ------------------------------ | ----------------------------------------------------------- |
| Leaner default `node_modules`  | Stubs can hide "forgot to install SDK" until runtime        |
| CI audit surface smaller       | Two mechanisms to understand (stubs + dynamic import)       |
| Fork-friendly copy-paste seams | Not how you'd structure a production app with required auth |

### When to change

- You want **fail-fast**: remove `optionalSeamsPlugin()` from `vite.config.ts` and add SDKs back to `dependencies`.
- You standardize on Better Auth / Plausible / Cloudflare Analytics: replace seam modules, drop stubs for removed vendors.

### Wire-up commands

```sh
pnpm add posthog-js
pnpm add @workos-inc/authkit-react
```

Create a gitignored `.env.local` per [env.md](../reference/env.md) and set `VITE_POSTHOG_KEY` / `VITE_WORKOS_CLIENT_ID`.

---

## 5. Storybook and Playwright: opt-in, not default

**Since reversed for Playwright (2026-07-11):** `@playwright/test` is a `package.json` devDependency again, `pnpm test:e2e` exists, and CI runs the e2e job. Storybook stays out (ADR-3). Kept as the record of the slimmer intermediate state.

### What changed

- **Removed from `package.json`:** Storybook packages, `@playwright/test` (and `test:e2e` script).
- **Removed from default CI:** Playwright job (CI is oxfmt, tsc, oxlint, knip, audit, vitest, build, size-limit); re-enabled when e2e is required.
- **Kept as reference scaffold:** `e2e/showcase.spec.ts`, `playwright.config.ts` (knip-ignored until Playwright installed).
- **Storybook:** `.storybook/` and `*.stories.tsx` deleted (see ADR-2, ADR-3).

### Reasoning

- **Storybook:** Overlapped with in-app `/showcase`; pulled Babel via `react-docgen`; not gated in CI. ADR-3 documents the accepted direction.
- **Playwright:** Valuable for launch QA, but heavy for a solo template's every PR. Reference spec stays so `pnpm add -D @playwright/test` + `playwright install` is a one-step opt-in.

### When to change

- External design handoff needs Storybook Controls/docs.
- You require e2e on every PR: add Playwright to `dependencies`/`devDependencies`, restore CI job, remove `e2e/**` from the `knip` configuration in `package.json`.

### Opt-in Playwright (sketch)

```sh
pnpm add -D @playwright/test
pnpm exec playwright install
pnpm exec playwright test
```

---

## 6. Slim showcase surface

### What changed

- **Removed:** `ChatShowcase` duplicate, `interaction-section` (counter demo), redundant chat wiring.
- **Kept:** `ChatFeature` on `/showcase` only: one composed chat demo.
- **States matrix:** `states-showcase.tsx` reduced from 8 states to 4 (`ready`, `loading`, `empty`, `error`).

### Reasoning

The showcase is **template preview**, not a second app. Duplicate chat entry points and a counter section added maintenance and bundle size without teaching additional patterns. Four states still document the unhappy-path matrix; eight was repetitive for the same components.

### When to change

- Showcase becomes your team's visual regression lab: restore broader state coverage or add Storybook.
- You delete showcase when forking: remove `src/components/showcase/*` and the `/showcase` route (see `docs/reference/architecture.md` migration checklist).

---

## 7. Collapsed chat re-exports

### What changed

- **Deleted thin files:** `src/components/ui/bubble.tsx`, `attachment.tsx`, `marker.tsx`, `message.tsx`, `message-scroller.tsx` (re-export shims).
- **Canonical import:** `@/components/ui/chat` (barrel in `src/components/ui/chat/`).

### Reasoning

Two import paths for the same primitives confused grep, knip, and "where do I import from?" rules. Chat presentation is a **subsystem**; one barrel matches `features/chat` and showcase sections.

### When to change

- Non-chat features import bubbles outside chat: a top-level `ui/bubble.tsx` re-export might read clearer (accept duplication cost).

---

## 8. English-only i18n and Inter-only typography

**Translation history:** General Translation with a seeded `de` core replaced this custom store on 2026-07-11, then was removed on 2026-07-13 under ADR 032. Charter prose remains self-hosted, preloaded, and metric-matched. Kept as the record of the slimmer intermediate state.

### What changed

- **Removed:** `src/i18n/messages/de.ts`, `locale-switcher.tsx`, German catalog registration.
- **API kept:** `t()`, `getLocale()`, `setLocale()` (no-op), `i18nActionClass()`; add locales by copying `messages/en.ts`.
- **Fonts:** Charter woff2 + `LICENSE.txt` removed; `--font-heading` aliases `--font-sans` (Inter) in `theme-tokens.css`.
- **Preload:** `vite/plugins/preload-fonts.ts`. Inter latin only.

### Reasoning

The template had i18n plumbing and a DE catalog without a locale switcher in product routes; half-wired surface area. English-only reduces files to maintain until a product picks a second locale deliberately.

Charter was editorial weight without a product brief using it. Inter-only keeps Fontsource GDPR-safe self-hosting without multi-family preload complexity.

### When to change

- Market is DE-first or multi-locale on day one: restore catalogs, switcher, and `setLocale` persistence.
- Editorial/magazine direction: add a display serif via Fontsource and wire `--font-heading` again (see `frontend-editorial` skill direction).

---

## 9. `size-limit` budgets

### Current budgets (`package.json#size-limit`)

| Bucket        | Path                                              | Limit (brotli) |
| ------------- | ------------------------------------------------- | -------------- |
| Home boot JS  | `dist/client/assets/*.js` minus deferred prefixes | 113 kB         |
| Showcase JS   | `dist/client/assets/showcase-*.js`                | 48 kB          |
| Motion JS     | `dist/client/assets/motion-shell-*.js`            | 14 kB          |
| CSS aggregate | `dist/client/assets/*.css`                        | 27 kB          |

Re-measure after intentional changes: `pnpm build && pnpm size` (always on a **finished** `dist/`; a partial build makes size-limit report "can't find" `motion-shell-*.js`). Opt-in bundle graph: `ANALYZE=1 pnpm build` -> `dist/stats.html`.

`MotionShell` stays a **lazy** chunk via `React.lazy` on both `/showcase` and `/dashboard`. It is not a static import; do not "fix" a missing motion chunk by inlining it into entry.

### Reasoning

The home budget uses a positive JavaScript glob plus explicit negations mirrored from `DEFERRED_CHUNK_PREFIXES` in `vite/plugins/filter-modulepreload.ts`. A newly emitted JavaScript chunk enters the home aggregate unless it is deliberately classified as deferred, so coverage cannot decay silently. Separate showcase and Motion budgets still catch preview bloat without charging it to the home path.

### Entry regression (July 2026, +7.3 kB over 155 kB)

After the cleanup pass (~154.5 kB entry), organic growth pushed entry to **~162.2 kB brotli** without changing the budget. Root cause was not CSS (that pass was already green at ~13.5 kB) but **JS on the home path**:

1. **Global `LazyMotion` in `main.tsx`**: `domAnimation` + `MotionConfig` wrapped the whole router, so motion shipped on `/` even though only `/showcase` uses `m` / `AnimatePresence`.
2. **`ThemeToggle` on `/`**: `AnimatePresence` for the icon swap pulled presence/exit modules into entry; `@base-ui/react/tooltip` for the hover label added floating-ui weight on first paint.

**Fix (no budget bump):** defer motion to showcase, slim the home theme control.

| Change                   | File(s)                                                             | Effect                                                                  |
| ------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `MotionShell` lazy chunk | `src/components/motion-shell.tsx`, `showcase.tsx` + `dashboard.tsx` | Motion (~13 kB brotli) loads with product routes that need `m`, not `/` |
| CSS icon swap on home    | `src/components/theme-toggle.tsx`                                   | `tw-animate-css` enter on the icon; drops `AnimatePresence` from entry  |
| Lazy 404                 | `src/router.tsx`, `src/critical.css`                                | `NotFoundRoute` + `Empty` off the entry graph                           |
| Lazy sonner              | `src/lib/toast.ts`, `src/components/toaster-gate.tsx`               | `sonner` + `react-dom.flushSync` load on first toast, not on `/`        |

Do **not** remove tooltip from `ThemeToggle` while showcase still imports the same component; that moves `@base-ui/react/tooltip` entirely into `showcase-*.js` (~44 kB measured, which blew the 25 kB showcase cap of the time; the cap is 48 kB today). Keep tooltip on the toggle; shed motion instead.

### When to change

- Real product routes replace home: **lower** entry budget once feature set stabilizes.
- Showcase removed: delete showcase and motion rows from `package.json#size-limit`.
- A product route needs motion on `/`: wrap that route in `MotionShell` (or restore a global wrapper) and re-measure entry.

---

## 10. Knip configuration adjustments

### What changed

- **Removed stale ignores:** `motion-primitives.tsx`, `.storybook/**`, `**/*.stories.tsx` (those paths no longer exist or are used).
- **Added:** `src/types/vendor-seams.d.ts`, `ignoreDependencies` for optional SDKs.
- **Kept:** `src/components/ui/**` (shadcn library surface), `e2e/**`, `playwright.config.ts`, `src/critical.css`.

### Reasoning

Knip should reflect the repo as it exists, not a previous Storybook era. Optional SDK imports are real code paths but optional packages; `ignoreDependencies` documents that contract.

The configuration now lives under `package.json#knip`; see ADR 008.

### When to change

- Playwright or Storybook return: adjust ignores or install deps and remove ignores.
- You delete e2e scaffold: drop `e2e/**` and `playwright.config.ts` ignores.

---

## 11. Docs and agent guardrails synced

Files touched for accuracy (not exhaustive):

- `docs/reference/architecture.md`: layer model, routing table, optional seams
- `docs/frontend/glossary.md`, `components/bubble.md`: import paths, showcase route
- `.claude/CLAUDE.md`: opt-in SDKs, chat scroller, optional tooling
- `README.md`: routing summary, link to this doc

### Reasoning

Slimming without doc updates creates stale docs: the next session (human or agent) would reintroduce removed packages believing they were still defaults.

---

## Open questions (intentionally unresolved)

These came up during cleanup and were **not** closed, left for product-specific forks:

1. **Auth chunk isolation:** `workos-login-button` lazy in login helps, but static import paths may still pull auth stubs into unexpected chunks. Re-audit with `ANALYZE=1 pnpm build` when OAuth is launch-critical.
2. **`getSession()` vs `useAuth()`:** Two halves of the auth seam still need a deliberate mirror/decode/server-validation strategy (documented in `.claude/CLAUDE.md`).
3. **Plain `CodeBlock` vs Shiki:** Acceptable for template; wrong for developer-facing products.
4. **`optional-seams` stubs:** Convenience vs fail-fast; pick per project maturity.
5. **Playwright in CI:** Reference spec exists; default off; enable when routes stabilize.

---

## Related documentation

| Doc                                               | Role                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| [`architecture.md`](../reference/architecture.md) | Current system shape                                                |
| [`adr/`](../adr/README.md)                        | Accepted decisions (Renovate, Oxc/Rolldown, showcase-not-Storybook) |
| [`README.md`](../../README.md)                    | Quick start and scripts                                             |
| `.claude/CLAUDE.md`                               | Agent/human guardrails (local, untracked)                           |
