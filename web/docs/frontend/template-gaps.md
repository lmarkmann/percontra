# Template gaps and misconfigurations

Living inventory of what this starter ships, what is deliberate N.A., and what a clone should fill. Skills: **lm-ui-spatial**, **lm-color**, **lm-typography**, **lm-ui-states**, **lm-motion**, **lm-ui-polish**, **lm-ui-review**; start at **lm-ui-pipeline** when unsure which one a row belongs to. Last pass: 2026-08-02 (skill names corrected after the `lm-` prefix rename; the old `ui-foundation` no longer exists and split into spatial, color, and typography. Then a live spatial pass: the dead `--space-*` block removed, `viewport-fit=cover` added, and section 5 added because the board had no responsive row at all).

Use this as the "what is still missing?" board when forking. Do not treat blank cells as bugs if marked N.A.

## Status legend

| Mark        | Meaning                                          |
| ----------- | ------------------------------------------------ |
| **Done**    | Implemented and acceptable as template default   |
| **Partial** | Present but incomplete for a product clone       |
| **Gap**     | Missing; fill when the product needs it          |
| **N.A.**    | Not applicable to this starter; justify in Notes |

---

## 1. Foundation (tokens / type / color)

| Item                                             | Status | Notes                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Semantic OKLCH color spine                       | Done   | `--primary`, status, surface-tinted; warm hue 55                                                                                                                                                                                                                                                                                                                                                             |
| Primitive gray/accent ramps (`--gray-50` and up) | Done   | OKLCH gray + accent ramps; prefer semantic tokens in UI                                                                                                                                                                                                                                                                                                                                                      |
| 8pt spacing primitives                           | Done   | Tailwind's numeric scale (`--spacing`, `p-2`/`p-4`/`p-6`), which already is 8pt with a 4px half-step. The old `--space-xs`...`4xl` block was removed 2026-08-02: `--space-*` is not a Tailwind v4 namespace, so it generated no utilities and had zero `var(--space-` consumers, and this row claimed Done for a block that did nothing. Named steps use `--spacing-*`, as `--spacing-bubble-x` already does |
| Type scale (label/caption/body/title/display)    | Done   | Display fluid clamp                                                                                                                                                                                                                                                                                                                                                                                          |
| Intermediate type sizes 18/20/30                 | Done   | `--text-subtitle` / `--text-lead` / `--text-heading`                                                                                                                                                                                                                                                                                                                                                         |
| Inter UI + Charter prose                         | Done   | Self-hosted Charter; `font-prose`                                                                                                                                                                                                                                                                                                                                                                            |
| Tracking tokens (display/title/label)            | Done   | Applied on kickers and base headings                                                                                                                                                                                                                                                                                                                                                                         |
| Radii + concentric helpers                       | Done   |                                                                                                                                                                                                                                                                                                                                                                                                              |
| Shadows (border / elevated / floating)           | Done   | Dark mode ring-based                                                                                                                                                                                                                                                                                                                                                                                         |
| Z-index semantic stack                           | Done   | base to tooltip                                                                                                                                                                                                                                                                                                                                                                                              |
| Motion duration/easing tokens                    | Done   | `--motion-*`, aliases `--duration-*`                                                                                                                                                                                                                                                                                                                                                                         |
| SEO meta / OG / Twitter cards                    | Done   | `routeSeo` + `DocumentSeo`; absolute when `VITE_APP_URL`                                                                                                                                                                                                                                                                                                                                                     |
| Per-route robots (noindex demos/auth)            | Done   | showcase, login, dashboard, catch-all                                                                                                                                                                                                                                                                                                                                                                        |
| Canonical / og:url                               | Done   | Build + runtime when origin set                                                                                                                                                                                                                                                                                                                                                                              |
| Sitemap emit                                     | Done   | `emit-sitemap` writes to dist only with `VITE_APP_URL`                                                                                                                                                                                                                                                                                                                                                       |
| llms.txt                                         | Done   | Truthful template stub; rewrite for product content                                                                                                                                                                                                                                                                                                                                                          |
| WebSite JSON-LD                                  | Done   | Home only when origin set                                                                                                                                                                                                                                                                                                                                                                                    |
| Prerender / SSG for crawlers                     | Gap    | Launch gate: TanStack Start prerender (same router; Start is v0, evaluate at fork time). vite-react-ssg does not support file-based TanStack Router (verified 2026-07-10); home stays covered by the static shell                                                                                                                                                                                            |
| Favicon brand identity                           | Done   | Verdigris mark (`public/favicon.svg`); a real glyph is still fork work                                                                                                                                                                                                                                                                                                                                       |

