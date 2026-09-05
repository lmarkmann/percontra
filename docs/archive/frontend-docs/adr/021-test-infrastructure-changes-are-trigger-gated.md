# ADR 021: Test Infrastructure Changes Are Trigger-Gated

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

A test-infrastructure review note ("CI test gates and test-runner architecture") collected everything test-related from the July 2026 review pass: the slow-test observation that led to ADR 020, the alternatives that ADR rejected, and the open question of moving component tests from happy-dom to Vitest Browser Mode. Each item was evaluated against the current suite (76 files, green in ~7s, gated by prek pre-push and CI).

The evaluation adopted nothing. This ADR records the rejections so they are not re-litigated, and pins the concrete triggers under which two deferred items get picked up, together with the exact changes to make when they fire. Future reviews should check the triggers, not reopen the verdicts.

## Decision

No test-infrastructure change is made now. The current gate stands: `slowTestThreshold` at its Vitest default, happy-dom as the component substrate, Playwright as the e2e runner, fake timers for simulated waits per ADR 020.

### Rejected outright

1. **Raise `slowTestThreshold`.** It would silence the only signal that caught the real 1.4s sleep in `chat-transport.test.ts` (ADR 020).
2. **Remove, shorten, or MODE-gate the production demo delays** (chat transport and login 700ms holds). The pending-state UX is the product; a test branch in shipped code makes the demo diverge from what its tests exercise (ADR 020).
3. **Shallow-render or over-mock the full-route suites** (login, router, showcase, main). Their 400-700ms is provider-tree breadth and real userEvent typing, which is the coverage (ADR 020).
4. **Runtime-AI QA frameworks** (Stagehand, Midscene, Magnitude) as any part of the CI gate. Non-deterministic, token-metered per run, and a template has no exploratory-QA surface to justify them as a side tool. They export to or wrap Playwright anyway.
5. **Migrating the whole suite to Vitest Browser Mode.** Only component tests touch a DOM; `server/` (Hono Worker) and `vite/plugins/` are Node code that cannot run in Chromium. If Browser Mode ever arrives, it arrives as a project split (below), never a wholesale swap.

### Deferred behind explicit triggers

**Vitest Browser Mode, node + browser project split.**
_Trigger:_ the first test that happy-dom cannot honestly cover, meaning real scroll geometry, `IntersectionObserver`, Base UI focus management, or `getBoundingClientRect`; the likeliest first site is the chat `message-scroller` (`src/components/ui/chat/message-scroller.tsx`). This is the same "real-browser APIs" trigger already in `.claude/CLAUDE.md`.
_Change when it fires:_

- Split the `test` block in `vite.config.ts` into Vitest projects: a `node` project for `src/lib`, non-DOM `src/hooks`, `server/`, and `vite/plugins/`; a `browser` project (Chromium via Playwright, already installed) for component tests. One runner, one coverage report.
- Fork `src/test/setup.ts`: the browser project moves MSW from `setupServer` to `setupWorker` plus the generated service worker, and `onUnhandledRequest: "error"` gains handlers or bypasses for real browser requests (fonts, favicon).
- Retire two workarounds whose reasons disappear: `pool: "forks"` (happy-dom teardown races) and the `fake-indexeddb` devDependency (Chromium has real IndexedDB).
- Accept the cost: roughly 1-2s of Chromium boot plus per-test overhead, felt first at the prek pre-push hook. That cost is why this waits for the trigger.
- Keep RTL assertions on day one; `vitest-browser-react` is younger than Browser Mode itself and can be evaluated separately.

**Revisit the slow-test gate.**
_Trigger:_ a full-route suite crossing roughly 1s per file for justified breadth, eroding the threshold's power to separate breadth from sleeps.
_Change when it fires:_ the answer is the Browser Mode split or a test-pyramid rebalance, not a threshold bump; raising `slowTestThreshold` stays rejected.

**Playwright Agents (planner, generator, healer).**
_Trigger:_ the next time a UI change breaks an e2e spec, try the healer on a fork.
_Change when it fires:_ none in this repo in advance. Output is plain `@playwright/test` we own; there is nothing to wire ahead of time, so this is a workflow note, not a dependency.

### Confirmed status quo (no action ever pending)

- `e2e/` stays as-is: route-per-spec Playwright, programmatic session seeding, workerd-real API tests. The note's "keep it" is a description of the current state, not an improvement.

## Consequences

- A future review comparing the template against Browser Mode, AI-QA tooling, or threshold tuning should land here first; if no trigger has fired, the verdicts stand without re-investigation.
- The Browser Mode migration plan is written down while it is fresh, so when the trigger fires the change is mechanical rather than a fresh design exercise.
- `pool: "forks"` and `fake-indexeddb` are now documented as workarounds with a known retirement path, not permanent fixtures.
- Nothing in this ADR touches ADR 020; simulated waits stay on fake timers regardless of substrate (a real 700ms hold sleeps just as long in Chromium as in happy-dom).

## Alternatives Considered

### Adopt the Browser Mode split now

Interaction fidelity would jump immediately and two workarounds would retire. Rejected: no current test needs a real browser, so today the split only buys a slower pre-push hook. The trigger-gated plan captures the whole benefit at the moment it first has a customer.

### Record the rejections only in the review note

No new ADR. Rejected: review notes are working files that get pruned; the ADR index is where a future agent looks before proposing the same changes again, which is exactly the re-litigation this record exists to prevent.

## Validation

`pnpm test` stays green with no configuration change. When the Browser Mode trigger fires, validation for the split is the migration checklist above plus the full suite green in both projects.
