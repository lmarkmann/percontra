# Color: vite-template

2026-08-31. Accent: `oklch(0.462 0.066 161.913)` light, `oklch(0.642 0.09 162.906)` dark. Space: OKLCH. Themes: light, dark.

The color way is [Patina](https://github.com/lmarkmann/patina-theme), the editor theme this project's author publishes. Light is **Patina Stellar**'s ground carrying **Patina Light**'s ink and accents; dark is **Patina Dark Soft**. Values are read from `palette/*.toml` in that repo, never hand-transcribed. Decision and rationale: ADR 041.

## Why the previous accent was replaced

`--primary` was `oklch(0.42 0.1 55)` (`#753b07`). At L 0.42 the sRGB gamut caps chroma at **0.104** for hue 55, so the ramp already used 96% of what exists there; hue 55 peaks in chroma near L 0.75, so a dark anchor lands where orange reads as brown. The hue and the anchor lightness disagreed, and no retune reconciles them.

```fish
uv run --script ~/Documents/.parked/Skills/frontend-skills/tools/color-themes/calc.py \
  gamut 'oklch(0.42 0.4 55)'
#   max chroma 0.104 at L 0.42, H 55
```

## Changes

| Before                                      | After                                | Role or placement                                                                  |
| ------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------- |
| `oklch(1 0 0)`                              | `oklch(0.962 0.007 80.721)`          | `--background` light, Patina Stellar ground                                        |
| `oklch(0.145 0.008 55)`                     | `oklch(0.218 0 89.876)`              | `--background` dark, Patina Dark Soft ground                                       |
| `oklch(0.145 0 0)`                          | `oklch(0.345 0.01 114.619)`          | `--foreground` light, Patina ink                                                   |
| `oklch(0.97 0.01 55)`                       | `oklch(0.82 0.017 91.58)`            | `--foreground` dark, Patina Dark Soft ink                                          |
| `oklch(0.42 0.1 55)`                        | `oklch(0.462 0.066 161.913)`         | `--primary` light, Patina Light accent                                             |
| `oklch(0.72 0.09 55)`                       | `oklch(0.642 0.09 162.906)`          | `--primary` dark, Patina Dark Soft accent_hover                                    |
| `bg-primary/80`                             | `--primary-hover`                    | primary hover; the alpha fade **lowered** contrast on hover, 6.11:1 to 3.96:1      |
| `oklch(0.68 0.14 75)`                       | `oklch(0.51 0.092 95.545)`           | `--warning` light; **was 2.70:1 on `bg-muted`**, failing body, large, and non-text |
| `oklch(0.577 0.245 27.325)`                 | `oklch(0.486 0.147 24.404)`          | `--destructive` light; **was 4.36:1 on `bg-muted`**, failing body text             |
| 11-step `--accent-*` at `var(--accent-hue)` | 6-step `--brand-*`, literal          | ramp; also ends the `--accent` / `--accent-500` name collision                     |
| 11-step invented `--gray-*`                 | 11-step Patina ground scale          | neutral ramp                                                                       |
| 8 `--sidebar-*`, 5 `--chart-*`              | deleted                              | no sidebar and no chart exist; `shadcn add sidebar` re-adds them                   |
| `#e11d48`                                   | `#3e7a5e`                            | `public/favicon.svg`; the rose contradicted every other color in the repo          |
| `#ffffff` / `#1c1b18` in 4 files            | `#f5f2ed` / `#1a1a1a`, test-enforced | browser-chrome surface; see Open                                                   |

Three lightness nudges were needed and no more. Patina is tuned for an editor, where an elevated surface rarely sits behind body text; this template puts `bg-card` everywhere, so each status token was solved against `--card` rather than `--background`.

| Role                      | Patina L | Ships at | Why                                                                                                  |
| ------------------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------- |
| light `--warning`         | 0.520    | 0.510    | 4.46:1 on `--card` at Patina's value                                                                 |
| dark `--primary`          | 0.601    | 0.642    | Dark Soft's accent is 4.22:1 on `--card`; 0.642 is its own accent_hover, the next value Patina ships |
| dark `--destructive`      | 0.629    | 0.650    | 4.18:1 on `--card` at Patina's value                                                                 |
| dark `--muted-foreground` | 0.628    | 0.645    | 4.50:1 sits exactly on the bar; budgets are tripwires, not headroom                                  |

## Semantic roles

| Role                                                   | Light                    | Dark                                |
| ------------------------------------------------------ | ------------------------ | ----------------------------------- |
| `--background`                                         | `--gray-50` `#f5f2ed`    | `--gray-950` `#1a1a1a`              |
| `--card`, `--muted`, `--secondary`, `--accent`         | `--gray-100` `#eae7e0`   | `--gray-900` `#222222`              |
| `--foreground`                                         | `--gray-800` `#393a34`   | `oklch(0.82 0.017 91.58)` `#c8c4b8` |
| `--muted-foreground`                                   | `--gray-700` `#58574e`   | `--gray-500`                        |
| `--primary`, `--ring`                                  | `--brand-800` `#33644d`  | `--brand-500` `#559e7d`             |
| `--primary-hover`                                      | `--brand-900` `#264a38`  | `--brand-400` `#62af92`             |
| `--primary-foreground`                                 | `--gray-50`              | `--gray-950`                        |
| `--border`, `--input`                                  | `--gray-200` `#d5d2cb`   | `#333333` / `#3d3d3d`               |
| `--destructive` / `--success` / `--warning` / `--info` | Patina Light status hues | Patina Dark Soft status hues        |

The verdigris ramp is not generated. Every step is the `accent` or `accent_hover` of a shipped Patina variant, so the scale is the theme's own rather than an even interpolation through colors Patina never had: 900 Light `dim_green`, 800 Light `accent`, 700 Stellar `accent`, 600 Dark Soft `accent`, 500 Dark Soft `accent_hover`, 400 Moss `accent_hover`.

## Contrast

Generated, not typed. The bare `check` pairs every `*-foreground` against `--background`, which is not what the components render, so each real pair is passed explicitly:

```fish
uv run --script ~/Documents/.parked/Skills/frontend-skills/tools/color-themes/calc.py \
  check src/styles/theme-tokens.css --pair=--warning-foreground=--warning
```

| Foreground on background              | Light   | Dark   | Verdict |
| ------------------------------------- | ------- | ------ | ------- |
| foreground on background              | 10.30:1 | 9.97:1 | AAA     |
| foreground on card                    | 9.30:1  | 9.12:1 | AAA     |
| muted-foreground on background        | 6.51:1  | 5.27:1 | AA      |
| muted-foreground on card              | 5.88:1  | 4.82:1 | AA      |
| primary on background                 | 6.11:1  | 5.44:1 | AA      |
| primary on card                       | 5.52:1  | 4.98:1 | AA      |
| primary-foreground on primary         | 6.11:1  | 5.44:1 | AA      |
| primary-foreground on primary-hover   | 8.88:1  | 6.69:1 | AAA/AA  |
| secondary-foreground on secondary     | 9.30:1  | 9.12:1 | AAA     |
| accent-foreground on accent           | 9.30:1  | 9.12:1 | AAA     |
| destructive on card                   | 5.56:1  | 4.55:1 | AA      |
| destructive-foreground on destructive | 6.16:1  | 4.97:1 | AA      |
| success on card                       | 7.07:1  | 6.59:1 | AAA/AA  |
| success-foreground on success         | 7.82:1  | 7.20:1 | AAA     |
| warning on card                       | 4.64:1  | 8.69:1 | AA/AAA  |
| warning-foreground on warning         | 5.14:1  | 9.51:1 | AA/AAA  |
| info on card                          | 5.51:1  | 5.93:1 | AA      |
| info-foreground on info               | 6.10:1  | 6.48:1 | AA      |

Every text pair clears AA in both themes. WCAG 2 is the verdict column; no pair needed APCA as a tiebreak.

Non-text boundaries. WCAG 1.4.11 binds a boundary only where it carries meaning, which is why the decorative hairline is listed and not treated as a failure:

| Boundary on background | Light  | Dark   | Verdict                          |
| ---------------------- | ------ | ------ | -------------------------------- |
| ring on background     | 6.11:1 | 5.44:1 | passes 3:1                       |
| border on background   | 1.35:1 | 1.38:1 | decorative, not meaning-carrying |

## Color vision

Verdigris carries the accent and olive carries success, so the two greens were checked rather than assumed apart.

```fish
uv run --script ~/Documents/.parked/Skills/frontend-skills/tools/color-themes/calc.py \
  cvd accent=#33644d success=#2f5418 warning=#846f22 error=#a23333 info=#35616d
```

Under both protanopia and deuteranopia, in both themes, all pairs stay above the 0.02 just-noticeable difference. Status also carries a dot plus a text label in `status-pill.tsx`, so color is not the sole signal regardless.

## Accent density

The busiest viewport is `/dashboard`. Accent placements: one `text-primary` inline link, one `bg-surface-tinted` panel, plus the focus ring when a control is focused. Three, against the 3 to 5 rule. `/`, `/showcase`, and `/login` carry no route-level primary of their own at all; their accent arrives through `<Button>`.

## Forced colors

Emulated with Playwright (`page.emulateMedia({ forcedColors: "active" })`), Chromium, 2026-08-31. Pinned by `e2e/contrast-modes.spec.ts`, so this is a gate and not a one-off observation.

```fish
pnpm exec playwright test e2e/contrast-modes.spec.ts --project=chromium
```

The mode drops `box-shadow` outright, measured rather than assumed: `getComputedStyle().boxShadow` reads `none` on every element probed. Two roles rode on it and both lost their geometry with it.

| What                    | Before                                                                                                                                                                                                    | After                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Focus ring              | `focus-ring` is `ring-3`, a box-shadow, and buttons also set `outline-none`. Computed `boxShadow: none`, `outlineStyle: none`. **Focus was completely invisible.**                                        | `outline: 3px solid Highlight`, offset 2px                                               |
| Card and panel boundary | `shadow-border` is a `0 0 0 1px` box-shadow. Computed `boxShadow: none`, `border-width: 0px`, and `bg-card` collapses to `Canvas` like the page. **Surfaces were indistinguishable from the background.** | `outline: 1px solid ButtonBorder` on `shadow-border`, `-hover`, `-elevated`, `-floating` |
| Status dots             | `bg-success` and `bg-warning` computed to the canvas color: white on white, gone.                                                                                                                         | `forced-color-adjust: none` via a `status-dot` utility on `StatusPill` and `Avatar`      |

`outline` rather than `border` for the boundary, because outline survives the mode and adds no layout box. Semantic roles collapse onto the system keywords in `theme-tokens.css`; the surface hierarchy flattens by design, since the OS expresses hierarchy with its own two colors and simulating depth on top of that produces mud. `GrayText` is deliberately unused: it means disabled, and applying it to merely de-emphasized text tells a screen reader user the control is dead.

Opting the dots out is only legal because every consumer pairs the dot with a text label, so color is not the sole signal.

## Prefers-contrast: more

Also shipped, also pinned by `e2e/contrast-modes.spec.ts`. Targets are 7:1 body text and 3:1 non-text, one step up from AA. The palette survives; only the roles move.

| Role                        | Default      | More         | Measured                           |
| --------------------------- | ------------ | ------------ | ---------------------------------- |
| light `--muted-foreground`  | `--gray-700` | `--gray-800` | 5.88:1 to **9.30:1** on card       |
| light `--border`, `--input` | `--gray-200` | `--gray-600` | 1.35:1 to **4.99:1** on background |
| dark `--muted-foreground`   | `--gray-500` | `--gray-400` | 4.82:1 to **7.10:1** on card       |
| dark `--border`, `--input`  | `#333333`    | `--gray-600` | 1.38:1 to **3.12:1** on background |

In light, `--gray-800` is also `--foreground`, so de-emphasis collapses. The ramp has no step between, and collapsing a quieter tier is the correct reading of a request for more contrast, the same logic that removes a subtle-border tier in this mode.

The accent is deliberately not raised. Reaching 7:1 would push `--primary` to `--brand-900`, which is the ramp's dark end, leaving `--primary-hover` with no darker step; hover would stop signalling, and an invisible hover is the worse failure. `prefers-contrast: less` is not implemented: no major platform surfaces a control that sets it.

## Open

- **`calc.py check --strict` exits 1 on this repo and always has.** All 20 failures are `X-foreground on background`: five roles, doubled by the `--color-*` re-export aliases and again by the `background` / `color-background` aliases. Under shadcn's naming convention `--primary-foreground` is by definition the ink that sits _on_ `--primary`, never on `--background`, so the checker's inference is backwards for every one of them. Verified against the pre-Patina palette, which fails identically with the same 20 rows, so this is not a regression from this pass. The real pairs are measured explicitly in the table above; the bare `--strict` run is not a usable gate for a shadcn token set.
- `--surface-tinted` and `--surface-tinted-hover` use relative color syntax (`oklch(from var(--primary) ...)`), which `calc.py check` cannot resolve, so both are unmeasured. They are decorative tints behind `--foreground`, not a text pair on their own.
- `public/favicon.svg`, `public/og-image.svg`, and `public/icons.svg` keep raw hex. SVG `fill` cannot read the stylesheet's custom properties when the file loads as a favicon or an OG image, so these are a genuine constraint. `icons.svg` is third-party brand marks and must stay literal in any case.
- `#f5f2ed` / `#1a1a1a` still appear as hex in `index.html` (a `content` attribute), its boot script, and `theme-provider.tsx`. None of the three can be a CSS variable. The fix is a test, not a token: `vite/plugins/theme-fallback.test.ts` now converts `--background` to hex and asserts all three copies against it.
- The proof gate's tier-3 hex grep flags `src/styles/utilities.css` (four `#000` stops inside `mask-image` gradients, where the value is an alpha stop and not a color) and the three browser-chrome hexes above. Both are false positives for the rule as written; `references/proof.md` says to add such files to `forbidden-exempt` rather than argue with the regex, which is a change to the skill and was not made unprompted.
- The favicon is a bare rounded square with no glyph. Recoloring it was in scope; designing a mark is fork work, per `.claude/rules/bootstrap-new-project.md`.