## 2. States (lattice)

| Surface                | idle | loading                 | empty | error                    | partial | conflict                | offline                  |
| ---------------------- | ---- | ----------------------- | ----- | ------------------------ | ------- | ----------------------- | ------------------------ |
| App shell              | Done | N.A.                    | N.A.  | N.A.                     | N.A.    | N.A.                    | Done (`OfflineBanner`)   |
| Home `/`               | Done | N.A.                    | N.A.  | N.A.                     | N.A.    | N.A.                    | Shell                    |
| Login `/login`         | Done | Done (submit)           | N.A.  | Done (field + transport) | N.A.    | N.A.                    | Shell                    |
| Dashboard `/dashboard` | Done | Done (`LoadingSurface`) | Done  | Done (`ErrorState`)      | Done    | Done (`?view=conflict`) | Shell                    |
| Chat feature           | Done | Done (thinking)         | Done  | Done (transport)         | N.A.    | N.A.                    | Done (pill + queue hint) |
| Showcase matrix        | Done | Done                    | Done  | Done                     | Done    | Done (demo)             | Done (demo)              |

### Production matrix (dashboard demo switches, `?debug=1`)

| Item                              | Status | How to open                                         |
| --------------------------------- | ------ | --------------------------------------------------- |
| Permission denied (403)           | Done   | `?view=forbidden&debug=1` + `PermissionDenied`      |
| Filtered empty                    | Done   | `?view=filtered&debug=1`                            |
| Conflict on route                 | Done   | `?view=conflict&debug=1`                            |
| Lattice empty/error/partial/ready | Done   | existing debug links                                |
| Optimistic write reconciliation   | Done   | Chat offline queue via IndexedDB (`offline-queue`)  |
| Internationalization              | Opt-in | English-only template; choose per product (ADR 032) |
| Long content truncation matrix    | Done   | Showcase truncation + compact data table            |

## 3. Motion

| Item                            | Status | Notes                                                           |
| ------------------------------- | ------ | --------------------------------------------------------------- |
| Character **standard** default  | Done   | `MotionShell` + `character.standard`                            |
| CSS hover/press on controls     | Done   | Button press `scale(0.96)`; `hover-fine` on buttons/cards       |
| Modal enter/exit                | Done   | Dialog uses duration-medium + duration-fast backdrop            |
| Showcase staggered hero         | Done   | `FadeInGroup` only on showcase                                  |
| Product-zone character switches | Done   | Showcase "Motion character" section toggles standard/productive |
| Page transitions                | N.A.   | Forbidden on purpose (frame still); cells use ContentSlot only  |
| In-slot cell presence           | Done   | `ContentSlot` + cellCrossfade/cellSettle on dashboard body      |
| Scroll-linked marketing motion  | N.A.   | Brief: not on product routes                                    |
| Reduced-motion floor            | Done   | `index.css` + MotionConfig; skeleton pulse is `motion-safe`     |

## 4. Polish / craft

