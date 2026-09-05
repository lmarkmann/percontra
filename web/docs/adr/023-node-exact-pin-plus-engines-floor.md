# ADR 023: Node Exact Pin Plus Engines Floor

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

The repo carries two Node version declarations: `.node-version` (`24.18.0`, read by fnm on cd and by CI) and `engines.node` in `package.json` (`>=24.18.0`). A maintenance review asked whether to keep this split, collapse it into a single moving LTS selector (such as `lts/*` or `24`), and what the update cadence should be. Until now the policy existed only implicitly in the file contents.

## Decision

Keep both values, with distinct meanings:

- `.node-version` is the **exact tested runtime**. It answers "what did CI and local dev actually run". It moves forward deliberately, never by resolution at install time.
- `engines.node` is the **compatibility floor**. It answers "what is known too old". It only moves when code or a dependency actually requires a newer runtime, not in lockstep with the pin.

Cadence: bump `.node-version` to the newest 24.x LTS patch as part of routine dependency-bump commits (the same commits that move Vite, Vitest, and friends), so the runtime and the dependency set are always tested together. Evaluate the next LTS major once it reaches Active LTS status, not on release day. Document lives in `docs/reference/tooling.md` ("Node version policy").

## Consequences

- A fresh clone gets a reproducible runtime (fnm reads the exact pin); a fork on a newer 24.x patch is not rejected by `engines`.
- The two values will legitimately drift apart (pin exact, floor older). That drift is the design, not a bug; do not "fix" it by equalizing them.
- Runtime bumps stay reviewable: they appear as a one-line diff in a dependency commit instead of happening silently on whatever machine resolves `lts/*` next.

## Alternatives Considered

### Moving selector (`lts/*` or `24`) in `.node-version`

Zero-maintenance and always current. Rejected: the runtime would change under CI and contributors without a commit, so a Node patch regression becomes invisible in `git bisect` and "works here, fails there" returns.

### Pin `engines` to the exact version too

Maximum strictness. Rejected: it turns every harmless patch difference on a fork into an install failure, for no correctness gain; the exact pin already covers reproducibility where it matters (CI, fnm users).

## Validation

`fnm use` resolves `24.18.0` from the pin; `pnpm install` succeeds on any 24.x at or above the floor and fails below it.
