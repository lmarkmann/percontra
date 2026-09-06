# Spatial spec: migration desk, 2026-09-06

Archetype: **dense-app**. The desk is a ledger: three batch cards, a postings table, a decision editor, a sign-off strip. Surfaces are scanned, not read, and the shadcn default radius chain (10px base, 14px on the outer cards) read as consumer-app rounding on a page whose content is monospace amounts and status marks.

Captures: `docs/frontend/proof/spatial-desk-2026-09-06-before.png`, `docs/frontend/proof/spatial-desk-2026-09-06-after.png`. Same page state (Westvale selected, its gap open, sidebar expanded, light theme). The before frame is the polish pass's after frame, which is the last render before this pass edited anything. Heights differ by 60px because the tighter corners changed nothing in flow; the difference comes from the batch card kicker gaining `/ TURN 1` between the two captures.

## Token diff

Every step is now chosen on its own in `web/src/styles/theme-tokens.css`, per the dense-app template, instead of multiplied from one base.

| Token | Before | After | Where it lands |
| --- | --- | --- | --- |
| `--radius` | 0.625rem (10px) | 0.375rem (6px) | the card step; `inner-*` and `capped-*` still derive from it |
| `--radius-sm` | 6px (0.6x) | 2px | tooltip, tags |
| `--radius-md` | 8px (0.8x) | 4px | inputs, sidebar menu buttons |
| `--radius-lg` | 10px (1x) | 6px | buttons, nested cards, the gap cards in the aside |
| `--radius-xl` | 14px (1.4x) | 8px | the four step sections and the three batch cards |
| `--radius-2xl` | 18px (1.8x) | 12px | sheets |
| `--radius-3xl`, `--radius-4xl` | 22px, 26px | 16px, 20px | unused on the desk; kept so the scale stays monotonic |

No spacing, shadow, or z-index token changed value.

## Other changes

| File | Before | After | Why |
| --- | --- | --- | --- |
| `web/src/features/migration/migration-desk.tsx` | four `sticky top-0 z-10` table headers | `z-raised` | the raw number was the unnamed layer; the header only needs to sit above its own rows |
| `web/src/components/ui/tooltip.tsx` | `rounded-[2px]` | `rounded-sm` | the new scale has the 2px step, so the bracket is gone |

## Deviations kept

- `web/src/features/migration/desk-sidebar.tsx` keeps `size-2.5!` on the completed-step check. It fights the sidebar primitive's `[&_svg]:size-4` descendant rule; the honest fix is a size variant on the primitive, which is a shadcn file and out of this pass.
- The remaining scanner errors are all inside `web/src/components/ui/` (sidebar, sheet, input-group, dialog, chord): shadcn-owned geometry with calc-from-token widths and vendor `z-50`. They are not the desk's and are left for a primitive pass.

## Scanner

```sh
uv run --script ~/.claude/skills/lm-ui-spatial/scripts/spatial_scan.py web
```

| | Hits | Error level |
| --- | --- | --- |
| Before | 58 | 26 |
| After | 53 | 21 |

The five removed are the four `z-10` in the desk and the tooltip bracket.

## Rendered surface

The after capture, batch row: 8px corners on the three batch cards and the review section, 6px on the gap cards nested inside the aside, 6px on every button. The concentric pair (8 outer, 6 inner at 20px padding) reads as two surfaces, which is what the nesting ladder in the skill's presets predicts at that padding.
