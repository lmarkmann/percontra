# Synthesis

Dated records of work that read across the template: a slimming pass, a slow-network pass, a Fermi estimate. They explain how the current defaults were earned. They are not current state.

`docs/reference/architecture.md` is current. Accepted decisions live in `docs/adr/`. Do not treat a file here as a mandate to keep everything as-is.

## What is not here

| the fact                                    | its home                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| a decision that still constrains code       | `docs/adr/`                                                                                 |
| live system shape, env, toolchain, runbooks | `docs/reference/`                                                                           |
| design specs                                | `docs/frontend/`                                                                            |
| what is still open                          | `docs/TODO.md`                                                                              |
| session notes and review backlogs           | harvest into ADR / TODO, then delete; never promote `.claude/remembering/` into this folder |

## The files

| file                                                                           | covers                                                                                     |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| [slimming-reference.md](./slimming-reference.md)                               | July 2026 dependency audit and P0-P6 cleanup: what changed, why, when to reverse a default |
| [slow-network-performance.md](./slow-network-performance.md)                   | Ten slow-4G wins, plus Lighthouse budget calibration history                               |
| [fermi-ssr-loading-gain-2026-07-11.md](./fermi-ssr-loading-gain-2026-07-11.md) | Evidence packet for ADR 036: what full SSR would buy the end user                          |
