# Motion: /showcase

2026-08-03. Register: **standard**, app-level. `MotionShell` (`src/components/motion-shell.tsx`)
wraps the route in `MotionConfig reducedMotion="user" transition={character.standard}`; the profile
and its justification are recorded in `src/lib/motion.ts:7` ("motion is punctuation, not spectacle",
sourced from the brief). Lane: implement. Proof: trace + frames.

Scope is the dialog interaction, taken as the representative overlay case. The other showcase
sections are surveyed but not specced; rows below are what a capture actually covered.

## Animations

| Element                   | Trigger                   | Class             | Token                                       | Duration                              | Curve                  | Exit         | Reduced           | Frequency  |
| ------------------------- | ------------------------- | ----------------- | ------------------------------------------- | ------------------------------------- | ---------------------- | ------------ | ----------------- | ---------- |
| `dialog-overlay`          | open                      | effects           | `--motion-fast` **declared, not applied**   | **150ms measured** (token says 120ms) | `--ease-out` (applied) | 150ms = 100% | clamped to 0.01ms | occasional |
| `dialog-content`          | open                      | effects + spatial | `--motion-medium` **declared, not applied** | **150ms measured** (token says 280ms) | `--ease-out` (applied) | 150ms = 100% | clamped to 0.01ms | occasional |
| `card` shadow             | dialog open (hover carry) | effects           | none                                        | 150ms                                 | default                | n/a          | 0.01ms            | frequent   |
| `button` background       | dialog open (hover carry) | effects           | none                                        | 150ms                                 | default                | n/a          | 0.01ms            | frequent   |
| `spinner`                 | loading                   | effects           | none                                        | 800ms loop                            | linear                 | n/a          | **survives**      | continuous |
| `spin-slow` (orbit badge) | ambient                   | spatial           | none                                        | 45s loop                              | linear                 | n/a          | **frozen**        | continuous |
| `logo-trace-loader-loop`  | loading                   | spatial           | none                                        | variable loop                         | linear                 | n/a          | **frozen**        | continuous |

Measured with `document.getAnimations()` and `getComputedStyle` against the dev server at 1280x900.

### Row findings

1. **The duration tokens do not reach the dialog.** Both surfaces carry `duration-fast` and
   `duration-medium` in their class strings, and both animate at **150ms**, tw-animate-css's own
   default. `getComputedStyle` returns `animation-duration: 0.15s` on each. The `ease-out` utility
   _does_ reach the keyframe (`cubic-bezier(0.22, 1, 0.36, 1)` is the applied timing function), so
   this is not a specificity problem across the board: Tailwind's `duration-*` sets
   `transition-duration`, and `animate-in`/`animate-out` are keyframe animations, which read
   `animation-duration`. The two never meet. Every `duration-*` class sitting beside a
   `data-open:animate-in` in this codebase is decorative.
2. **The 75% exit rule fails, invisibly.** Exit is 150ms against a 150ms entrance, a 1.00 ratio.
   It reads as correct in the diff because the source declares `duration-medium` for enter and
   nothing for exit; both land on the same library default. `src/lib/motion.ts` encodes the rule
   properly in `exitDuration()`, but that only governs the Motion presets (`panelPresence`,
   `cellCrossfade`, `cellSettle`), not anything applied through Tailwind data-state classes.
3. **Two loaders freeze under reduced motion.** See below.

## Interruption

| Interaction                   | Reverse  | Re-trigger | Velocity handoff |
| ----------------------------- | -------- | ---------- | ---------------- |
| dialog open -> Escape at ~40% | **fail** | not tested | n/a (no gesture) |

Reversing mid-flight at a measured `opacity: 0.823` starts the `exit` keyframe at `currentTime: 0`
with the element at `opacity: 1`. The panel jumps _up_ to fully opaque and then fades out. This is
the documented failure mode of keyframe animations versus transitions, and it is what the surface
ships.

## Reduced motion

Forced through Playwright's `reducedMotion: "reduce"` context option, not the system setting.
`matchMedia("(prefers-reduced-motion: reduce)").matches` confirmed true.

- **Correct end state, immediately:** yes. The dialog opens to `opacity: 1`, `transform: none` with
  `animation-duration: 1e-05s`. Nothing is stranded mid-transition.
- **Loading indicators still animate:** **partially.** `[data-slot="spinner"]` keeps its 0.8s
  rotation, but `spin-slow` (orbit badge) and `logo-trace-loader-loop` are both clamped to 0.01ms,
  i.e. frozen. The logo trace loader is a genuine loading indicator, so this removes the only
  signal that work is in flight, which is the exact exception the contract names.
- **Focus feedback still transitions perceptibly:** **no.** Button `transition-duration` is
  `1e-05s` under the clamp, covering `background-color, border-color, color, box-shadow, transform,
opacity`. Focus rings snap.

The blanket clamp is doing what a blanket clamp does. It needs the two exceptions carved out.

## Proof media

`proof/motion-showcase-2026-08-03-dialog-open-{t000,p050,t100}.png` plus
`proof/motion-showcase-2026-08-03-dialog-open.json` (trace).

Frames were pinned, not filmed. The pin had to be corrected twice against what `proof.md` ships;
see "What the contract got wrong" below. `t050-defect.png` is retained deliberately: it is the
frame the contract's own snippet produces, and it is byte-identical to `t100`.

Trace covers four open/close cycles. CLS 0.00, no long tasks surfaced, no layout-shift or
render-blocking insight raised against the interaction window. The dialog overlay carries
`supports-backdrop-filter:backdrop-blur-xs`, which is why a trace was required at all.

## Declined

- No motion was added by this pass. It is a measurement pass against an existing surface.
- Fixing the `duration-*` / `animation-duration` mismatch was declined **here**: it is a one-line
  change per component but it alters the feel of every overlay in the template at once, and the
  right value is a design decision (280ms is the declared intent, 150ms is the shipped reality and
  nobody has complained). Recorded as an open row instead.

## Not proven

- Only the dialog was captured. Tooltip, `icon-swap`, `success-confirm`, `docs-button` and the
  scroll-reveal stagger are surveyed in the table above from source and computed style, not from
  frames.
- Re-trigger and velocity handoff were not exercised; the surface has no gesture-driven motion.
- Nothing was measured on mobile viewports or under CPU throttling.

## Open rows for the template

| #   | Finding                                                                                          | Where                                                                     |
| --- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| M1  | `duration-*` never reaches `animate-in`/`animate-out`; every overlay runs at 150ms               | `src/components/ui/dialog.tsx:33,55`, `tooltip.tsx:51`                    |
| M2  | Exit runs at 100% of entrance, not 75%, wherever Tailwind data-state classes drive the animation | same                                                                      |
| M3  | `logo-trace-loader` and `spin-slow` freeze under reduced motion                                  | `src/components/logo-trace-loader.tsx`, `src/styles/theme-tokens.css:119` |
| M4  | Focus transitions clamp to 0.01ms under reduced motion                                           | global reduced-motion rule                                                |
| M5  | Dialog fails the interruption reverse test (keyframes, not transitions)                          | `src/components/ui/dialog.tsx`                                            |
| M6  | `icon-swap` hardcodes `cubic-bezier(0.2,0,0,1)` instead of `var(--ease-emphasized)`              | `src/components/icon-swap.tsx:6`                                          |
| M7  | `docs-button` hover scales to 1.06; functional UI stays under 1.02                               | `src/components/docs-button.tsx:35`                                       |

M1 through M5 were invisible to `motion_audit.py --lint`, which found M6 and M7. The linter checks
syntax; these are absences and mismatches, which is what the capture is for.
