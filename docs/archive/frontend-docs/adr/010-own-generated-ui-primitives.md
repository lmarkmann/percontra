# ADR 010: Own generated UI primitives after import

**Status:** Accepted
**Date:** 2026-07-11

## Context

The shadcn CLI supplies a useful starting point, but refreshing generated files can overwrite pointer gating, motion timing, shadow tokens, and explicit transition property lists. Commit `557c608` did this after the craft pass in `6064fce`.

## Decision

Files under `src/components/ui/` are project-owned after import. Do not refresh a primitive over local edits without reviewing its full diff. Controls use fine-pointer hover variants, motion tokens, and explicit transition property lists. `frontend-contract.test.ts` rejects `transition-all` anywhere in the primitive source tree.

## Consequences

Upstream component updates require a deliberate merge instead of replacement. The additional review cost is small and prevents a generator refresh from silently reversing the interaction doctrine.
