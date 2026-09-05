# Type Spec: vite-template

Decided 2026-08-02 via `lm-typography`'s decision machine, retroactively: both faces were already shipping and neither had a written justification. Tone: neutral, precise, unbranded. Density: mixed, app chrome down to 12px plus a prose register. Budget posture: free-only.

This is a starter, not a product, which changes what the spec has to argue. A product justifies its faces against its brand; a template justifies them against being a good control condition that a fork can replace in one commit. Read every argument below with that qualifier attached, and see "For a fork" at the end, which is the part that applies to you.

## Faces

| Role                 | Face           | Foundry                               | License                                                          | Format                                              |
| -------------------- | -------------- | ------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| UI / body / headings | Inter Variable | Rasmus Andersson                      | OFL 1.1                                                          | variable WOFF2, wght axis, latin + latin-ext        |
| Prose (`font-prose`) | Charter        | Bitstream (X Consortium contribution) | Bitstream free-redistribution grant, see `src/fonts/LICENSE.txt` | 4 static WOFF2 (regular, italic, bold, bold italic) |
| Mono                 | none loaded    | n/a                                   | n/a                                                              | system `ui-monospace` stack                         |

### Face: Inter Variable

Runners-up: Switzer (lost because Fontshare ships no variable build with published fallback metrics, so a template using it would owe every fork a hand-tuned `size-adjust`); General Sans (lost because its wider apertures and larger counters cost density in the 12px chrome this template has to prove works).

Why this and not Switzer: Inter is on the anti-list precisely because it is the reflex, and for a product that is disqualifying; for a neutral starter it is the requirement, because the one face here that must not express a point of view is the one a fork is expected to replace. Inter is the only candidate that arrives with a Fontsource variable package, published fontaine fallback metrics, and hinting proven at 12-14px, which is exactly the set of properties a control condition needs and a brand face does not.

Iron rule 3's second clause (re-tune the defaults so the choice reads as decided) is satisfied and the evidence is in the code, not in this sentence: `--tracking-display: -0.04em`, `--tracking-title: -0.02em`, and `--tracking-label: 0.06em` are named tokens rather than per-component nudges (`src/styles/theme-tokens.css`), the metric-matched `Inter Fallback` over Arial is computed rather than guessed, and `tabular-nums` is applied at every numeric surface (`src/components/metric-value.tsx`, the dashboard activity list, error IDs).

### Face: Charter

