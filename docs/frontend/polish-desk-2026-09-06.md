# Polish pass: migration desk, 2026-09-06

Surface: the migration desk at `/`, dataset 02 loaded, Kestrel Westvale selected with its mapping gap open.

Captures: `docs/frontend/proof/desk-2026-09-06-before.png`, `docs/frontend/proof/desk-2026-09-06-after.png` (2560 x full page, light theme, sidebar expanded). The before frame has Chalbury selected because no batch carried an approval yet; the after frame has Westvale selected after one approval and one later decision version, which is the state the pass exists to show.

## Why

The desk showed the product's mechanism, an approval bound to exact decision versions, as one grey word on a batch card. Everything a reviewer would need to understand a stale approval (which decision moved, from what to what, by whom, and what the approval was granted on) was in the overview payload and drawn nowhere. The three changes below draw it, using only tokens and components already in the tree.

## Before / After / Why

| Before | After | Why |
| --- | --- | --- |
| Batch card: `Not approved` or `stale` in grey or destructive text, nothing else | Same label, plus `BATCH 995747 / TURN 1` in the mono kicker when at least one approval exists | The fund manager's own metric is the count of review turns (`call-1-nav-workflow-review.md:100-111`); the card now carries it |
| Under the totals strip: the postings table started immediately | A `Signed against now` card: header `Signed by Luis, Sep 6, 2026, 10:46 AM` with the approved or stale `StatusMark`; a table with one row per bound decision, columns Decision / Signed / Now; the diverged row on the stale tint with the Now cell in the stale foreground; one prose sentence naming the move (`moved from v1 to v2 by Luis. This approval was granted on v1, so it is stale until someone signs again`) | This is the per contra entry the product is named for: the approval on one side, the batch as it is now on the other. When nothing diverged the Now column is not drawn and the sentence reads `Nothing has changed since Luis signed` |
| Decision editor: `Record decision v3` with no hint of consequence | A `role="note"` block above the button: `Recording v3 will stale: Kestrel Westvale Co-Invest LP (44 rows, signed by Luis)` in the stale foreground, then `Unaffected: ...` muted; or `No approval depends on this decision yet` | The reviewer sees the cost of a re-decision before doing the work, which is the turn the product saves |

No spacing literal, timing value, or color literal was added. Every class is an existing token utility (`text-status-stale-fg`, `bg-status-stale-tint` via `statusRowClass`, `text-label`, `text-caption`, `font-prose`).

## State ledger

| State | Rendered as | Verified |
| --- | --- | --- |
| No approval on the selected batch | No panel; card reads `Not approved`, no turn kicker | Chalbury in the after capture |
| Approved, nothing diverged | Panel with the Signed column only, `Nothing has changed since X signed` | unit test `a bound decision at its signed version reads as unchanged`; not captured live |
| Stale because a bound decision moved | Panel with Signed and Now, diverged row tinted, sentence names the versions | Westvale in the after capture |
| Stale for another reason (crosswalk upload changed the snapshot) | Panel with the Signed column, sentence carries `release.state_reason` | not captured; branch exists in `signed-vs-now.tsx` |
| Gap selected, no decision yet | `No approval depends on this decision yet` | unit test `an unresolved gap has no decision id, so nothing can go stale` |
| Gap selected, an approved batch binds it | `Recording vN will stale: ...` | unit test `recording a new version stales only approvals bound to that decision` |
| Gap selected, the bound batch is already stale | Reads `No approval depends on this decision yet` | Westvale in the after capture. Honest but blunt: the stale approval exists and cannot get staler. A follow-up could say `Westvale is already stale from v2` |

## Declined

- A stepper or state strip in the hero (`SOURCE / DECISION / RELEASE / RECEIPT`). Luis rejected the label as a product model; the panel above says the same thing with the batch's own data.
- Any animation on the panel appearing. It is content inside the review card, not a transition, and the motion rules keep chrome still.

## Checks

```sh
pnpm --dir web typecheck && pnpm --dir web lint && pnpm --dir web test:run   # 0 errors, 197 tests
just lint                                                                     # ruff, pyrefly, contract drift
uv run --directory api pytest -q tests/test_api_flow.py                       # turns == {gap: 2, clean: 1}
```

The lm-ui-polish proof checker at `~/Documents/.parked/Skills/frontend-skills/tools/proof/check_proof.py` was not run in this pass; the capture pair exists at the paths above with matching dimensions.
