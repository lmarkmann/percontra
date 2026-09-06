# ADR 043: The desk rail and the brand lockup

**Status:** Accepted
**Date:** 2026-09-06
**Decider:** Luis Markmann

## Context

The desk header carried `percontra.` as plain bold text with a green full stop.
That is the Deloitte grammar exactly: dark sans wordmark, one coloured dot. It
also wasted the identity settled in ADR 042, where the mark is a block of an
agreed total over a double rule and the wordmark is the same rule closing a
bold serif.

The mark and the wordmark must never sit side by side. Two objects reading as
one lockup is what makes a logo look assembled rather than drawn, so the pair
had to be a single object with two states and a transition between them.

Nothing on the desk owned navigation. The page is one long four-step flow and
the only way through it was the scrollbar.

## Decision

**A collapsible rail, shadcn's Base UI `sidebar`,** fetched with the pinned CLI
so the registry owns its dependency graph. Collapsed it is the icon rail;
expanded it lists the four steps. Three deviations from the registry source,
each recorded because they fork it:

- `useSidebar` and its context moved to `src/hooks/use-sidebar.ts`. Exporting a
  hook beside components breaks fast refresh, which is why
  `react/only-export-components` is error-level on `src/components/ui/**`.
- `SidebarRail`'s `transition-all` became `transition-[transform,background-color]`.
  The repo's UI contract test forbids the former and is right to: it animates
  the layout properties the data attributes flip.
- `SidebarProvider` now reads the `sidebar_state` cookie it already wrote.
  Upstream writes it for an SSR host to read back; this app is client-only, so
  nothing read it and the rail forgot its state on every reload.

**The lockup is the rail's collapse indicator.** Expanded it is the wordmark,
collapsed it is the mark, and the transition is the one from the identity: the
block grows into the text box while the rules extend, then a seam sweeps left to
right with type on its left and block on its right; collapsing runs the same two
beats in reverse order.

**The seam is transforms only.** Two overflow windows slide in opposite
directions with their contents counter-translated. `clip-path` was the first
implementation and repainted the serif glyphs on the main thread every frame,
which was visible as stutter. Geometry is in em, so `font-size` is the only size
knob; one measurement per instance after the face loads supplies the wordmark
width and the two mark scale factors.

**The layer that has left its window flips to `visibility: hidden`** at the end
of its sweep. A discrete property cannot interpolate, so the hidden layer can
neither bleed a half-pixel of its antialiased edge at rest nor drift during the
sweep. A pixel of margin was tried first and produced each fault in turn.

**The six `--sidebar-*` colour roles return.** ADR 041 deleted them because
nothing rendered a sidebar. They reference the same ramps as the card roles, so
the rail reads as a raised surface rather than a second palette, and they carry
forced-colors overrides like every other role.

## Consequences

- The Deloitte-shaped text logo is gone from the header, which now holds only
  the rail trigger and the surface label. Identity lives in the rail.
- A step is reachable from the rail only while its section is on the page; steps
  2 and 3 are `aria-disabled` until a batch is selected, rather than scrolling
  to nothing.
- The wordmark is Klim Test Newzald Bold, so it moves with whatever ADR 042
  settles. The lockup reads `--font-serif`; nothing else changes when the face does.
- Home boot is 108.23 kB brotli against a 115 kB budget, CSS 14.77 kB against
  16 kB. Both still pass.
- `sheet` and `use-mobile` arrived with the sidebar and are used only by it.

## Evidence

`pnpm check`, `pnpm typecheck`, `pnpm knip` clean; `pnpm test` 183 passing in 58
files; `pnpm size` as quoted above. Both rest states and the collapse restore
were checked in the browser against the built bundle at 1440px: rail collapsed
from the cookie, and the mark's left edge measured 16px, the same as the icon
column.
