# Type Spec: Per Contra

Decided 2026-09-06 via the `lm-typography` Pair lane. Tone: institutional, exact, unfussy.
Density: dense data app (12 to 14px chrome over ledger tables). Budget posture: trial-then-buy.

Per Contra is a sign-off workbench for fund migrations. The reader is a fund manager or fund
accountant, not an engineer, and the page is mostly account codes, amounts and short verdicts.
Type carries two jobs here: a serif that makes the product read as editorial rather than as
another dashboard, and a sans that survives a number column at 12px.

## Faces

| Role | Face | Foundry | License | Format |
|---|---|---|---|---|
| UI, headings (`--font-sans`, `--font-heading`) | Test Söhne | Klim Type Foundry | Test Font Licence, 8 Nov 2018, evaluation only | static WOFF2, 400/500/600 roman |
| Coverage layer under Söhne | Inter Variable | Rasmus Andersson | OFL 1.1 | variable WOFF2, latin + latin-ext |
| Prose, wordmark (`--font-prose`, `--font-serif`) | Test Newzald | Klim Type Foundry | Test Font Licence, 8 Nov 2018, evaluation only | static WOFF2, Book and Bold, roman and italic |
| Mono (`--font-mono`) | system `ui-monospace` | n/a | n/a | none shipped |

The Klim licence permits internal evaluation and client demonstration and forbids commercial use
and redistribution, so `web/src/fonts/*.woff2` is gitignored and the hackathon demo sits behind
Cloudflare Access. Shipping Per Contra commercially means buying both families or replacing them;
the runner-up rows below are the replacement shortlist, not decoration.

### Face: Test Söhne

Runners-up: National 2 (lost because Söhne was the owner's call on character, though National 2 won the measurement); Calibre (lost because its x/cap 0.723 sits further from Newzald than Söhne's 0.728 and it reads a size smaller at the same px, which costs chrome density).

Why this and not National 2: Söhne is the neo-grotesk with the largest x-height in the pack
(x/em 0.523), which is what holds a 12px table together, and its plainness lets Newzald carry all
the character in the lockup and the prose. National 2 would have split that job in two.

Known cost, accepted: Söhne's `1`, `l` and `I` are near-identical stems, which is the classic
Akzidenz weakness and a real hazard in account codes such as `1I0l-O0`. National 2 and Karbon
were the only candidates that disambiguate. If a code column ever misreads in testing, set that
one column in `--font-mono` rather than swapping the family.

Rejected outright, with the measurement: Karbon (best kinship in the pack at Δx/cap 0.007, and
still wrong: a Futura/Gill geometric is the weakest class at 12px in a numeric table);
Founders Grotesk Text (Δx/cap 0.047, the loosest texture match of the finalists, and its
idiosyncratic `a` and `G` read folksy against a fund ledger).

### Face: Inter Variable

Runners-up: [DEFAULTED: inherited from lmarkmann/vite-template, not evaluated]

Why this and not Geist: Inter is not on the page as a chosen face at all. It is the coverage layer under Söhne, and the only requirement is that it match Söhne's genre and x/cap closely enough to disappear at 12 to 14px. Inter does (0.750 against 0.728), it was already installed and preloaded, and swapping it for another grotesque would add a face to the budget to solve nothing.

Inter is not a chosen face here and is not on the page as itself. The Klim test cut of Söhne
carries 68 characters (space, comma, hyphen, period, digits, A-Z, a-z, A-macron) and no OpenType
features at all. Inter sits directly behind Söhne in `--font-sans` and renders the characters
Söhne lacks. Measured against the tracked surface those are exactly ten: `:` `/` `;` `'` `?` `&`
`(` `)` `|` `_`, 33 occurrences in total. Both faces are neo-grotesks at a near-identical x/cap
(0.728 against 0.750), so the join is invisible at UI sizes. Set the same strings against a
system-sans fallback instead and it is not; see Proof below.

Buying the Söhne retail licence removes this layer, because the retail cut has full coverage.

### Face: Test Newzald

