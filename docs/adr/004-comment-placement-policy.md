# ADR 004: Comment Placement Policy

**Status:** Accepted
**Date:** 2026-07-13
**Deciders:** Luis Markmann

## Context

ADR 001 settled comment form: stacked `//` for implementation notes, JSDoc only on exported API,
comments must add information beyond names and types. It did not settle placement: several config
files had grown paragraph-length narratives (the `wrangler.jsonc` deploy-architecture block, the
`vite.config.ts` Cloudflare-plugin essay, the `lighthouserc.cjs` threshold-calibration history),
each duplicating content that also lives in `docs/reference/architecture.md` or CLAUDE.md. Duplicated
rationale drifts: the copy nobody edits becomes wrong silently.

## Decision

Placement follows one rule: a comment stays adjacent to code only if removing it would invite a
concrete regression at that spot; everything else lives in a record.

- **Stays adjacent:** short notes that stop the next editor from breaking something non-obvious,
  such as ordering constraints (`tanstackRouter()` before `react()`), format traps (LHCI
  `chromeFlags` must be a string), environment quirks (happy-dom lacks `matchMedia`), and security
  invariants (`aud` not enforced and why).
- **Moves to a record:** cross-cutting design rationale, rejected alternatives, provenance and
  attribution narratives, and volatile thresholds with their calibration history. Destination is
  an ADR for decisions, `docs/reference/architecture.md` for system shape, or the matching focused doc
  (perf history to `docs/synthesis/slow-network-performance.md`). The code keeps a one-line pointer.

Canonical applications in this repo: the `lighthouserc.cjs` FCP/LCP calibration history (volatile
threshold; moved to the perf record) and the `wrangler.jsonc` assets/SPA/`run_worker_first` block
(cross-cutting; `docs/reference/architecture.md` owns it, the config keeps the one local trap).

## Consequences

- Config files read as configuration plus traps, not as documentation mirrors; the single copy of
  each rationale lives where it is maintained.
- A reviewer can flag any multi-paragraph comment in a config or source file as a policy
  violation without judging its content.
- The pointer line is mandatory when content moves; a bare deletion loses the trail.

## Alternatives Considered

### Keep rich comments adjacent, treat docs as the duplicate

Locality is genuinely valuable. Rejected: the duplication is the problem, and CLAUDE.md plus
`docs/reference/architecture.md` already assume the record role; making code the source of truth would
require deleting those instead.

### Enforce by lint (max comment length)

Mechanical enforcement. Rejected: length is a proxy, not the criterion; a six-line security
invariant belongs adjacent while a two-line history note does not.

## Validation

After the accompanying sweep: no calibration narrative in `lighthouserc.cjs`, no architecture
paragraph in `wrangler.jsonc` or `vite.config.ts`, pointers in place, and every kept comment
answers "what breaks if this is ignored".
