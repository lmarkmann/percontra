# Assessments: PS-7 and PS-9 (re-run 2026-07-03)

## Composed showcase (`/showcase`)

| Finding                                                   | Severity | Fix                                          |
| --------------------------------------------------------- | -------- | -------------------------------------------- |
| Scroll-triggered FadeIn at MOTION=3 violated brief        | Medium   | Removed; static sections per animate pass    |
| Section hierarchy flat without descriptions               | Low      | Added `ShowcaseSection` descriptions         |
| Chat card fixed height without empty path in same surface | Low      | `StatesShowcase` documents matrix separately |

## Technical audit and README compliance

**Visual capture:** Chrome DevTools MCP on preview `:4287` (desktop). Code-only for tablet/mobile/dark screenshots.

| Finding                           | Severity | Notes                                                                                                  |
| --------------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| oxfmt + oxlint Fast Refresh slice | **Pass** | Format via oxfmt; `react/only-export-components` on ui/motion; see `docs/reference/tooling.md`         |
| Favicon + SEO meta                | **Pass** | Verdigris Patina favicon; description + theme-color + og/twitter + `/og-image.svg`                     |
| Size budget                       | **Pass** | Entry JS ~141 kB / 150 kB; CSS ~18 kB / 19 kB after home/showcase split (showcase lazy on `/showcase`) |
| Theme toggle `aria-label`         | Pass     | `ThemeToggle`                                                                                          |
| State tabs `role=tab`             | Pass     | Arrow/Home/End keyboard + roving `tabIndex`; E2E `state tabs activate with arrow keys`                 |
| `prefers-reduced-motion`          | Pass     | `index.css` floor + `MotionConfig reducedMotion="user"`                                                |
| Detector `outline-none` on Button | Deferred | `@utility focus-ring` provides `:focus-visible` replacement                                            |
| Auth chunk isolation              | **Pass** | `auth-provider.tsx` lazy from `main`; WorkOS hook imported only in `workos-login-button` (login chunk) |

### README compliance sweep

| Requirement                                     | Status |
| ----------------------------------------------- | ------ |
| Documents pnpm, oxfmt, oxlint, prek, shadcn CLI | Pass   |
| Scripts table matches `package.json`            | Pass   |
| Routing + `requireAuth` + demo session          | Pass   |
| UI craft docs at `docs/frontend/`               | Pass   |
| Deploy target (Workers Static Assets)           | Pass   |
| `pnpm test:e2e` documented                      | Pass   |

## Accessibility review (adapted scope)

Original plan covered forms, kanban, and admin tables. This template ships showcase, login, and chat.

| Surface                        | WCAG                | Status   | Notes                                                                                                                                |
| ------------------------------ | ------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Login form (`/login`)          | 3.3.1, 3.3.2, 4.1.2 | **Pass** | `<label htmlFor>`; `aria-invalid` + `aria-describedby`; `role="alert"` on errors                                                     |
| Kanban / admin tables          | -                   | N/A      | Not in template                                                                                                                      |
| Chat composer                  | Labels, errors      | **Pass** | Icon `aria-label`; offline `aria-describedby`; transport `role="alert"`                                                              |
| States tablist                 | 2.1.1               | **Pass** | Arrow/Home/End with roving `tabIndex` + `aria-controls`                                                                              |
| Not-found title                | 1.3.1               | **Pass** | Full-page 404 uses `h1` (EmptyTitle stays `h2` for in-page empties)                                                                  |
| Touch targets (icon / default) | 2.5.5               | **Pass** | `after:size-11` = 44px hit area on hitArea sizes                                                                                     |
| Empty titles                   | 1.3.1               | **Pass** | `EmptyTitle` renders `h2`                                                                                                            |
| Static shell vs React home     | Consistency         | **Pass** | `index.html` mirrors outcome headline, rail, Charter body (2026-07-09)                                                               |
| Color contrast                 | 1.4.3               | Pass     | Patina verdigris OKLCH accent; every pair measured, plus forced-colors and prefers-contrast layers (`docs/frontend/color-report.md`) |

## Web performance: auth waterfall and boot

Trace on `http://127.0.0.1:4287/`:

| Metric                            | Value                | Verdict                 |
| --------------------------------- | -------------------- | ----------------------- |
| CLS                               | 0.00                 | Excellent               |
| Render-blocking CSS               | 4 ms                 | Negligible              |
| Auth (no `VITE_WORKOS_CLIENT_ID`) | Passthrough          | No OAuth SDK init       |
| PostHog (no `VITE_POSTHOG_KEY`)   | Skipped              | Dynamic import gated    |
| Entry JS (brotli)                 | 146.1 kB             | Within 150 kB budget    |
| `/dashboard` unauthenticated      | Redirect to `/login` | Confirmed (trace + E2E) |

## Playwright E2E

| Journey                     | Spec                                                           | Status |
| --------------------------- | -------------------------------------------------------------- | ------ |
| Counter                     | `loads hero and counter`                                       | Pass   |
| Theme toggle                | `toggles theme on html element`                                | Pass   |
| State matrix (scoped panel) | `switches data view states`                                    | Pass   |
| State tab keyboard          | `state tabs activate with arrow keys`                          | Pass   |
| Error toast (B1)            | `surfaces error toast from retry affordance`                   | Pass   |
| Chat send (B5)              | `sends a chat message through scripted transport`              | Pass   |
| Attachment (B4)             | `attaches a file before send`                                  | Pass   |
| Chat transport error        | `surfaces chat transport error when message contains fail`     | Pass   |
| Auth redirect               | `redirects unauthenticated /dashboard to /login`               | Pass   |
| Demo login to dashboard     | `demo login saves session and reaches dashboard`               | Pass   |
| Login validation            | `demo login surfaces validation for empty email`               | Pass   |
| Login transport error       | `demo login surfaces transport error when email contains fail` | Pass   |
| Not-found + home            | `renders not-found UI for unknown routes`                      | Pass   |

**13/13** on `pnpm test:e2e` (preview `:4287`).

## Final review

**Verdict: ready** (minor caveats accepted)

Brief lives at `docs/frontend/brief.md`. Copy or symlink to `.frontend/brief.md` only if your tooling expects that path.

### Block-ship findings

None.

### Major findings

None.

### Minor findings

- Icon hit area 40px (where hitArea sizes are not used)
- Auth lazy import ineffective (bundle note)

### Deferred per brief

- Showcase is not the production surface (out of scope)
- Detector `outline-none` covered by `focus-ring` utility
- Primitive gray ramps, IndexedDB queue, data tables (see `template-gaps.md`)

### Recommended next actions

1. Run finish checklist before shipping a surface: [finish-checklist.md](./finish-checklist.md).
2. Symlink `docs/frontend/brief.md` to `.frontend/brief.md` if local automation requires it.

Principles honored: add-on-first, typography hierarchy, one accent, motion as punctuation, tokens before arbitrary values.
