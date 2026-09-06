# ADR 002: Ship Only Audited, Referenced Primitives

**Status:** Accepted
**Date:** 2026-07-13
**Deciders:** Luis Markmann

## Context

`src/components/ui/` had grown to roughly 50 shadcn primitives, of which 32 were unreachable from
any code outside the folder (verified by import graph, transitive closure included; they formed a
closed island). knip deliberately ignores `src/components/ui/**` because shadcn files export
library-style, so nothing automated would ever flag them.

Under ADR 010, every file in `ui/` is owned code the template vouches for. The July 2026 review
made the cost of that concrete: live WCAG criticals were found inside shipped primitives
(`input-group.tsx` nested-interactive, `chord.tsx` contrast). Unused primitives are the same class
of file, minus the audit; forks inherit them as trusted code that nobody reviewed.

## Decision

The template ships only the primitives it actually renders. The 32 unreferenced primitives
(`accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `badge`, `breadcrumb`, `button-group`,
`checkbox`, `collapsible`, `combobox`, `context-menu`, `direction`, `drawer`, `dropdown-menu`,
`hover-card`, `item`, `menubar`, `native-select`, `navigation-menu`, `pagination`, `popover`,
`progress`, `radio-group`, `scroll-area`, `select`, `sheet`, `sidebar`, `slider`, `switch`,
`table`, `toggle`, `toggle-group`) are deleted, along with `src/hooks/use-mobile.ts` (sole
consumer was `sidebar.tsx`) and its now-obsolete knip ignore entry.

The restore path is the pinned CLI: `pnpm exec shadcn add <name>`. A re-fetched component arrives
as stock nova and must be audited (accessibility, repo conventions) before use; auditing on demand
at fork time beats maintaining 32 primitives on spec.

This refines ADR 010 rather than contradicting it: keep-and-own governs how owned files are
treated; this ADR decides which files are owned.

## Consequences

- Every file in `src/components/ui/` is now load-bearing and covered by the review passes that
  audit rendered surfaces; the unaudited-liability class is empty.
- A fork wanting a pruned primitive pays a one-command fetch plus an audit, instead of inheriting
  a copy of unknown quality.
- The prune has no bundle effect (unimported files never entered any chunk) and required no
  size-limit or `components.json` changes.
- New primitives enter through use: `shadcn add` when a surface needs them, never speculatively.

## Alternatives Considered

### Keep all primitives, add a prune note to the bootstrap checklist

Zero deletion work and maximum fork convenience. Rejected: it leaves 32 unaudited files as
permanent review surface in every future pass, and the convenience is thin since restoring a
primitive is one command against a pinned CLI.

### Tighten the knip ignore so unused primitives are flagged

Automation instead of policy. Rejected as the primary mechanism: shadcn files legitimately export
more symbols than any one app uses, so knip on `ui/**` produces noise on kept files too; the
import-graph audit was manual for a reason. The ignore stays as-is.

## Validation

`pnpm typecheck && pnpm lint && pnpm knip && pnpm test` pass after the prune; `pnpm build` output
is unchanged for all budgeted chunks.
