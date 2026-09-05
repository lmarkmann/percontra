# ADR 013: Gate production on CI and aggregate home bytes

**Status:** Accepted
**Date:** 2026-07-11

## Context

The deploy workflow ran in parallel with CI, so a failing commit could reach production. The entry size budget measured only `main-*.js`, while the home boot graph spans many shared chunks. A new shared chunk could therefore avoid the budget entirely.

## Decision

Deploy only from a successful `ci` workflow run and check out its exact commit. Budget the complete client JavaScript glob, then exclude the same deferred chunk prefixes used by the modulepreload filter. Keep separate budgets for showcase and motion chunks.

Worker observability is enabled because server errors return request IDs intended for log correlation. Session responses use `Cache-Control: no-store`, and mutation provenance must match the request origin whether supplied by `Origin` or `Referer`.

## Consequences

A red main commit cannot deploy. New shared chunks fail closed into the home budget unless they are deliberately classified as deferred in both places. Request IDs now correspond to persisted Worker logs.
