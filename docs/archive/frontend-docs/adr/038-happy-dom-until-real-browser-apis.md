# ADR 038: happy-dom Until a Test Needs Real-Browser APIs

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

Vitest Browser Mode went stable in Vitest 4.0 (October 2025). The repo is past that line, and a review asked whether the component-test layer should swap happy-dom for Chromium. The suite covers four surfaces (`src/lib`, `src/hooks`, `server/`, `vite/plugins/`); only component tests touch a DOM. `server/` and `vite/plugins/` are Node code and cannot run in Chromium.

This is a different axis from ADR 020. A 700 ms product hold sleeps just as long in Chromium as in happy-dom; fake timers still apply.

## Decision

Keep happy-dom as the unit-test DOM. Do not convert the suite. When a test needs an API happy-dom cannot honestly cover (real scroll geometry and `IntersectionObserver` on the chat scroller, real IndexedDB, Base UI focus via CDP), add a Vitest `browser` project alongside the existing `node` project rather than replacing it.

The CLAUDE.md trigger remains "real-browser APIs," not "Browser Mode exists." Playwright stays the e2e runner in `e2e/`. Runtime-AI browsers (Stagehand, Midscene, Magnitude) are not a CI gate.

## Consequences

- Pre-push stays a Node plus happy-dom run. A Chromium project would add roughly 1 to 2 seconds of browser boot plus slower per-test overhead, felt first at the prek pre-push hook.
- Two workarounds (`pool: "forks"` against happy-dom teardown races, `fake-indexeddb`) stay until that browser project exists; they retire for free in Chromium.
- `src/test/setup.ts` does not fork. MSW stays `setupServer`. When the browser project appears, it will need `setupWorker` plus bypasses for font and favicon requests.

## Evidence

Browser Mode only replaces the DOM emulation layer. Split, do not swap. `vitest-browser-react` is younger than Browser Mode itself; RTL still works inside browser mode, so the runner can migrate later without rewriting assertions on day one.
