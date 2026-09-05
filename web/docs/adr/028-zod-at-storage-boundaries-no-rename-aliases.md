# ADR 028: Zod at Storage Boundaries, No Rename Aliases

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

A domain-boundary audit reviewed every place data crosses into the app without compiler guarantees: `src/contract/` schemas, Worker input/output, route search params, localStorage, and IndexedDB. The result was largely clean by construction: `api-client.ts` parses every response body through a caller-supplied zod schema, the demo session is `sessionSchema.safeParse'd out of localStorage, dashboard and login search params go through zod, and the Worker exposes only GET endpoints (no unvalidated request bodies). Two loose ends remained: the offline chat queue validated IndexedDB rows with a hand-rolled type guard that skipped the `attachment` shape entirely, and the audit prompt asked whether repeated structural types should be promoted to named aliases.

## Decision

Two rules, one acceptance and one decline:

1. **Storage boundaries get the same treatment as wire boundaries.** Data read back from IndexedDB or localStorage is untrusted input (other tabs, older builds, manual edits) exactly like a network response, and it is validated with a zod schema, not a hand-rolled `typeof` guard. The offline queue's guard is now `queuedChatSendSchema` with a `z.ZodType<QueuedChatSend>` annotation so the schema cannot drift from the type it claims to validate. Hand-rolled guards are reserved for hot paths where a measured zod cost matters; none exist here.
2. **No rename aliases.** The audit found no repeated structural types worth naming; per the review's own criterion, a named alias that merely renames a one-use inferred object is negative value (one more indirection to chase) and is declined as a class. A type earns a name when it is shared across modules or crosses a boundary, which is what `src/contract/` already does.

## Consequences

- The queue now rejects rows with a malformed `attachment`, which the old guard silently admitted; a corrupt row degrades to "not in the queue" instead of a runtime surprise in the chat UI.
- zod was already in the entry graph via `src/env.ts` / `site.ts`, so the import adds an edge, not a dependency, and no meaningful chunk weight.
- Future persistence seams (a settings store, a draft cache) have a precedent to copy: schema next to the type, `ZodType<T>` annotation, `safeParse` at the read.

## Alternatives Considered

### Keep the hand-rolled guard, extend it to check attachment

No new import. Rejected: it re-implements zod badly, and every future field is another chance for guard/type drift that the `ZodType<T>` annotation catches at compile time.

### Move the schema into `src/contract/`

Consistency with the wire schemas. Rejected: `src/contract/` is the client/Worker shared surface; the queue row never crosses the wire, so its schema belongs next to its type in `offline-queue.ts`.

## Validation

`pnpm vitest run src/lib/offline-queue.test.ts` passes; a row written with a malformed attachment is filtered out of `listChatQueue` instead of surfacing.
