# Colour report

Every number here was produced by `calc.py`; the command that produced it is
printed above each table. A ratio quoted with no command line is a bug, not a
rounding risk (lm-color iron rule 8). Regenerate with the scripts noted at the
end after any change to `src/styles/theme-tokens.css`.

Measured 54 pairs. Failing: 0.
Outside the sRGB gamut: 0.

## The decision

The template arrived on Patina, which was already the direction the brief asks
for: warm paper at hue 80.7, a verdigris accent at hue 161 to 167. So the open
question was never warm against cool. It was three specific defects.

**The neutral ramp went achromatic where the product spends its pixels.**
Patina's `--gray-500` sat at chroma 0.001, and 600, 900 and 950 at exactly 0.
Those four steps carry the hairline rules and the whole of dark mode, so the
paper reading broke precisely where a ledger needs it. Every step now sits on
one hue, 87. Lightness is unchanged step for step, so the contrast
relationships Patina measured still hold; only chroma and hue moved. The one
exception is `--gray-500`, nudged from L 0.645 to 0.630 (see the boundary note
below).

**Four status roles for a six-status vocabulary.** The brief fixes six, and the
template shipped `destructive`, `success`, `warning`, `info`, none of which are
those six.

**The accent collided with its own semantics.** Verdigris at 162 is also what
`ready` and `approved` want to be. Two directions were rendered as complete
systems and the owner chose verdigris, so the collision is resolved by
placement instead of hue: `ready` carries no row tint at all. It is the
majority state, an audit paper marks the exception rather than the normal, and
leaving it plain means green belongs to `approved` alone.

## Ramps

Converted with:

```
uv run --script ~/Documents/.parked/Skills/frontend-skills/tools/color-themes/calc.py convert --to hex '<oklch>'
```

### Neutral, hue 87

| Token | OKLCH | sRGB |
| --- | --- | --- |
| `--gray-50` | `oklch(0.962 0.008 87.000)` | `#f5f2ec` |
| `--gray-100` | `oklch(0.928 0.010 87.000)` | `#eae7e0` |
| `--gray-200` | `oklch(0.864 0.010 87.000)` | `#d5d2cb` |
| `--gray-300` | `oklch(0.824 0.010 87.000)` | `#c8c5be` |
| `--gray-400` | `oklch(0.748 0.010 87.000)` | `#b0ada6` |
| `--gray-500` | `oklch(0.630 0.009 87.000)` | `#8b8983` |
| `--gray-600` | `oklch(0.517 0.009 87.000)` | `#6a6862` |
| `--gray-700` | `oklch(0.455 0.012 87.000)` | `#59564f` |
| `--gray-800` | `oklch(0.345 0.010 87.000)` | `#3b3933` |
| `--gray-900` | `oklch(0.252 0.008 87.000)` | `#24221e` |
| `--gray-950` | `oklch(0.218 0.007 87.000)` | `#1b1a16` |

### Accent, Patina verdigris, unchanged

| Token | OKLCH | sRGB |
| --- | --- | --- |
| `--brand-400` | `oklch(0.696 0.089 167.436)` | `#62af92` |
| `--brand-500` | `oklch(0.642 0.090 162.906)` | `#559e7d` |
| `--brand-600` | `oklch(0.601 0.081 163.407)` | `#4f9073` |
| `--brand-700` | `oklch(0.531 0.078 161.893)` | `#3e7a5e` |
| `--brand-800` | `oklch(0.462 0.066 161.913)` | `#33644d` |
| `--brand-900` | `oklch(0.376 0.052 160.647)` | `#264a38` |

## Status roles

Three per status. One value cannot do both jobs the product asks of it: a whole
row washed in the colour, and a 7px mark. At row-tint chroma the mark reads
grey; at mark chroma thirty rows read as a rainbow. `-fg` is the label, and
clears 4.5:1 on its own tint.

`ready` uses the plain surface as its tint, so the row is untinted. `exported`
is a deliberately hedged slate: its label already says the destination was not
checked, so a confident colour would overclaim.

### Light

| Status | mark | tint | fg |
| --- | --- | --- | --- |
| `ready` | `oklch(0.630 0.009 87.000)` | `oklch(0.962 0.008 87.000)` | `oklch(0.455 0.012 87.000)` |
| `needs-decision` | `oklch(0.600 0.118 82.000)` | `oklch(0.960 0.018 82.000)` | `oklch(0.430 0.085 82.000)` |
| `blocked` | `oklch(0.520 0.170 25.000)` | `oklch(0.958 0.016 25.000)` | `oklch(0.440 0.150 25.000)` |
| `stale` | `oklch(0.580 0.130 45.000)` | `oklch(0.958 0.018 45.000)` | `oklch(0.440 0.100 45.000)` |
| `approved` | `oklch(0.520 0.085 195.000)` | `oklch(0.960 0.012 195.000)` | `oklch(0.400 0.065 195.000)` |
| `exported` | `oklch(0.580 0.045 250.000)` | `oklch(0.958 0.010 250.000)` | `oklch(0.440 0.045 250.000)` |

