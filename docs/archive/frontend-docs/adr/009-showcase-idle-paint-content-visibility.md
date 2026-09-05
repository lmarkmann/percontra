# ADR 009: Pause Offscreen Showcase Demos with content-visibility

**Status:** Accepted
**Date:** 2026-07-11
**Amended:** 2026-07-11 (shimmer composited, sonner loading icon promoted; see Amendment)
**Deciders:** Luis Markmann

## Context

The 2026-07-10 orbit-badge lag investigation left `/showcase` in a known but accepted state: the page never goes idle. Steady-state DevTools traces on the built app (`vite preview`, no interaction, ProMotion display so 120 frames/s), main-thread renderer events per second:

| Renderer work                   | orbit badge spinning the `<svg>` (bug) | badge animation disabled | badge spinning a wrapper `<div>` (fix) |
| ------------------------------- | -------------------------------------- | ------------------------ | -------------------------------------- |
| Layout                          | 119/s, 7.4 ms/s                        | 0                        | 0                                      |
| Style recalc (UpdateLayoutTree) | 119/s                                  | 120/s                    | 120/s                                  |
| PrePaint                        | 119/s                                  | 120/s                    | 120/s                                  |
| Paint                           | 358/s, 42 ms/s                         | 240/s, 31 ms/s           | 240/s, 29 ms/s                         |
| RasterTask                      | 239/s, 5.6 ms/s                        | 120/s, 1.1 ms/s          | 120/s, 1.0 ms/s                        |

The badge bug itself was fixed in `src/components/orbit-badge.tsx` (the spin moved from the `<svg>` to an absolutely-positioned wrapper `<div>`, taking Layout from 119/s to 0). What remained after the fix: ~240 paints and ~120 style recalcs per second at rest, from two always-on demos:

- `Spinner` (`src/components/ui/spinner.tsx`): lucide `Loader2Icon` with `animate-spin` on the SVG element itself. Chromium composites SVG transform animations only when the element has its own compositor layer (`cc::Layer`); most inline SVG paints into its parent's record, so the rotation fell back to main-thread paint every frame. Instances sit in the attachment-states section permanently in the `loading` state.
- `LogoTraceLoader` (`src/components/logo-trace-loader.tsx`): animates `stroke-dashoffset`, which has no compositor path at all (only `transform`, `opacity`, `filter`, `backdrop-filter` can composite). The craft-patterns instance loops forever.

The badge investigation's rule of thumb stands, with a sharper mechanism: a continuous `transform` animation belongs on an HTML wrapper, never on the `<svg>` or an SVG child, unless the SVG element is deliberately promoted to its own layer (Chromium 89+ then composites it).