| Item                                      | Status  | Notes                                                           |
| ----------------------------------------- | ------- | --------------------------------------------------------------- |
| Hairline page rail                        | Done    | Home, showcase, login, dashboard, not-found                     |
| Editorial showcase figures                | Done    | `01 / Overview` through `13 / Motion`                           |
| Card fine-pointer hover                   | Done    |                                                                 |
| Empty title as heading                    | Done    | `EmptyTitle` is `h2`                                            |
| Static shell sync with home               | Done    | `index.html` mirrors copy + rail                                |
| Primary card differentiation on dashboard | Done    | Tinted + status pill + activity list                            |
| Signature detail (one per surface)        | Done    | Rail + version chip + brand favicon                             |
| Permission / first-run guidance UI        | Done    | `PermissionDenied` + login first-run hint                       |
| Data tables / dense admin patterns        | Partial | Compact table demo on showcase; not a full admin kit            |
| Image outline / media chrome              | Done    | `image-outline` on AvatarImage (agent-dock removed)             |
| No `transition-all` on controls           | Done    | Explicit property lists; guarded by `frontend-contract.test.ts` |
| Hit areas >=44px                          | Done    | Shared button hit area                                          |
| Icon swap recipe (opacity/scale/blur)     | Done    | `IconSwap` CSS dual-stack; Motion `iconSwap` + blur             |
| Press scale 0.96                          | Done    | Button (DynamicButton demo removed)                             |
| AnimatePresence `initial={false}`         | Done    | Including SuccessConfirm                                        |
| Panels use shadow tokens not hard borders | Done    | `shadow-border` / elevated / floating on ui + routes            |
| Scrollbar / overflow edge mask            | Done    | `scroll-fade-x` / `scroll-fade-b`                               |
| Success confirmation motion               | Done    | `SuccessConfirm` + craft showcase                               |
| Docs CTA icon press                       | Done    | `DocsButton` on craft showcase                                  |
| Optional superellipse utility             | Done    | `rounded-superellipse` (not default radius)                     |
| Scramble / logo-trace demos               | Done    | Showcase craft patterns section                                 |

## 5. Responsive and layout

Added 2026-08-02 after the first live responsive pass. The board had no row for any of this, and `finish-checklist.md` has no layout section, which is why the failures below shipped. Owner: **lm-ui-spatial** Layout lane. Measurements are from Chrome DevTools at 320x640, 320x568, 375x812, and 768x1024 against the dev server.

| Item                                 | Status  | Notes                                                                                                                                                                                                                                        |
| ------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `viewport-fit=cover`                 | Done    | Added 2026-08-02. Without it `env(safe-area-inset-*)` is always zero and all ten `safe-top` / `safe-bottom` call sites were inert. Meta tag verified; the insets themselves need a device with real insets to confirm                        |
| Overflow test measures the right box | Gap     | `e2e/mobile-overflow.spec.ts` asserts `scrollWidth <= clientWidth` on the document at 390px. On `/showcase` at 320px that passes while 21 elements overflow their own boxes. The probe has to run per element                                |
| 320px covered at all                 | Gap     | The mobile-overflow project pins iPhone 13 (390px) and visits `/showcase` only. Home, login and dashboard are uncovered, and the worst failure below is invisible above 320px                                                                |
| Craft-patterns panel at 320px        | Gap     | `craft-patterns-section.tsx`: a `flex flex-wrap items-center gap-6` row gives its `min-w-0 flex-1` scroll-fade panel **38px**, text clipped mid-letter. `min-w-0` removed the floor that would have forced the wrap. Needs a `basis-*` floor |
| Hotkey recorder at 320px             | Gap     | `hotkey-recorder.tsx` + `chord.tsx`: four `w-12 shrink-0` keycaps plus gaps leave **16px** for the flexible cap, whose label renders outside its box. The row should wrap or scroll, not shrink                                              |
| Home `h1` at 320px                   | Gap     | Overflows its column by 6px: U+2011 non-breaking hyphen in "design-forward" plus `hyphens-none` plus a 40px `clamp()` floor makes one unbreakable token. Mirrored in the static shell. Remedy is lm-typography's                             |
| Unguarded `justify-between` rows     | Gap     | `site-header.tsx:13` pushes its kicker past the shell edge at 320px. The repo uses `min-w-0` correctly 33 times elsewhere; this is uneven application, not a missing idea                                                                    |
| Container queries actually used      | Gap     | Two `container/...` names inherited from shadcn boilerplate, zero `@sm:`/`@md:` container variants anywhere. Components carry viewport prefixes instead                                                                                      |
| Fluid spacing                        | Gap     | One `clamp()` in the repo, for type. No fluid spacing, so section rhythm is fixed at every width                                                                                                                                             |
| Chat panel height                    | Partial | `--height-chat-panel: 35rem` is fixed: 516px against a 568px viewport, 91% of the screen, and past it once real browser chrome is counted                                                                                                    |
| Material tokens                      | Gap     | Four translucent surfaces, three alpha values, two blur radii, two `supports-backdrop-filter:` strategies, all inline. No `--material-*` roles and no `@utility` to type                                                                     |

## 6. Product surfaces (clone checklist)

