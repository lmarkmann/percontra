# Open work

The single forward-looking file for this template. Everything here is open; shipped work lives in ADRs and in git, not here.

Fork-time product work (fill `site.ts`, wire PostHog, prerender for crawlers) stays on the fork board: [`frontend/template-gaps.md`](./frontend/template-gaps.md). Do not copy it here.

## How a row moves

1. A row leaves this file only when the change that closed it has landed. Nothing shipped stays here.
2. Session notes and review dumps (`.claude/remembering/`, merged backlogs) are harvested into an ADR, a reference file, or a row here, then deleted. They are not a third open list.

## Harvest, 2026-08-25

`docs/combined-open-items.md` (July 2026 manual + frontend review) was walked against the current tree. Every remaining row had already landed or been decided:

- Tier 0: ADR 032, 033, 034.
- Tier 1 a11y and the `DB_NAME` leak: `min-w-0` on truncation cards, keycap contrast, input-group role removed, FieldError `aria-describedby`, `#main` focus on navigation, first-invalid focus on login, static theme-toggle hit area, muted-foreground L 0.53, theme-color metas, IndexedDB name from `site.name`.
- Tier 2 chrome: `SiteHeader` on all five routes, StatusPill in the truncation table, showcase nav covers the sections, figures 01-15 in render order, `dark:bg-card` elevation, scramble-text paints the real string first, LogoTraceLoader is no longer hardcoded incomplete.
- Tier 3 decisions: ADR 023, 024, 025, 026, 027, 028. Docs-button already has `(opens in new tab)`. OrbitBadge copy is `MADE TO LAST`, not a SOC 2 claim. Last-sync uses body weight, not `text-title`.
- Test-runner architecture: ADR 038.

No row from that board remains. New template-owed work starts a new row below.

## Open

None.