The original follow-up plan was hand-rolled viewport gating: an IntersectionObserver hook setting `animation-play-state: paused` on each demo while out of view. The platform meanwhile offers the same behavior natively: the CSSWG resolved (csswg-drafts #5611, css-contain-2) that CSS animations in `content-visibility` skipped subtrees are paused; skipped subtrees also skip layout and paint entirely. Blink implements this, and the repo already uses the pattern for long chat lists in `src/components/ui/chat/message-scroller.tsx`.

The spinner is deliberately exempt from the reduced-motion floor in `src/index.css` (a frozen spinner reads as broken), so removing or freezing its animation was never an option.

## Decision

Two levers, one per cost:

1. **Offscreen sections stop rendering work entirely.** Every showcase block renders through `ShowcaseSection` (`src/components/showcase/showcase-section.tsx`), so its `<section>` gains `[content-visibility:auto] [contain-intrinsic-size:auto_40rem]`. Offscreen sections skip layout, paint, and animation ticking with zero JavaScript; animations hold their timeline position and resume on re-entry. The `auto` keyword in `contain-intrinsic-size` remembers each section's real height after first render; 40rem is only the placeholder estimate before that.
2. **In-view spinners move off the main thread.** `spinnerVariants` (`src/lib/sizes.ts`) gains `will-change-transform`, forcing a compositor layer per mounted spinner so Chromium runs the rotation impl-side: the icon rasterizes once and the GPU rotates the layer. Permanent `will-change` is correct here because a loader animates for its entire mounted life; the layer is a few kilobytes of GPU memory for a `size-4` icon.

`LogoTraceLoader` is left unchanged: stroke properties cannot composite, so offscreen pausing via lever 1 is the only available win, and it is enough for a gallery route.

## Consequences

- `/showcase` does no per-frame rendering work for anything scrolled out of view; initial render also gets cheaper because offscreen sections skip layout and paint on load.
- The scrollbar reflects the 40rem estimate for sections that have never rendered; after first visit the browser uses remembered real sizes. Anchor navigation into a skipped section (`scroll-mt-28` targets) is spec-defined: the browser scrolls to the placeholder and renders on arrival.
- Each mounted spinner holds a small persistent GPU layer. This is the intended trade for a perpetually animating element and does not extend to other components.
- The reduced-motion contract is untouched: visible spinners keep spinning; pausing only ever applies to spinners nobody can see.
- Portaled overlay demos (dialogs, popovers) render into `body`, outside any skipped subtree, and are unaffected.
- Browsers without `content-visibility` support simply render everything, matching the previous behavior.

## Alternatives Considered

### IntersectionObserver viewport gating (the original plan)

A `useInView` hook toggling `animation-play-state: paused` per demo. Works, but requires new hook code wired into each demo, only pauses the two known animations rather than skipping all offscreen rendering, and reimplements what `content-visibility` provides declaratively.

### Move `animate-spin` to a wrapper div inside `ui/spinner.tsx`

The badge fix applied to the spinner. Rejected: call sites size and flex-align the SVG directly, and a wrapper element changes flex behavior across the app. Layer promotion via `will-change` achieves compositing without touching the DOM shape.

### Remove or time-limit the always-on demos

Rejected: the gallery exists to show the loading states; a demo that stops demonstrating is a worse gallery.

## Validation

Same methodology as the table above: `pnpm build`, `pnpm preview`, open `/showcase`, sit at the top of the page, record a steady-state performance trace with no interaction. Targets: ~0 Paint and Layout per second while the animating demos are offscreen; with the attachment-states section in view, spinner rotation shows no per-frame main-thread Paint (compositor-driven, verifiable in the trace or the Layers panel). Unit suite (`pnpm test:run`) and the showcase e2e specs (`pnpm test:e2e`), which scroll into gated sections, must pass unchanged.

Measured 2026-07-11 (700 px viewport, 120 Hz, page at top, no interaction):

- Skipping confirmed via `checkVisibility({contentVisibilityAuto: true})` on section children: everything from form-controls down (including the LogoTraceLoader and orbit badge in craft-patterns) is skipped. Chromium renders a proximity band of roughly two viewports below the fold, so the first handful of sections stay live; that band is implementation-defined and fine.
- Spinner promotion confirmed: with three spinners visible and spinning, the trace shows 0 Paint, 0 Layout, 0 RasterTask per second. The `will-change-transform` experiment succeeded; do not revert it.
- One animation the 2026-07-10 inventory missed: `tw-shimmer` on the attachment-name text in the processing demo animates a background, which is paint-driven (~360 small Paint events/s while its section is in the proximity band, ~25 ms/s). Initially left as is; superseded by the amendment below.
- Residual main-thread work is 120/s style recalc + PrePaint at ~10 ms/s combined, which is Chromium mirroring composited animation state back to computed style; this matches the old no-animation baseline.
- `pnpm check`, `pnpm typecheck`, unit suite (241 tests), and e2e suite (13 tests, including scroll-into-gated-section journeys) all pass.

## Amendment (2026-07-11)

Two follow-ups after the initial trace, closing the remaining paint sources:

1. **Shimmer is now compositable.** tw-animate-css's `shimmer` animates `background-position` under `background-clip: text`, repainting the glyph mask every frame; it was the entirety of the remaining ~360 Paint/s near the viewport. Replaced by a local `shimmer-sweep` utility (`src/styles/utilities.css`): a gradient overlay on `::after`, animated with `translateX` and layer-promoted, so it rasterizes once and the GPU moves it. The visual trade is deliberate: a box-level light sweep over the label instead of a glyph-clipped glow, indistinguishable in practice on an 18 px truncated filename. `AttachmentTitle` (`src/components/ui/chat/attachment.tsx`) now uses `shimmer-sweep` for the processing and uploading states; nothing else referenced `shimmer`. The sweep is decorative, so the reduced-motion floor freezing it is correct (the row keeps its spinner as the loading signal).
2. **The sonner loading icon gets the same promotion as `spinnerVariants`.** `src/components/ui/sonner.tsx` hand-rolls `animate-spin` on a `Loader2Icon` outside `spinnerVariants`, so the decision's second lever missed it, and loading toasts appear on product routes, not just the gallery. It now carries `will-change-transform`. Kept as a class addition rather than swapping in the `Spinner` component: `Spinner` sets `role="status"`, which would nest a second live region inside sonner's own announcer.

Re-measured with the attachment-states section scrolled into view, two shimmer-sweeps and three spinners visibly animating: **0 Paint, 0 Layout, 0 RasterTask per second** (previously ~360 Paint/s in that state). Only the 120/s style-recalc mirror remains. Full check/typecheck/unit suite passes (242 tests).
