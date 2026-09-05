# ADR 026: Size Budgets Are Tripwires, Not Headroom

**Status:** Accepted (a decline)
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

The `showcase-*.js` chunk sits at roughly 97% of its 52 kB size-limit budget. A review asked whether to raise the budget pre-emptively (avoiding a surprise CI failure on some future unrelated PR) or leave it and accept CI as the tripwire.

## Decision

No pre-emptive raises, here or for any other budget. A size-limit budget is a tripwire whose value is _when_ it fires: at the exact commit that adds the weight, in front of the author who added it, forcing the one-line justification that the CLAUDE.md policy already requires for any budget change. Raising a budget while under it moves the alarm away from the future culprit and converts the budget from a decision-forcing mechanism into a rolling allowance.

When the showcase budget trips, the PR that trips it either sheds the weight or raises the budget with its reason. Both outcomes are correct; deciding between them is precisely the work the tripwire exists to force.

## Consequences

- Some future showcase PR will fail CI on size and its author must stop and decide. That interruption is the feature, not the cost.
- Budgets keep their meaning as a record: every raise in git history is attached to the change that needed it.
- The 97% figure needs no action today and no monitoring ritual; CI is the monitor.

## Alternatives Considered

### Raise to 56-60 kB now with a "headroom" note

No surprise CI failures for a while. Rejected: the raise would carry no real justification (nothing needed the bytes), and the next actual regression would land silently inside the new slack, unattributed.

### Shrink the showcase now to restore margin

Proactive and virtuous-sounding. Rejected: the showcase is a demo surface already lazy-loaded off the home path; spending effort to optimize it below a budget that nothing is currently violating is work without a trigger.

## Validation

`pnpm build && pnpm size` passes today; the budget line in `package.json#size-limit` is unchanged.
