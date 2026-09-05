# Slow-network performance wins

**Status:** Historical record (performance pass predating the Hono Worker); see [architecture.md](../reference/architecture.md) for the current system shape

Reasoning and implementation notes for ten optimizations aimed at **bad 4G / older phones**: fast first paint, early navigation, and smaller work before the entry bundle executes. Measured baseline before this pass: desktop LCP ~87 ms; Slow 4G + 4× CPU ~731 ms with a ~130 kB brotli entry chunk still gating interactivity.

Each win below states **what we did**, **why it helps on slow links**, and **tradeoffs**.

---

## 1. Static CTAs in `index.html`

**What:** The static home shell (`data-static-shell`) now includes real `<a href="/showcase">` and `<a href="/login">` anchors styled like `Button` default/outline variants.

**Why:** On slow networks, users can follow primary journeys while `main-*.js` downloads and parses. Hover/focus prefetch still runs after React hydrates; the static links work without JS.

**Tradeoff:** CTA copy lives in two places (`src/routes/index.tsx` and the static shell in `index.html`). The maintenance rule in `.claude/CLAUDE.md` applies.

**Files:** `index.html`, `src/routes/index.tsx`

---

## 2. Lean home theme toggle (shrink entry JS)

**What:** `/` uses `ThemeToggleLean`: inline SVG icons, plain `Button`, no `@base-ui/react/tooltip`, no `lucide-react`. `/showcase` keeps full `ThemeToggle` (tooltip + lucide) so showcase budget is unchanged.

**Why:** Tooltip + lucide on the lander pulled floating-ui and icon chunks into the entry graph. Home only needs an accessible cycle control.

**Tradeoff:** No hover label on `/`; `aria-label` carries the mode name. Showcase retains the richer control.

**Files:** `src/components/theme-toggle-lean.tsx`, `src/routes/index.tsx`, `src/lib/theme-cycle.ts`

---

## 3. Prerender `/` via expanded static shell (not full SSG)

**What:** Instead of adding full prerender now, we treat the static shell as a **partial prerender** of `/`: hero, CTAs, and a working theme button (inline script) ship in the first HTML response.

**Why:** Full prerender is the right launch gate for SEO and training crawlers (see `.claude/CLAUDE.md`), but it is a routing/build migration. The static shell delivers most of the LCP and early-interaction benefit without a second render pipeline.

**Tradeoff:** Non-home routes are still client-only. Add prerender when meta/GEO requirements land, not for perf alone; the route is TanStack Start's prerendering, since vite-react-ssg does not support file-based TanStack Router (verified 2026-07-10).

**Files:** `index.html` (inline theme script), `vite/plugins/critical-css.ts` (inlines critical CSS into that HTML)

---

## 4. Trim critical CSS `@source`

**What:** Removed `tooltip.tsx` from `src/critical.css` and swapped `theme-toggle.tsx` for `theme-toggle-lean.tsx`.

**Why:** Critical CSS is inlined into `index.html` at build time. Every `@source` file expands the blocking style payload on first byte.

**Tradeoff:** Tooltip styles still ship in the async full stylesheet for showcase; they are simply not inlined on `/`.

**Files:** `src/critical.css`

---

## 5. `font-display: optional` for Inter (Latin)

**What:** Replaced `@fontsource-variable/inter/wght.css` with `src/styles/inter-font.css`: Latin + Latin-ext subsets only, `font-display: optional`. Preload plugin unchanged (still targets fingerprinted `inter-latin-*.woff2`).

**Why:** On slow links, `swap` can force a mid-load reflow when the font arrives late. `optional` uses the web font only if it wins the race (preload helps first visit); repeat visits hit HTTP cache immediately.

**Tradeoff:** Rare first visits on very slow links may stay on system-ui for that session. Non-Latin subsets are omitted (template UI is Latin-only).

**Files:** `src/styles/inter-font.css`, `src/index.css`, `vite/plugins/preload-fonts.ts`

---

## 6. Production transport (Cloudflare compression + cache semantics)

**What:** Documented Cloudflare’s automatic Brotli/gzip for text responses in `public/_headers`. Added explicit revalidation for `/` and `/sw.js`; kept immutable one-year cache on `/assets/*`.

**Why:** Fingerprinted assets are the bulk of bytes on repeat visits; immutable caching + CDN compression is the main transport win. Explicit `must-revalidate` on HTML/SW avoids stale entrypoints after deploy.

**Tradeoff:** Compression itself is platform-managed; we do not double-configure encodings in Wrangler.

**Files:** `public/_headers`, `wrangler.jsonc` (assets-only at the time of this pass; the Hono Worker `main` landed later)

---

## 7. Defer non-critical providers

