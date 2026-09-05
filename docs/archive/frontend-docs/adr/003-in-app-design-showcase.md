# ADR 003: Design Preview: In-App Showcase, Not Storybook

**Status:** Accepted
**Date:** 2026-07-03
**Deciders:** Luis Markmann

## Context

The template had two overlapping design-system surfaces: Storybook (16 colocated stories, not in CI) and the in-app showcase (`src/components/showcase/*` on `/`). Storybook added devDependencies, Babel via `react-docgen`, and maintenance surface without a clear advantage over the showcase, which already exercises routing, i18n, theme, and composed patterns.

## Decision

- **Single preview surface:** the in-app showcase at `/showcase` (`pnpm dev` -> `/` home, `/showcase` preview).
- **Storybook removed:** no `.storybook/`, no story files, no Storybook scripts.
- **Primitive documentation** stays in `docs/frontend/components/` and colocated tests (`design-system.test.tsx`).
- **E2E** (`e2e/showcase.spec.ts`) is the automated gate for preview regressions.

## Consequences

- **Easier:** one place to verify UI; showcase runs in the same provider tree as production routes; −57 transitive packages.
- **Harder:** no Storybook controls/a11y addon UI for isolated knobs: use showcase sections and unit tests instead.
- **Bundle:** motion (`LazyMotion` + `domAnimation`) lives in a lazy `motion-shell-*.js` chunk loaded with `/showcase`, not in the entry chunk; home stays lean; see slimming-reference section 9.
- **Revisit:** if a team needs Storybook for external design handoff, re-add it as a conscious fork decision, not a template default.

## Action Items

1. [x] Remove Storybook packages, config, and stories.
2. [x] Keep `docs/frontend/` as the written design record.
3. [x] Re-tighten the Size Limit budgets after `/showcase` split (155 kB entry / 25 kB showcase / 18 kB CSS brotli). The configuration now lives in `package.json`; see [slimming-reference.md](../synthesis/slimming-reference.md).
4. [x] Entry regression fix (2026-07-03): defer `LazyMotion` to lazy `motion-shell-*.js` on `/showcase` only; CSS theme-icon swap on `/`; lazy `NotFoundRoute`. Added motion budget row (14 kB). Measured entry ~137.8 kB; do not raise the 155 kB cap to absorb motion; motion is intentionally out of entry. Details: [slimming-reference.md section 9](../synthesis/slimming-reference.md#9-size-limit-budgets).