### Dark

| Status | mark | tint | fg |
| --- | --- | --- | --- |
| `ready` | `oklch(0.630 0.009 87.000)` | `oklch(0.218 0.007 87.000)` | `oklch(0.630 0.009 87.000)` |
| `needs-decision` | `oklch(0.780 0.130 82.000)` | `oklch(0.283 0.024 82.000)` | `oklch(0.840 0.090 82.000)` |
| `blocked` | `oklch(0.680 0.160 25.000)` | `oklch(0.283 0.024 25.000)` | `oklch(0.780 0.110 25.000)` |
| `stale` | `oklch(0.740 0.130 45.000)` | `oklch(0.281 0.024 45.000)` | `oklch(0.820 0.100 45.000)` |
| `approved` | `oklch(0.720 0.090 195.000)` | `oklch(0.283 0.018 195.000)` | `oklch(0.820 0.070 195.000)` |
| `exported` | `oklch(0.700 0.050 250.000)` | `oklch(0.281 0.012 250.000)` | `oklch(0.800 0.045 250.000)` |

## Measured pairs

```
uv run --script ~/Documents/.parked/Skills/frontend-skills/tools/color-themes/calc.py contrast '<fg>' '<bg>'
```

### Shell

| Pair | WCAG 2 | Required | APCA | |
| --- | --- | --- | --- | --- |
| light: foreground on background | 10.33:1 | 4.5:1 | Lc 89.0 | pass |
| light: foreground on card | 9.33:1 | 4.5:1 | Lc 82.4 | pass |
| light: muted-foreground on background | 6.52:1 | 4.5:1 | Lc 77.7 | pass |
| light: hairline border on background | 1.35:1 | 1.0:1 | Lc 16.3 | pass |
| light: input boundary on background | 3.13:1 | 3.0:1 | Lc 55.0 | pass |
| dark: foreground on background | 14.07:1 | 4.5:1 | Lc -91.0 | pass |
| dark: foreground on card | 12.87:1 | 4.5:1 | Lc -89.9 | pass |
| dark: muted-foreground on background | 4.97:1 | 4.5:1 | Lc -37.8 | pass |
| dark: hairline border on background | 1.51:1 | 1.0:1 | Lc 0.0 | pass |
| dark: input boundary on background | 3.12:1 | 3.0:1 | Lc -22.5 | pass |

The hairline is listed at a 1:1 requirement on purpose. A decorative rule
carries no information and owes nothing under WCAG; Patina shipped it at
1.35:1 and that is unchanged. What does owe 3:1 is the *control* boundary, and
the template used one token for both. They are now separate: `--border` stays
`--gray-200`, `--input` moves to `--gray-500`, which is why that step needed
L 0.630 rather than Patina's 0.645. At 0.645 it measured 2.95:1 and missed.

### Accent

| Pair | WCAG 2 | Required | APCA | |
| --- | --- | --- | --- | --- |
| light/verdigris: primary-foreground on primary | 6.11:1 | 4.5:1 | Lc -80.1 | pass |
| light/verdigris: primary as text on background | 6.11:1 | 4.5:1 | Lc 75.9 | pass |
| dark/verdigris: primary-foreground on primary | 5.44:1 | 4.5:1 | Lc 43.3 | pass |
| dark/verdigris: primary as text on card | 4.98:1 | 4.5:1 | Lc -40.3 | pass |

The ink direction was measured alongside and is recorded here because it was a
real candidate: light 6.42:1, dark 4.73:1. It lost on continuity, not contrast.

### Status, light

| Pair | WCAG 2 | Required | APCA | |
| --- | --- | --- | --- | --- |
| light/ink: primary-foreground on primary | 6.42:1 | 4.5:1 | Lc -81.1 | pass |
| light/ink: primary as text on background | 6.42:1 | 4.5:1 | Lc 77.0 | pass |
| light/ready: text on its row tint | 6.52:1 | 4.5:1 | Lc 77.7 | pass |
| light/ready: mark on its row tint | 3.13:1 | 3.0:1 | Lc 55.0 | pass |
| light/ready: text on card | 5.89:1 | 4.5:1 | Lc 71.1 | pass |
| light/needs-decision: text on its row tint | 7.28:1 | 4.5:1 | Lc 80.1 | pass |
| light/needs-decision: mark on its row tint | 3.56:1 | 3.0:1 | Lc 59.1 | pass |
| light/needs-decision: text on card | 6.62:1 | 4.5:1 | Lc 74.0 | pass |
| light/blocked: text on its row tint | 7.39:1 | 4.5:1 | Lc 78.9 | pass |
| light/blocked: mark on its row tint | 5.29:1 | 3.0:1 | Lc 70.1 | pass |
| light/blocked: text on card | 6.79:1 | 4.5:1 | Lc 73.5 | pass |
| light/stale: text on its row tint | 7.13:1 | 4.5:1 | Lc 78.9 | pass |
| light/stale: mark on its row tint | 3.97:1 | 3.0:1 | Lc 62.2 | pass |
| light/stale: text on card | 6.55:1 | 4.5:1 | Lc 73.4 | pass |
| light/approved: text on its row tint | 7.98:1 | 4.5:1 | Lc 82.4 | pass |
| light/approved: mark on its row tint | 4.72:1 | 3.0:1 | Lc 68.1 | pass |
| light/approved: text on card | 7.22:1 | 4.5:1 | Lc 75.9 | pass |
| light/exported: text on its row tint | 6.85:1 | 4.5:1 | Lc 78.5 | pass |
| light/exported: mark on its row tint | 3.78:1 | 3.0:1 | Lc 61.2 | pass |
| light/exported: text on card | 6.26:1 | 4.5:1 | Lc 72.7 | pass |