**What:** `initAnalytics()` runs via `requestIdleCallback` (with `setTimeout` fallback) instead of synchronously in `main.tsx`. PostHog was already dynamically imported inside `initAnalytics`.

**Why:** Analytics is never on the critical path for first paint or first input. Idle scheduling keeps main-thread work focused on React boot.

**Tradeoff:** First pageview may fire slightly later on fast devices; acceptable for cookieless, env-gated analytics.

**Files:** `src/main.tsx`, `src/lib/analytics.ts`

---

## 8. Service worker precache (repeat visits)

**What:** `vite/plugins/emit-service-worker.ts` writes `dist/sw.js` from the final `index.html` asset graph plus the exact Inter latin and Charter regular faces selected by `preload-fonts.ts`. It also stores the SPA document at `/`. Deferred route chunks and Inter latin-ext stay out of the install precache; viewed route assets enter the runtime cache. `registerServiceWorker()` registers in production on `load`.

**Why:** Second and later visits on flaky networks can read fingerprinted assets from Cache Storage without waiting on the wire. Navigation stays network-first, but a failed navigation can fall back to the cached SPA document so queued local work survives a reload on a previously visited route.

**Tradeoff:** First visit stays network-bound and this is not a general offline guarantee. A route works offline only after its lazy assets have been visited and runtime-cached. Cache busting relies on filename hashes plus a content-addressed cache name; activate drops old builds' caches and prunes entries outside the precache allowlist.

**Files:** `vite/plugins/emit-service-worker.ts`, `src/lib/register-service-worker.ts`, `src/main.tsx`

---

## 9. `modulepreload` audit

**What:** `vite/plugins/filter-modulepreload.ts` strips automatic `modulepreload` links for lazy route chunks (`showcase`, `login`, `dashboard`, `not-found`, `motion-shell`, lucide spinners, sonner, etc.) while keeping `main-*.js`.

**Why:** Vite can preload discovered dynamic imports; on `/` that competes with entry download on constrained bandwidth.

**Tradeoff:** First navigation to a lazy route may start chunk fetch slightly later; prefetch on CTA hover/focus mitigates intentional journeys.

**Files:** `vite/plugins/filter-modulepreload.ts`, `vite.config.ts`

---

## 10. INP on home (lean toggle + static script)

**What:** Combines wins #2 and #3: the static theme button is interactive before React hydrates; after hydration, `ThemeToggleLean` avoids tooltip/floating-ui work on click.

**Why:** Input delay on slow devices often comes from main-thread contention and heavy component trees. A plain button + inline script minimizes work for the most common chrome interaction on `/`.

**Tradeoff:** Icon swap on `/` is instant swap (no motion) in the lean toggle; showcase keeps motion tooltip affordances.

**Files:** `index.html`, `src/components/theme-toggle-lean.tsx`

---

## Verification

After implementing:

```bash
pnpm build && pnpm size && pnpm perf:ci && pnpm test:run
```

`pnpm perf:ci` runs Lighthouse CI (`@lhci/cli`) against `/` and `/showcase` on the production preview server. It gates LCP/FCP and performance score; regressions that do not move bundle bytes (broken critical CSS inlining, `modulepreload` filtering, SW precache) still fail CI. Thresholds live in `lighthouserc.cjs`.

Re-profile Slow 4G + 4× CPU on `pnpm preview` (vite-template port, not another app on 4173). Expect lower entry brotli, fewer preloads in `index.html`, and static-shell LCP unchanged or improved.

**Post-pass measurement (July 2026):** entry `main-*.js` **~105 kB brotli** (down from ~130 kB) after lean home toggle + lazy sonner. Showcase chunk (`showcase-*.js`) measured **~44 kB brotli** with full `ThemeToggle` (tooltip + lucide) on `/showcase` only; the current budget is **48 kB** (see [slimming-reference.md](./slimming-reference.md) §9).

## Lighthouse budget calibration history

Home thresholds in `lighthouserc.cjs` (append-only record; the config keeps only the invariant):

- **2026-07: FCP 1200 -> 1400 ms, LCP 1500 -> 1700 ms.** The deliberate Charter preload (the
  companion to win #5: `font-display: optional` loses cold visits without a preload) shifted both
  paints up roughly 100 ms. GHA runs measure about 1290 ms FCP / 1520 ms LCP, so the old gates cut
  straight through the noise band and failed clean builds. Invariant unchanged: composite score is
  too noisy on GHA to gate on; LCP/FCP remain the hard regression gates.

## Related docs

- [slimming-reference.md](./slimming-reference.md): bundle slimming history and size-limit rationale
- [architecture.md](../reference/architecture.md): budget table
- `.claude/CLAUDE.md`: static shell maintenance, font policy, SSG launch gate
