# Token audit - vite-template

Date: 2026-07-09. Skill: **ui-foundation** (tokens + type). Scope: `src/styles/theme-tokens.css`, faces, call sites

## Inventory

| Category   | Present | Layer                                                                                      |
| ---------- | ------- | ------------------------------------------------------------------------------------------ |
| Color      | Yes     | Semantic OKLCH (shadcn + status + surface-tinted) over Patina ramps; see `color-report.md` |
| Spacing    | Yes     | 8pt primitives `--space-xs` to `4xl`; chat component spacing stays local                   |
| Type       | Yes     | Inter UI/heading; Charter prose (`--font-prose`); mono system stack                        |
| Type scale | Yes     | label 12 / caption 14 / body 16 / title 24 / display fluid clamp                           |
| Tracking   | Yes     | `--tracking-display` / `title` / `label`                                                   |
| Radii      | Yes     | `--radius` + derived + concentric helpers                                                  |
| Shadows    | Yes     | border, elevated, floating (dark redesigned with ring layers)                              |
| Motion     | Yes     | `--motion-*` + ease; owned by motion skill values                                          |
| Z-index    | Yes     | base, raised, sticky, dropdown, modal, toast, tooltip                                      |

## Findings resolved this pass

| Severity | Category | Finding                                           | Resolution                                                                             |
| -------- | -------- | ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| High     | Type     | `font-prose` used without a loaded face           | Restored Bitstream Charter woff2 + `charter-font.css`; `--font-serif` / `--font-prose` |
| Medium   | Type     | Uppercase kickers used `tracking-wide`            | `tracking-label` (0.06em)                                                              |
| Medium   | Type     | Display used generic `tracking-tight`             | Base `.text-display` uses `--tracking-display` (-0.04em)                               |
| Medium   | Type     | Code block one-off rem sizes (0.68 / 0.72 / 0.84) | `text-label` / `text-caption` + space tokens                                           |
| Medium   | Z-index  | Tooltip and skip-link used raw `z-50`             | `z-tooltip` / `z-toast`                                                                |
| Low      | Spacing  | No 8pt primitive scale                            | `--space-*` added (additive)                                                           |
| Low      | Z-index  | Incomplete stack                                  | `z-base`, `z-raised`, `z-sticky`, `z-tooltip`                                          |

## Still intentionally deferred

| Severity | Category | Finding                                               |
| -------- | -------- | ----------------------------------------------------- |
| Low      | Color    | Full primitive gray/accent ramps (`--gray-50` and up) | Semantic stack is enough for current component count               |
| Low      | Type     | Intermediate 18 / 20 / 30 sizes                       | UI-first five-step scale; add when a third hierarchy level appears |
| Low      | Motion   | Product-zone character switches                       | Opt-in when a clone productizes dense admin UI                     |

## Dark mode intentional check

- Primary lightens and keeps chroma; not inverted neutrals only.
- Shadow-border and elevated use light rings on dark surfaces.
- Status colors re-tuned L, not hue-flipped.

## Related

- Brief principle 2: Inter interface, Charter prose.
- Slimming note (2026-07-03) removed Charter for velocity; foundation re-adds it as **prose-only**, not for all headings.
