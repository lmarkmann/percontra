# ADR 020: Simulated Latency Stays Off the Test Clock

**Status:** Accepted
**Date:** 2026-07-11
**Clarified:** 2026-07-11 (reconciled with the test-infrastructure review note; see Clarification)
**Deciders:** Luis Markmann

## Context

Several demo seams simulate latency on purpose: the scripted chat transport holds replies for 700ms (`src/lib/chat-transport.ts`), the demo login holds sign-in for 700ms (`src/routes/login.tsx`), and the dashboard loader holds fixture data for 400ms in dev (`src/lib/dashboard-data.ts`). These delays exist so the pending states are real, not theoretical: the chat thinking marker, the submitting button, and the `?debug=1` skeletons all render against an actual wait. The first two ship to production because the demo experience is the product; the dashboard hold is dev-only scaffolding and already resolves to 0ms outside dev.

The first full CI run after the July 2026 overhaul marked several test files yellow, meaning they crossed Vitest's default `slowTestThreshold` of 300ms. Investigation split them into two groups. One file was paying simulated latency in wall-clock time: `src/lib/chat-transport.test.ts` awaited `sendChatMessage` for real twice, 1434ms of sleeping through the transport's own 700ms hold. Every other yellow entry was spending its time on genuine breadth: full-route renders through the real provider tree (login, showcase, router, main) and userEvent keystroke pipelines that fire the complete event sequence per character. The chat feature suite averages under 100ms per test because it mocks the transport module and never touches the delay.

## Decision

Simulated latency is product behavior and stays in source. Unit tests never wait on it in real time. Two mechanisms are sanctioned, chosen by the kind of delay:

- **Dev-only demo holds** are zeroed at the source under test and production modes, as `dashboard-data.ts` already does (`import.meta.env.DEV && import.meta.env.MODE !== "test" ? 400 : 0`).
- **Delays that ship to production** (chat transport, demo login) are fast-forwarded in the test file with `vi.useFakeTimers` plus `advanceTimersByTimeAsync`, or the module is mocked outright as `chat-feature.test.tsx` does. The product code stays unaware of tests.

Never delete or shorten a product delay to make a test green, and never add a `MODE === "test"` branch for a delay that is intentional in production; that inverts the responsibility and puts test plumbing in shipped code.

Yellow durations that come from full-route renders through real providers are accepted. Do not shallow-render or over-mock those suites to chase the threshold; their breadth is what they verify. `slowTestThreshold` stays at its default so it keeps flagging the one failure mode this ADR exists to catch: a new test sleeping through a simulated wait.

## Consequences

- `chat-transport.test.ts` drops from ~1.4s to single-digit milliseconds; the suite's slowest files are now the deliberate full-route renders.
- A future test that awaits a delayed seam for real will show up yellow again; the fix is fake timers in that test file, per this ADR, not a change to the seam.
- A demo success-path login test, if one is ever added, must fast-forward the 700ms the same way.
- The threshold stays meaningful as a signal because justified slowness sits well under a second per file while a real sleep multiplies per test.

## Alternatives Considered

### MODE-gate the chat and login delays like dashboard-data

One-line change per seam and no fake timers. Rejected because those delays are intentional in production; a test-mode branch would put test awareness into shipped code and make the demo behave differently from what its tests exercise.

### Remove or shorten the delays

Fastest tests possible. Rejected because the pending-state UX is the point of the demo seams; without the wait, the thinking marker and submitting states never appear.

### Raise `slowTestThreshold`

Silences the yellow marks without touching anything. Rejected because it hides exactly the regression class this decision guards against: the threshold flagged a real 1.4s of sleeping and should keep doing so.

## Validation

Run `pnpm vitest run src/lib/chat-transport.test.ts`. All three tests pass with the tests segment in the low milliseconds, well under the 300ms threshold. The full suite stays green with the remaining yellow files unchanged.

## Clarification (2026-07-11)

A follow-up review compared this ADR against a test-infrastructure improvement note ("CI test gates and test-runner architecture") and read the two as conflicting. They do not; the note's recommendations and this decision are the same position.

- The note asks to leave the CI gate alone and investigate per-test durations instead of changing thresholds. That is what this ADR did: `slowTestThreshold` stays at its default, and the only change was fake timers in `chat-transport.test.ts`, the one file genuinely sleeping through a simulated wait. No product code and no CI configuration were touched.
- The Alternatives Considered above (raise the threshold, shorten the delays, MODE-gate them, shallow-render the route suites) are rejections, not proposals. Reading that section as the decision inverts the ADR; an argument against those four options is an argument for this ADR, not against it.
- Vitest Browser Mode (component tests in Chromium instead of happy-dom) is a separate axis and does not reopen this decision. A real 700ms hold sleeps just as long in Chromium as in happy-dom; fake timers or module mocks apply on any substrate. Adopting Browser Mode later (a node + browser project split, on the existing CLAUDE.md "real-browser APIs" trigger) changes where component tests run, not how simulated latency is treated.

Scope note for future readers: this ADR governs one thing, how tests treat intentional simulated waits. Proposals about the test substrate, the e2e layer, or the test-pyramid split are outside its scope and neither conflict with nor amend it.
