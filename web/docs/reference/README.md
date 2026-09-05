# Reference

Current facts a fork reads at a different time than the code is being edited: system shape, env contract, toolchain values, deploy and incident procedures.

This is **shared** (architecture is the map CLAUDE.md points at; env is the contract `src/env.ts` documents against), **stable** (the Worker layout does not change when a route is added), and wanted **when wiring or forking**, not when editing a component.

## What is not here

| the fact                                | its home            |
| --------------------------------------- | ------------------- |
| why a decision was made                 | `docs/adr/`         |
| a dated pass or investigation           | `docs/synthesis/`   |
| design brief, glossary, component specs | `docs/frontend/`    |
| what is still open in this template     | `docs/TODO.md`      |
| agent-facing operational rules          | `.claude/CLAUDE.md` |

## The files

| file                                           | covers                                                           | read by                             |
| ---------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------- |
| [architecture.md](./architecture.md)           | Layer model, bootstrap, routing, build pipeline, testing pyramid | CLAUDE.md, README, `vite.config.ts` |
| [tooling.md](./tooling.md)                     | oxfmt/oxlint policy, Node pin, pnpm supply chain, editor setup   | CLAUDE.md, README, ADR 023, ADR 025 |
| [env.md](./env.md)                             | Every env var; no `.env.example` by design                       | `src/env.ts`                        |
| [deploy-checklist.md](./deploy-checklist.md)   | Per-deploy checks; CSP recipe (ADR 034)                          | CLAUDE.md, template-gaps            |
| [incident-response.md](./incident-response.md) | Severity, comms, postmortem                                      | CLAUDE.md, ADR 004                  |
| [detach-cloudflare.md](./detach-cloudflare.md) | Exit ramp for static, Tauri, or Node forks                       | README, ADR 035                     |