### Status, dark

| Pair | WCAG 2 | Required | APCA | |
| --- | --- | --- | --- | --- |
| dark/ink: primary-foreground on primary | 5.17:1 | 4.5:1 | Lc 41.3 | pass |
| dark/ink: primary as text on card | 4.73:1 | 4.5:1 | Lc -38.3 | pass |
| dark/ready: text on its row tint | 4.97:1 | 4.5:1 | Lc -37.8 | pass |
| dark/ready: mark on its row tint | 4.97:1 | 3.0:1 | Lc -37.8 | pass |
| dark/ready: text on card | 4.55:1 | 4.5:1 | Lc -36.7 | pass |
| dark/needs-decision: text on its row tint | 8.81:1 | 4.5:1 | Lc -70.7 | pass |
| dark/needs-decision: mark on its row tint | 7.15:1 | 3.0:1 | Lc -59.5 | pass |
| dark/needs-decision: text on card | 9.69:1 | 4.5:1 | Lc -72.0 | pass |
| dark/blocked: text on its row tint | 6.97:1 | 4.5:1 | Lc -57.9 | pass |
| dark/blocked: mark on its row tint | 4.71:1 | 3.0:1 | Lc -40.8 | pass |
| dark/blocked: text on card | 7.60:1 | 4.5:1 | Lc -59.1 | pass |
| dark/stale: text on its row tint | 8.14:1 | 4.5:1 | Lc -65.8 | pass |
| dark/stale: mark on its row tint | 6.08:1 | 3.0:1 | Lc -51.3 | pass |
| dark/stale: text on card | 8.84:1 | 4.5:1 | Lc -67.0 | pass |
| dark/approved: text on its row tint | 8.45:1 | 4.5:1 | Lc -68.7 | pass |
| dark/approved: mark on its row tint | 6.01:1 | 3.0:1 | Lc -51.3 | pass |
| dark/approved: text on card | 9.37:1 | 4.5:1 | Lc -70.1 | pass |
| dark/exported: text on its row tint | 7.81:1 | 4.5:1 | Lc -63.8 | pass |
| dark/exported: mark on its row tint | 5.46:1 | 3.0:1 | Lc -46.5 | pass |
| dark/exported: text on card | 8.55:1 | 4.5:1 | Lc -65.0 | pass |

## Gamut

Checked with:

```
uv run --script ~/Documents/.parked/Skills/frontend-skills/tools/color-themes/calc.py gamut '<oklch>'
```

The first pass put four status colours outside sRGB, all at hues 82 and 195
where the gamut is narrow. `calc.py gamut` reported the ceiling at each
lightness and the chromas were clamped to it: `needs-decision` mark 0.130 to
0.118 and fg 0.090 to 0.085, `approved` mark 0.090 to 0.085 and fg 0.070 to
0.065. Nothing in the shipped palette is outside gamut now.

## The other two modes

`forced-colors: active` collapses every status onto `Canvas` and `CanvasText`,
which is why the brief's requirement that a status always carries a word and an
icon is load-bearing rather than decorative: under this mode they are all that
survives. `prefers-contrast: more` drops the row tints to `transparent` and
leaves the labels on the plain surface, where the `-fg` values already measure
6.58:1 or better. Raising the tint instead would push the row background toward
the text sitting on it.

Both layers are asserted by `e2e/contrast-modes.spec.ts`.

## Regenerating

The palette, the measurement run and the swatch gallery are three scripts in
`scripts/color/`. The palette is the only one to edit by hand; the other two
read it, so a value cannot disagree between the theme, this report and the
gallery.

```
cd scripts/color && python3 measure.py && python3 gallery.py
```

`measure.py` exits noisily on any pair below its required ratio or any colour
outside the sRGB gamut. See `scripts/color/README.md`.