Runners-up: Newsreader (lost because its three optical sizes are range this template's single prose register cannot use, at a payload it would still pay); Source Serif 4 (lost because its metrics sit further from Georgia, so the metric-matched fallback would be decorative rather than honest).

Charter is not on the anti-list. It wins on three measurable things: 14.6 KB for the regular weight against Georgia-close metrics, a free-redistribution grant with no web-license friction for a vendored woff2, and a `size-adjust` of 99.37% over Georgia, which means `Charter Fallback` genuinely holds the line rather than approximating it.

## Pairing

- **Contrast axis: register, and only register.** Sans carries interface and hierarchy; serif carries reading. Everything else is held close deliberately, and the boundary is enforced: a serif that creeps into headings turns a two-face system into an undecided one (`docs/frontend/brief.md`, 2026-07-09).
- **Kinship, measured** with `font_metrics.py`: Inter x/em 0.546, Charter x/em 0.481, **13.5% apart**, which is the "mismatched" band. x/cap is 0.750 against 0.717, inside the 0.05 texture threshold, so the two faces do share a texture; it is scale they disagree on.
  Compensation: none applied today, and that is a live decision rather than an oversight. Charter never sits inline beside Inter at the same size; it owns whole prose blocks, where the eye recalibrates. If a fork ever sets the two in the same line, `font-size-adjust: 0.546` on the Charter run is the fix, not a hand-tuned size.
- **Rejected pairing:** Inter with Newsreader (lost because Newsreader's x-height sits much closer to Inter's, which sounds better and is actually worse here: with the two faces nearly matched, the register split stops being legible and the second face reads as an accident rather than a decision).

## Scale

- Base 16px on a semantic ladder rather than a t-shirt ladder: `--text-label` 12 / `--text-caption` 14 / `--text-body` 16 / `--text-subtitle` 18 / `--text-lead` 20 / `--text-title` 24 / `--text-heading` 30, in `src/styles/theme-tokens.css`.
- The ramp is the canonical 12 / 14 / 16 / 18 / 20 / 24 / 30 rather than one pure ratio, because 18 and 20 were added as intermediate anchors when the jump from 16 to 24 left third-level hierarchy nowhere to sit (2026-07-09). That is the documented deviation, and it is optical: `type_scale.py --base 16 --ratio 1.2` would emit 19.2 and 23.0 for those slots.
- Display clamp: `clamp(2.5rem, 4.2vw + 1.2rem, 3.75rem)`, MAX/MIN 1.5x, fluid across roughly 495 to 971px of viewport. Reproducible with `type_scale.py --base 16 --display-clamp 40,60 --viewport 495,971`, which emits it character for character.
- `type_scale.py --check src/styles/theme-tokens.css` passes: rem discipline holds, the clamp carries a rem term, nothing is over the 2.5x ceiling, no 13/15/17px one-offs.

## Figures and features

- `font-variant-numeric: tabular-nums` at every numeric surface, applied through the `tabular-nums` utility rather than globally: `metric-value.tsx`, the dashboard activity list, error IDs in `error-state.tsx` and `error-boundary.tsx`. Numbers that change must not reflow their column; numbers in prose should not.
- No other features forced on. Inter's `ss01`-style alternates are deliberately unused: a template that ships opinionated alternates makes them a fork's problem to discover and undo.

## Subset

- Character set: Latin and Latin Extended only, unicode-range gated in `src/styles/inter-font.css` so a Latin-only page never requests latin-ext. Charter ships Latin-oriented woff2 with the same range gate.
- The template is English-only by ADR 032. A fork with real multilingual requirements re-runs Gate 3 against its actual language list; the range gates here are the seam to edit, not a constraint to work around.

## Fallback stack

- `--font-sans: "Inter Variable", "Inter Fallback", sans-serif`
- `--font-serif: Charter, "Charter Fallback", "Bitstream Charter", "Sitka Text", "Iowan Old Style", Georgia, "Times New Roman", serif`
- `--font-mono: ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, monospace`

Overrides, in `src/styles/theme-tokens.css` so `critical.css` can inline them for the static shell, reproduced by `font_metrics.py --fallback-for`:

| Fallback         | over    | size-adjust | ascent | descent | line-gap |
| ---------------- | ------- | ----------- | ------ | ------- | -------- |
| Inter Fallback   | Arial   | 107.12%     | 90.44% | 22.52%  | 0%       |
| Charter Fallback | Georgia | 99.37%      | 98.62% | 23.75%  | 0%       |

These were computed independently with fontaine's formula from `@capsizecss/metrics` before the script existed, and the script reproduces both to the digit. That agreement is the reason to trust either.

## Loading

- Inter: self-hosted from `@fontsource-variable/inter` files, `font-display: optional`, latin weight preloaded by `vite/plugins/preload-fonts.ts`. `optional` rather than `swap` because a late swap reflows the page on slow links; the cost is a rare first visit that stays on the metric-matched fallback for that session (`docs/synthesis/slow-network-performance.md`).
- Charter: vendored woff2 in `src/fonts/`, `font-display: optional`, regular preloaded, italic and bold lazy.
- Budget: Inter latin 47 KB plus latin-ext 83 KB, Charter regular 14 KB preloaded (italic 15, bold 15, bold italic 16 lazy). First paint pays 61 KB of the 150 KB two-family ceiling in `lm-ui-review/references/perf-budgets.md`.
- Weights: Inter carries a 100-900 axis but the design uses four points (400, 500 for the 46 `font-medium` call sites, 600, 700). A fork that never needs the range should consider static cuts; see the shipping guide's variable-versus-static rule.
- Non-web targets: none.

## Proof

Not captured. Both faces predate this spec and neither went through `font_proof.html` at the time, so writing a proof block now would be documenting a session that never happened. The honest state: Inter's 12-14px behaviour is proven by three years of shipped dense UI rather than by a capture in this repo, and Charter's prose register is proven only by looking at `/showcase`.

A fork that keeps either face inherits this gap. A fork that replaces one runs the proof page properly and pastes the block here with its copy button.

## For a fork

Neither argument above survives contact with a real product, by construction. Inter is justified here as a neutral control, which is not a reason any shipping product can use, and the anti-list exists because Inter is what appears when nobody decides.

Replacing it is a fork checklist item, not an optional footnote. Run the machine at `~/Documents/.parked/frontend-skills/tools/typography/font_decision_machine.md`, rewrite the `### Face:` sections, and let the gate tell you when the spec is complete:

```
pnpm type-spec-gate
```
