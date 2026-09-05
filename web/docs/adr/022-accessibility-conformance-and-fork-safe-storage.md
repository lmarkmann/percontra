# ADR 022: Accessibility Conformance Pass and Fork-Safe Offline Storage

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

A review of the running app surfaced a batch of live WCAG failures, concentrated on `/showcase` and the app shell, plus one data bug in the offline queue. None of them block a build, and there is no automated WCAG gate to catch them (the `jsx-a11y` oxlint plugin catches static markup, not rendered contrast or focus behavior; `docs/frontend/assessments.md` is a manual audit). Because this is a template, every fork inherits these defects verbatim, and forks copy the showcase sections as the reference for their own forms and layouts. That makes the source the right place to fix them, and worth a decision record so the invariants do not regress.

The specific findings:

- The truncation demo cards are CSS-grid items. Grid items default to `min-width: auto` (their intrinsic content width), so a `truncate` box never gets narrow enough to clip and the track blows the row out to roughly 843px at a 375px viewport.
- Idle keycaps rendered their glyph at `text-muted-foreground/45` over `bg-muted`, about 1.5:1 in light. Light `--muted-foreground` itself sat at `oklch(0.556 ...)`, roughly 4.73:1 on white at 12px labels, right on the edge.
- `InputGroupAddon` was a `div role="button" tabIndex={0}` that wraps real buttons (the chat composer's attach and send controls), a nested-interactive violation that adds a phantom tab stop and a button-inside-a-button to the accessibility tree.
- The showcase invalid field set `aria-invalid` but never linked its error text, so assistive tech announces the field as invalid without the reason.
- Nothing moved focus after a client navigation, stranding keyboard and screen-reader users at the top of the tab order on every route change.
- The static-shell theme toggle was a bare 32px button with no expanded hit area, below the 44px target its hydrated React sibling already meets.
- Both `theme-color` metas were `media`-gated and written unconditionally, so an explicit theme that disagrees with the OS scheme left the browser chrome showing the wrong surface.
- `offline-queue.ts` hardcoded the IndexedDB name `vite-template-offline`, so two forks on the same `localhost` origin shared one database and flushed each other's queued chat sends.

## Decision

Fix all of it at the source and hold the invariants with colocated tests.

- **Shrinkable tracks.** Truncation and clamp cards carry `min-w-0` so the box can shrink and the ellipsis engages. This is the standard fix for `truncate`/`line-clamp` inside grid or flex tracks; apply it wherever a clamped cell lives in a flex or grid item.
- **Contrast floor.** Text that must be read clears WCAG 1.4.3 (4.5:1 for normal text). Idle keycaps drop the `/45` opacity, and light `--muted-foreground` moves to `oklch(0.53 ...)`. `public/404.html` mirrors the token and is guarded by `theme-fallback.test.ts`, so the two move together.
- **No fake interactivity around real controls.** UI primitives never wrap real buttons in a `role="button"` container. `InputGroupAddon` is presentational (no `role`, no `tabindex`, no synthetic key handling); a bare `onClick` on a static element would only trade one `jsx-a11y` violation for another, so the container carries no interaction of its own.
- **Errors are associated.** An invalid control points `aria-describedby` at the id of its error node, and the error node carries `role="alert"`. The showcase form now wires this the way the login form always has, so forks copy a correct pattern.
- **Focus follows navigation.** `RouteFocus` (`src/components/route-focus.tsx`, rendered in `__root`) moves focus to `#main` on client navigation, skipping the initial load and selecting on `pathname` so search-only navigations do not steal focus. Every route's `#main` stays `tabIndex={-1}` and `outline-none` for this.
- **44px targets.** Icon buttons keep a 44px hit area (WCAG 2.5.5), including the static-shell toggle, via the shared `after:size-11` pseudo-element fragment.
- **Chrome tracks the chosen theme.** The `theme-color` metas stay scheme-gated only in system mode; an explicit light or dark choice pins both metas to the resolved surface. The rule lives in two writers that must agree: the `index.html` boot script (first paint and pre-React toggle) and `theme-provider.tsx` (runtime toggle and OS change).
- **Fork-isolated storage.** The offline-queue IndexedDB name derives from `site.name` (`${site.name}-offline`), so renaming a fork isolates its store instead of colliding on a shared origin.

## Consequences

- `/showcase` holds its width at 375px, idle keycaps and muted labels clear 4.5:1, the composer's addon buttons are single tab stops, and the invalid field announces its reason.
- Route changes land focus in the new page's main content; the pattern is one null-rendering component under `__root`, inert under the unit-test router mock so existing route suites are unaffected.
- The two theme-color writers and the two surface-hex pairs are duplicated across a vanilla-JS shell and a TS module, the same deliberate duplication already documented for `resolveClass`. A surface color change touches both.
- `site.name` is `vite-template` today, so the derived DB name is byte-identical and no migration is needed for this repo; a fork that renames starts from an empty, isolated queue.
- There is still no automated contrast or full WCAG gate. These fixes are held by targeted unit tests (class presence, ARIA wiring, focus behavior, meta content) plus the existing `e2e/mobile-overflow.spec.ts`, not by a conformance scanner.

## Alternatives Considered

### A Field context that auto-wires ids

Give `Field` a context that generates an id and threads it to the control and `FieldError` automatically, so no call site hardcodes the association. Rejected for now: it would change the plain shadcn primitives into context-aware components for a demo section's benefit, more surface area than the fix warrants. Static call-site wiring in the showcase is what forks copy, which is the goal.

### Keep the addon interactive with keyboard support

Preserve click-to-focus by keeping the handlers and satisfying `jsx-a11y` some other way. Rejected: the addon wraps real buttons, so any role or tab stop on the container is the nested-interactive bug. Presentational is the only form that is both lint-clean and correct; the click-to-focus convenience is not worth reintroducing the violation.

### Update theme-color only in the boot script

Do just the `index.html` half the review named. Rejected because after hydration an in-app theme toggle goes through `ThemeProvider`, which would leave the metas stale; the fix has to live in both writers to actually hold.

### A MODE branch or lower contrast to keep the design

Shorten the muted ramp difference or special-case tests. Rejected on the same grounds as ADR 020: product code stays unaware of tests, and contrast is a correctness floor, not a style knob.

## Validation

Run the touched suites:

```
pnpm vitest run \
  src/components/route-focus.test.tsx \
  src/components/ui/input-group.test.tsx \
  src/components/showcase/form-controls-section.test.tsx \
  src/components/showcase/truncation-table-section.test.tsx \
  src/components/chord.test.tsx \
  src/components/theme-provider.test.tsx \
  vite/plugins/static-shell.test.ts \
  vite/plugins/theme-fallback.test.ts \
  src/lib/offline-queue.test.ts
```

Then `pnpm typecheck` and `pnpm lint`. In the running app (`pnpm dev`): `/showcase` at 375px has no horizontal overflow, idle keycaps and muted labels are legible, the invalid field announces its error, and the addon buttons are single tab stops; tabbing through a client navigation lands focus in `#main`; toggling the theme against an opposing OS scheme keeps the browser chrome matching the chosen theme.
