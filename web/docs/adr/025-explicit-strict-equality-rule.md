# ADR 025: Explicit Strict Equality Rule

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

The oxlint config enables the `correctness` and `suspicious` categories as errors, but `eqeqeq` (require `===`/`!==` over `==`/`!=`) lives in oxlint's `pedantic` category, which is off wholesale (ADR context in `docs/reference/tooling.md`: pedantic drags in noise like `prefer-readonly-parameter-types`). Loose equality was therefore unlinted by accident, not by decision. A scan of all handwritten source (the generated route tree is already ignored) found exactly two loose comparisons, both the deliberate nullish idiom: `session == null` in `src/lib/session.ts` and `snapPoints != null` in `src/components/ui/drawer.tsx`.

## Decision

Opt in to the single rule explicitly rather than enabling its category:

```json
"eqeqeq": ["error", "always", { "null": "ignore" }]
```

`null: ignore` keeps `== null` / `!= null` legal as the idiomatic "null or undefined" check, which is the one loose comparison with well-defined, intended semantics. Everything else must be strict. The pedantic category stays off; single-rule opt-ins are the sanctioned way to pull a rule out of a disabled category.

## Consequences

- Zero code changes at adoption time; the rule exists to keep future forks honest, not to fix current code.
- The two existing `== null` sites stay as they are; converting them to `=== null || === undefined` pairs would be strictly worse (longer and easier to get wrong).
- Anyone tempted by `value == "1"`-style coercion in a fork gets an error with an autofix suggestion instead of a silent type-coercion bug.

## Alternatives Considered

### Rely on the current categories

No config change. Rejected: leaving a correctness-adjacent rule to accident means a fork can introduce coercion bugs that nothing flags; the audit only proved the _current_ tree is clean.

### Enable the pedantic category

Covers eqeqeq plus more. Rejected: pedantic as a whole was already evaluated and turned off for noise; re-litigating that for one rule is backwards.

### `eqeqeq` in `smart` mode

Also allows loose comparisons between same-type literals. Rejected: `always` + `null: ignore` is stricter and captures the only idiom worth keeping.

## Validation

`pnpm exec oxlint` passes with zero eqeqeq findings on the current tree; temporarily changing a `===` to `==` in a component produces an error.
