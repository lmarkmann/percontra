# PerContra UI brief

## Product in one sentence
A sign-off workbench for the fund accountant receiving a migration: every posting shows where it came from, which decisions it depends on, and whether it may leave; a changed decision makes the approvals that relied on it expire.

## User
One primary user: a fund accountant at a GP or administrator. Non-technical, spreadsheet-native, distrustful of black boxes, reads numbers all day. A non-technical fund manager must be able to understand the outcome from the labels alone. Judging criterion, verbatim: "Clean and considered. A non-technical fund manager is the user. No AI slop."

## Register
Trustworthy, precise, quiet, dry. The reference objects are an audit working paper and a well-set ledger, not a fintech dashboard. Nothing animates for decoration. No gradients, no glassmorphism, no chat surface, no graph visualisation. Density is medium: a reviewer sees 20 to 40 rows without scrolling on a 14-inch laptop.

## Surfaces (v1, in build order)
1. Migration overview: files ingested, entity scope (52 of 79), counts by status, decisions required. One number dominates: postings protected from approved export.
2. Review queue: grouped by accounting question; affected entities, row count, gross amounts by currency. Opens the decision drawer.
3. Decision drawer: source account and type in conflict; target treatment chosen from the destination chart; author, reason, affected rows; approve creates an immutable version.
4. Release check: previous vs current treatment, changed amounts by currency, which approvals are now stale; export withheld while stale.
5. Amount evidence drawer: opened by clicking any amount; contributing source rows, mapping versions, decision history, current approval, superseded versions shown as such.

## Status vocabulary (fixed; text and icon always accompany colour)
ready · needs decision · blocked · stale · approved · exported (destination not checked)

## Colour direction constraints
Neutral-dominant (90 percent or more), warm rather than cold: paper, not steel. One accent for interactive emphasis. Semantic colours only for the six statuses above, and they must remain distinguishable without colour. Pastel-leaning tints for row backgrounds; full-chroma only on small marks. WCAG 2 AA on every text and control pair, light and dark designed separately. Offer at least one warm and one cool direction and render swatches for review before adopting; the owner decides by looking, with directional adjustment ("a bit darker", "less green").

## Typography constraints
Amounts in tabular figures, right-aligned, decimal-aligned per currency column. Body in the template's Inter; if a serif is used it is reserved for the product name and section titles, not for numbers. No display fonts.

## Non-goals this weekend
Mobile layout, onboarding, marketing pages, mapping editor for existing crosswalks, animated lineage graphs, AI-written explanations.

## Deadline
Submission Sunday 12:00. Video recorded from this UI by 10:30. Anything not on a v1 surface is out.
