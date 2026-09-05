# ADR 031: zod/mini in the Client

**Status:** Accepted
**Date:** 2026-07-13
**Deciders:** Luis Markmann

## Context

Classic zod's method-chaining API defeats tree-shaking (a bundler cannot prove which methods a
schema instance calls), so any runtime import of `"zod"` pulls the full classic surface, roughly
19 kB brotli, into whatever chunk graph reaches it. zod 4 ships `zod/mini` from the same package:
identical core validators behind a functional API (`z.optional(z.string())` instead of
`z.string().optional()`) that tree-shakes per call site, and it also pulls a much smaller slice of
the shared `zod/core` kernel. `@t3-oss/env-core` validates through the standard-schema interface,
so the env seam accepts either variant.

The first attempt swapped only `src/env.ts` (the one importer assumed to be on the home boot
graph) and kept classic zod "in the lazy chunks." Bundle analysis disproved the premise: TanStack
Router's file-based splitting splits only the route **component**; `validateSearch` schemas and
loader imports stay in the route tree, which the entry loads at boot. Through `login.tsx` and
`dashboard.tsx` route segments, `contract/*`, `session-api`, and `offline-queue`, classic zod rode
the entry graph anyway, and the partial swap merely added mini alongside it.

## Decision

All client-side runtime schema code uses `zod/mini`: `src/env.ts`, `src/contract/*`, route
`validateSearch` schemas, form validation, and storage-boundary parsing (`offline-queue`). The
"lazy boundary" is not a real seam for schemas in this router, so there is no classic-zod
territory in the client at all. `server/` consumes the shared contracts and therefore runs mini
too.

Classic `zod` remains a dependency for test files only (`api-client.test.ts`, `server/*.test.ts`
build ad-hoc schemas where ergonomics matter and bytes do not).

Mechanical mapping used across the port, for the next schema someone writes:

- `z.string().optional()` -> `z.optional(z.string())`
- `z.ZodType<T>` annotations -> `z.ZodMiniType<T>`
- `error instanceof z.ZodError` -> `error instanceof z.core.$ZodError` (base class of every zod
  error, both variants)
- `.min(1, msg).email(msg)` -> `.check(z.minLength(1, msg), z.regex(z.regexes.email, msg))`
- `.parse` / `.safeParse` are methods on mini schemas too; call sites do not change.

Seams stay variant-agnostic: `api-client.ts` types its schema parameter as a structural
`{ parse(data: unknown): T }` instead of a zod class, so classic, mini, or any parse-shaped
validator fits without touching the transport.

## Consequences

- Classic zod is absent from the client bundle; the zod footprint fell from ~127 kB to ~35 kB
  rendered (mini plus the core slice it actually uses), about 10.6 kB brotli off the home boot
  aggregate. The budget is tightened to lock the gain in (ADR 026).
- New client schemas follow the functional mini API. A runtime `from "zod"` import anywhere in
  `src/` is a regression; the size tripwire catches it via the re-tightened home budget.
- Test files keep the chainable API; they never enter a shipped chunk.

## Alternatives Considered

### Swap only `src/env.ts`, keep classic zod in "lazy" chunks

The original plan. Rejected by measurement: route-file schema code is not lazy under TanStack's
component-only splitting, so classic zod stayed on the entry path and the app shipped both
variants.

### Leave classic zod and raise the budget

No churn. Rejected: the full-client port is five small files, and ADR 026 forbids buying slack
instead of shedding weight.

## Validation

`ANALYZE=1 pnpm build`: no `zod/v4/classic/*` module appears in any client chunk. `pnpm size`
passes with the home aggregate at ~112 kB brotli under the tightened budget; `pnpm typecheck`,
`pnpm test`, and `pnpm knip` pass unchanged.
