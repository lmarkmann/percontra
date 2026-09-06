# ADR 009: The desk rail and the brand lockup

**Status:** Accepted
**Date:** 2026-09-06
**Decider:** Luis Markmann

## Context

The desk header carried `percontra.` as plain bold text with a green full stop.
That is the Deloitte grammar exactly: dark sans wordmark, one coloured dot. It
also wasted the identity settled in ADR 007, where the mark is a block of an
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

**The rail and the lockup share one clock.** Both run on `--motion-medium` with
the emphasized easing, and the lockup derives its two beats from that single
value, so the wordmark finishes resolving exactly as the rail finishes opening.
The registry's 200ms linear width transition is gone. Wiring this up exposed a
latent bug: the duration aliases were named `--duration-*`, which is not a
Tailwind namespace, so they generated no utilities and every `duration-fast` and
`duration-medium` class in the app silently fell back to Tailwind's 150ms
default. They now sit in `--transition-duration-*` and resolve.

**The mark is 24px square** when collapsed, centred on the icon column, and the
wordmark is set from the same 2.5rem so it reads as a masthead rather than a
line of body text. `--brand-lockup-size` is the single size knob.

**The six `--sidebar-*` colour roles return.** ADR 006 deleted them because
nothing rendered a sidebar. They reference the same ramps as the card roles, so
the rail reads as a raised surface rather than a second palette, and they carry
forced-colors overrides like every other role.

## Consequences

- The Deloitte-shaped text logo is gone from the header, which now holds only
  the rail trigger and the surface label. Identity lives in the rail.
- A step is reachable from the rail only while its section is on the page; steps
  2 and 3 are `aria-disabled` until a batch is selected, rather than scrolling
  to nothing.
- The wordmark is Klim Test Newzald Bold, so it moves with whatever ADR 007
  settles. The lockup reads `--font-serif`; nothing else changes when the face does.
- Home boot is 108.33 kB brotli against a 115 kB budget, CSS 14.92 kB against
  16 kB. Both still pass.
- `sheet` and `use-mobile` arrived with the sidebar and are used only by it.

## Evidence

`pnpm check`, `pnpm typecheck`, `pnpm knip` clean; `pnpm test` 183 passing in 58
files; `pnpm size` as quoted above. Both rest states and the collapse restore
were checked in the browser against the built bundle at 1440px: rail collapsed
from the cookie, the mark measured 23.99 by 23.99 px with its centre on the icon
column's, and `duration-fast` and `duration-medium` resolved to 120ms and 280ms
rather than the 150ms fallback.
