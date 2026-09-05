# ADR 037: Template Scope, What This Starter Will Not Add

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

The 2026-07-10 template audit considered a pile of "obvious" additions from donor starters and the 2026 stack map. Several were decided elsewhere (Storybook ADR 003, Better Auth ADR 006, Renovate ADR 001, telemetry and CSP ADR 034, i18n ADR 032, Nitro ADR 035, SSR ADR 036). The leftovers below kept getting reopened as oversights. They are not.

## Decision

These stay out of the template until a product fork has the requirement that makes them earn a seat:

- **No tRPC.** REST plus a zod contract module. One serialization boundary, no client codegen coupling, portable to any HTTP consumer.
- **No database and no ORM.** WorkOS session verification is stateless JWKS. D1, Drizzle, or Postgres via Hyperdrive enter with the first real product table.
- **No monorepo** until a second deployable surface appears. The Worker is the same deployable (one wrangler config), so the trigger has not fired.
- **No react-hook-form** until a real product form. Login is two fields with zod plus a MutationPhase union.
- **No `@cloudflare/vitest-pool-workers`** until Worker logic grows real branching. Today the endpoints are covered by contract checks plus e2e. Adding it also means revisiting the `process.env.VITEST` guard on the Cloudflare plugin.
- **No prerender as a template feature.** Fork launch gate; see ADR 036.

Stripe, multi-tenancy, feature flags, and transactional email stay out by the same philosophy: the kriasoft donor's plugins for those were dropped on purpose.

## Consequences

- A future session that "notices" a missing database, tRPC router, or form library is looking at this record, not a gap.
- Reopening one of these is a new decision with new evidence, not a cleanup.

## Evidence

Each item was considered during the July 2026 audit and left out deliberately. Donor facts checked 2026-07-10: Better Auth 1.6.23 on Workers with D1 is real and still rejected (ADR 006); vite-react-ssg lacks file-based TanStack Router support.
