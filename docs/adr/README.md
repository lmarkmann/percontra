# Architecture decision records

A decision that constrains future code lives here, once.

## What belongs here, and what does not

| the fact | its home |
| --- | --- |
| a decision that constrains future code | **here** |
| how the system is shaped and how a request flows | [`docs/reference/architecture.md`](../reference/architecture.md) |
| every environment variable | [`docs/reference/env.md`](../reference/env.md) |
| operating the Cloudflare Access gate | [`docs/access-gate.md`](../access-gate.md) |
| what a posting is and what makes one releasable | [`docs/posting-contract.md`](../posting-contract.md) |
| design brief, type spec, color report | [`docs/frontend/`](../frontend/) |

A new ADR is owed when a choice would be expensive to reverse and a future
reader would otherwise re-litigate it. Not for a knob, not for a bug, not for a
runbook.

## Numbering

`NNN-kebab-title.md`, from 001. Context, Decision (present tense),
Consequences, Evidence. Keep it under about fifty lines.

Six of these came from `lmarkmann/vite-template` and carried its numbering.
On 2026-09-06 the template's other 35 ADRs were dropped, because they recorded
decisions about a Hono Worker, WorkOS, a showcase route and a chat feature that
Per Contra does not have, and the survivors were renumbered into the contiguous
sequence below. **That was the one reset.** Designators are stable from here:
never renumber or reuse one. Supersede by writing a new file that marks both,
never by editing an old one into agreement.

## The record

| ADR | Decision | Origin |
| --- | --- | --- |
| [001](./001-mdn-and-google-style-guide-adoption.md) | MDN and Google style guide adoption | template |
| [002](./002-ship-only-audited-referenced-primitives.md) | Ship only audited, referenced UI primitives | template |
| [003](./003-zod-mini-on-the-entry-path.md) | `zod/mini` on the client entry path | template |
| [004](./004-comment-placement-policy.md) | Comment placement policy | template |
| [005](./005-static-shell-not-ssr.md) | Static shell, not SSR, for first paint | template |
| [006](./006-patina-color-way.md) | Patina as the color way | template |
| [007](./007-wordmark-serif.md) | The wordmark serif | Per Contra |
| [008](./008-cloudflare-access-instead-of-basic-auth.md) | Cloudflare Access instead of basic auth | Per Contra |
| [009](./009-desk-rail-and-brand-lockup.md) | The desk rail and the brand lockup | Per Contra |
