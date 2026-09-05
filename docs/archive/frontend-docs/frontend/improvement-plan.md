# Improvement plan: template gaps

**Historical record.** All items landed at the time, but the locale work in section 4 was removed on 2026-07-13 when the template returned to English-only (ADR 032). Several "out of scope" rows have since shipped anyway (Worker API, IndexedDB chat queue, server-side sessions).

Source: [template-gaps.md](./template-gaps.md). Scope is **template-visible** work only: patterns a clone can copy. Real auth APIs, multi-tenant color ramps, and IndexedDB queues stay clone work.

## Out of scope (deliberate)

| Item                       | Why                                                                   |
| -------------------------- | --------------------------------------------------------------------- |
| WorkOS / real session      | Seam exists; products wire `getSession`                               |
| Real dashboard HTTP        | Demo loader is the pattern                                            |
| Full primitive gray ramps  | Semantic stack enough for current components                          |
| IndexedDB optimistic queue | Since shipped: chat queues via IndexedDB (`src/lib/offline-queue.ts`) |
| Bulk shadcn registry dump  | Unrelated WIP; not part of this plan                                  |

## Implementation order

### 1. Foundation

- Intermediate type roles: `text-lead` (20px), `text-subtitle` (18px), `text-heading` (30px) as tokens + type-scale showcase rows.
- Brand favicon: warm bronze mark (hue 55), not stock purple Vite bolt.
- SEO/social: `og:*` + `twitter:card` in `index.html`; optional `og-image.svg`.

### 2. States (production matrix)

Extend demo `DashboardData` + debug switches:

| `view=`     | Surface                                                             |
| ----------- | ------------------------------------------------------------------- |
| `forbidden` | Permission denied empty (no retry of same resource; primary = home) |
| `filtered`  | Filtered empty + clear filters CTA                                  |
| `conflict`  | Two versions + keep yours / keep theirs                             |

Shared primitives:

- `PermissionDenied` (or Empty recipe) with lock media + copy contract.
- i18n under `dashboard.*` / `states.*` as needed.
- Showcase: document permission + filtered as matrix extras (tabs or note under states).

### 3. Motion

- Showcase section "Motion character": toggle `standard` vs `productive` on a small presence panel via `MotionConfig`.
- Proves zone registers without putting Motion on the home entry path.

### 4. Removed i18n fallback pattern

- `Locale = "en" | "de"`.
- German catalog: **core only** (home, common, errorBoundary); missing keys fall back to English.
- `setLocale` / `getLocale` real; `document.documentElement.lang` updated.
- Home or showcase: compact locale control (label only, no flag emoji).

### 5. Docs + verify

- Flip gap board rows to Done/Partial.
- Spec sections for new dashboard views.
- `pnpm test:run` + typecheck + oxfmt/oxlint.

## Acceptance

- Clone can open `/dashboard?view=forbidden&debug=1` (and filtered/conflict) and see production-matrix UIs.
- Favicon and OG tags no longer stock Vite purple.
- Type scale shows intermediate sizes.
- Locale switch to `de` changes home kicker/title; untranslated login still English.
- Motion character demo lives only on `/showcase`.

## Risk

- i18n typing: `Messages` stays English-shaped; de is `Partial` deep with runtime fallback.
- Dashboard loader delay still 900ms; acceptable for demo state visibility.