Runners-up: Bitstream Charter (lost because it was the template default, an inherited face with no argument behind it); Klim Test Signifier (lost because its high contrast breaks up at 16px body size, where Newzald's Dutch economy holds).

Newzald was already committed in 3fb60b4 under ADR 007. It stays. Klim's own "Newzald in use"
list pairs it with Söhne and with National, which is the foundry's own evidence for this pairing.

## Pairing

- Contrast axis: **classification only** (Dutch old-style serif against neo-grotesk sans). Weight,
  width and colour are deliberately held close, so the page reads as one voice in two registers.
- Kinship, measured with `font_metrics.py` on the vendored woff2:

  | | x/em | cap/em | x/cap |
  |---|---|---|---|
  | Test Newzald Book | 0.436 | 0.588 | 0.741 |
  | Test Söhne Buch | 0.523 | 0.718 | 0.728 |

  x-heights are 20.0% apart on the em, and x/cap is 0.013 apart. **The second number is the one
  that governs.** x/em conflates texture with how large a face draws on its em square, and the
  latter is absorbed by a size step; Newzald's cap/em of 0.588 is unusually small, which is why it
  reads as a small-x face on the metric table and as a large-x face in Klim's own copy.
  Compensation: none as `font-size-adjust`. Prose is set at `--text-body` (16px) and above while
  chrome sits at 12 to 14px, so the size step already exists and doing both would double-count.
- Rejected pairing: Newzald with Calibre (lost because Calibre was selected on the x/em column,
  which measures em-square proportion, not texture); Newzald with Karbon (lost because a
  geometric sans fails the 12px table).

## Scale

- Base 16px, no generated ratio: the steps are hand-set semantic anchors (12 / 14 / 16 / 18 / 20 /
  24 / 30) with a fluid display step, inherited from the template and kept.
- Display clamp as shipped: `clamp(2.5rem, 4.2vw + 1.2rem, 3.75rem)`; MAX/MIN 1.5x, so it is
  inside the 2.5x ceiling.
- `uv run --script tools/typography/type_scale.py --check src/styles/theme-tokens.css` passes:
  rem discipline holds, no pure-vw clamp, no 13/15/17px off-ramp sizes.
- Deviations from a strict ratio, with the optical reason: 18 and 20 exist as third-level
  hierarchy anchors between 16 and 24, which a 1.25 ratio does not provide.

## Figures and features

- `font-variant-numeric: tabular-nums` on `MetricValue` and every amount column.
- **This is currently a no-op under Söhne**, which has no `tnum` table and no GSUB features in the
  test cut. The digits still align because they are set in one weight at one size in a right-aligned
  column, not because the feature resolved. Do not read the CSS as proof that it did. The retail cut
  restores the feature; until then, do not rely on `tnum` for anything that mixes weights or sizes.
- No other features on by default. The test cuts have none to enable.

## Subset

- Character set actually present in the Klim test cuts: `U+0020`, `U+002C-002E`, `U+0030-0039`,
  `U+0041-005A`, `U+0061-007A`, `U+0100-0101`. 68 characters, no punctuation beyond comma, hyphen
  and period, no currency, no accents.
- The declared `unicode-range` on both Klim faces is the standard Latin block, which is wider than
  the cmap on purpose: the browser picks per character, so anything the cut lacks falls through to
  the next family in the stack rather than suppressing the download.
- `vite/plugins/glyph-contract.test.ts` already bans the interpunct, bullet, em dash, en dash,
  ellipsis and arrow from the tracked surface, which removes the most visible half of the gap
  before it can ship.

## Fallback stack

- `--font-sans: "Test Söhne", "Inter Variable", "Test Söhne Fallback", sans-serif`
- `--font-serif: "Test Newzald", "Test Newzald Fallback", "Bitstream Charter", "Sitka Text", "Iowan Old Style", Georgia, "Times New Roman", serif`
- Overrides computed with `font_metrics.py --fallback-for`, in `src/styles/theme-tokens.css`:

  | Alias | local() | size-adjust | ascent | descent | line-gap |
  |---|---|---|---|---|---|
  | Test Söhne Fallback | Arial | 100.27% | 116.79% | 42.19% | 0% |
  | Test Newzald Fallback | Georgia | 88.38% | 109.53% | 30.78% | 0% |

  Caveat on both `size-adjust` values: the test cuts lack most of the punctuation in Capsize's
  width sample, so the tool fell back to `xAvgCharWidth`. The vertical overrides are exact.

## Loading

- Self-hosted WOFF2. Söhne and Newzald are vendored into `src/fonts/` (gitignored, licence);
  Inter comes from `@fontsource-variable/inter` and is declared by hand in
  `src/styles/inter-font.css` so the subsets and `font-display` stay ours.
- `font-display: optional` on every face, so a slow link never swaps mid-read.
- Preloaded in `vite/plugins/preload-fonts.ts`: Söhne Buch, Inter latin, Newzald Book. Söhne
  Kräftig and Halbfett, Newzald Bold and both italics, and Inter latin-ext stay lazy.
- Budget: 26.9 KB Söhne (three cuts) + 47.1 KB Inter latin + 41.0 KB Newzald (four cuts) =
  115.0 KB of woff2, of which 66.3 KB is on the first-paint path. Under the 150 KB serving
  contract. `pnpm size` after this change: 108.33 KB of 115 KB JS, 14.9 KB of 16 KB CSS.
- Non-web targets: none.

## Proof

Built for this decision against the local Klim pack, not read off specimen pages. The pages are
not committed, because they embed the licensed woff2; what they showed is the record:

- **Five Klim sans against Newzald across five surfaces**: 13px chrome with a 19px heading, the
  12px posting table with a parenthesised negative and the `1I0l-O0` ambiguity row, a sans heading
  over a Newzald paragraph, the Newzald wordmark beside sans nav, and hard strings at 44px.
  Söhne and National 2 held the table; Calibre and Karbon read a size smaller at the same px;
  Founders Grotesk Text was the loosest fit against the prose.
- **The ambiguity set at 52px** (`1 l I i j 0 O o 8B 5S 2Z`). Söhne, Calibre and Founders Grotesk
  Text draw `l` and `I` as identical stems. National 2 and Karbon give `l` a tail. This is the one
  place Söhne loses on merit, and it is recorded above as an accepted cost.
- **The coverage seam**, `Per Contra (2026): 12.5% / $0.00` set three ways: Söhne then Inter
  (shipped), Inter alone, and Söhne then system sans. The parentheses, colon, percent and slash
  come from Inter in the shipped stack and are indistinguishable; against the system sans they are
  visibly a second face. That column is the argument for the coverage layer.

Strings were real product copy: `Chalbury Co-Invest L.P.`, `Reconciliation batch B-0117`,
`(18,437.52)`, `A sign-off workbench for fund migrations: every posting carries its source rows`.

To rebuild the pages, point `@font-face` `src` urls at the Klim pack and set the same strings at
the same sizes; the proof is the strings and the sizes, not the file.
