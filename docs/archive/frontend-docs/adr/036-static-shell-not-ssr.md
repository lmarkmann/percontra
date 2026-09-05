# ADR 036: Static Shell, Not SSR, for First Paint

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

The template is a client-rendered SPA. A natural next suggestion is full SSR (TanStack Start, Nitro, or similar) for loading time, perceived performance, and security. The home route already ships a hand-rolled first-paint shell in `index.html` (`data-static-shell` plus inlined critical CSS).

## Decision

Do not add SSR to the template for speed. The static home shell is the FCP/LCP strategy on `/`. Prerender or TanStack Start remains a fork launch gate when crawlers must see body HTML beyond that shell, not a template feature.

vite-react-ssg does not support file-based TanStack Router (verified 2026-07-10). Evaluate Start at fork time; it was v0 when this was decided.

## Consequences

- Home FCP work stays in `index.html` and the critical-CSS plugin, not a second render pipeline.
- `/showcase` and `/dashboard` stay blank or skeleton until the JS graph downloads. That is accepted for the template; a content-heavy product fork is the case that would revisit this.
- Client route guards remain UX-only. Server checks (ADR 006) stay the access control. SSR is not a security upgrade here.

## Evidence

Fermi estimate, 2026-07-11, in `docs/synthesis/fermi-ssr-loading-gain-2026-07-11.md`:

- Home: ~0 ms human gain (80% CI roughly -100 to +150 ms). The 11 kB shell is already near-instant on slow 4G.
- Cold content routes: ~0.7-1.5 s faster content-visible on mobile, ~0.2-0.5 s desktop; ~0 faster to interactive (hydration downloads the same JS).
- Security delta: negligible. Secrets already live in the Worker; only public `VITE_*` vars ship.

If the goal is "feels faster," trim the hydration graph and add shells to more routes. If the goal is "bots see the content," that is the prerender case, and it is real.