When forking, fill these in order. Bootstrap todos with the same items live in `.claude/CLAUDE.md` (New-project bootstrap); delete them there as you complete each one.

### Product shell

1. Replace home copy, kicker, and the Patina ramps in `src/styles/theme-tokens.css`.
2. Wire real auth: install AuthKit, set `VITE_WORKOS_CLIENT_ID` (client) and `WORKOS_CLIENT_ID` (Worker var); `setLiveSession` is bridged from `AuthProvider`, and the Worker verifies AuthKit JWTs against WorkOS JWKS (`server/auth.ts`, ADR-6; no database). Remove demo session when live-only.
3. Point dashboard at a real API: set `VITE_API_BASE_URL` and you are done; the same-origin Hono Worker already serves `GET /api/dashboard` from the shared contract. Keep `?view=` / `?debug=1` only in non-prod. See `docs/reference/deploy-checklist.md`.
4. Add internationalization only when the product has real multilingual requirements (ADR 032).
5. Optional: product-zone motion character on dense admin shells (pattern on showcase).

### Server and test surfaces

| Item                                          | Status | Notes                                                                                  |
| --------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| Worker API (`/api/dashboard`, `/api/session`) | Done   | Hono on Workers (`server/index.ts`); `run_worker_first` routes `/api/*` first          |
| Server-side session verification              | Done   | WorkOS JWKS middleware in `server/auth.ts`; stateless, no database (ADR-6)             |
| Error-reporting seam                          | Done   | `src/lib/error-reporting.ts`; env-gated `VITE_SENTRY_DSN`, SDK opt-in                  |
| MSW test doubles                              | Done   | `src/test/mocks/` derives handlers from `src/contract/`; `onUnhandledRequest: "error"` |

### SEO / GEO (seams already shipped)

| #   | Todo                                                                                         | Where                                                                                                            |
| --- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | Fill product identity (`name`, `tagline`, `description`)                                     | `src/lib/site.ts`                                                                                                |
| 2   | Update per-route title, description, path, robots, ogImage                                   | `src/lib/seo.ts` (`routeSeo`)                                                                                    |
| 3   | Mirror home meta into first paint HTML                                                       | `index.html` (keep = `routeSeo.home`)                                                                            |
| 4   | Keep showcase/login/dashboard/catch-all `noindex` unless public on purpose                   | `routeSeo.*.robots`                                                                                              |
| 5   | New public route: `routeSeo` + `head` + `DocumentSeo` match + indexable path in emit-sitemap | `seo.ts`, route file, `document-seo.tsx`, `vite/plugins/emit-sitemap.ts`                                         |
| 6   | Set public origin (no trailing slash)                                                        | `VITE_APP_URL` in deploy env / `.env.local`                                                                      |
| 7   | After deploy: Sitemap line if you want robots discovery                                      | `public/robots.txt`                                                                                              |
| 8   | Rewrite citation stub for real pages only                                                    | `public/llms.txt`                                                                                                |
| 9   | Real share card art                                                                          | `public/og-image.svg` (and favicon)                                                                              |
| 10  | (Launch gate) Prerender if ranking/training crawlers must see body HTML                      | TanStack Start prerender or SSR (not vite-react-ssg; no file-based TanStack Router support, verified 2026-07-10) |

Verify with origin set:

```sh
VITE_APP_URL=https://your.domain pnpm build
# dist/index.html: absolute og:image, canonical, og:url
# dist/sitemap.xml: only index,follow paths
```

## 7. Verification commands

```sh
pnpm build && pnpm test:run && pnpm lint
pnpm test:e2e
# matrix demos (signed-in session required):
# /dashboard?view=ready&debug=1
# /dashboard?view=forbidden&debug=1
# /dashboard?view=filtered&debug=1
# /dashboard?view=conflict&debug=1
```

## Related

- [improvement-plan.md](./improvement-plan.md) ordered implementation plan
- [brief.md](./brief.md) principles and learned constraints
- [spec.md](./spec.md) per-surface composition
- [token-audit.md](./token-audit.md) foundation audit
- [assessments.md](./assessments.md) historical ship-gate notes
- [../tooling.md](../tooling.md) format + Fast Refresh gates
- [finish-checklist.md](./finish-checklist.md) contrast / tab order / motion CPU gate
