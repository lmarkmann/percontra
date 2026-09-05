# ADR 024: Justfile as Discovery Layer

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

Nearly every project in this workspace ships a `justfile`, making `just --list` the habitual way to discover a repo's real entry points. This template had none: its task surface lived only in `package.json#scripts`, which cannot carry per-command descriptions and offers no single "run the full gate" verb beyond knowing that `ci:local` exists. A maintenance review asked whether a justfile earns its keep in a single-toolchain pnpm project, given the drift risk of a second command surface.

## Decision

Add a thin `justfile` whose recipes are **pure one-line delegations to named pnpm scripts**. It is a discovery and muscle-memory layer, not a task runner in its own right:

- `package.json#scripts` stays the single source of truth for what commands do; the justfile never contains logic, flags, or command sequences of its own.
- Every recipe carries a doc comment so `just --list` (the default recipe) reads as self-describing documentation.
- `just verify` maps to `pnpm ci:local`, giving the full local CI gate a memorable name consistent with other projects in the workspace.
- Hook behavior stays in prek; CI keeps calling pnpm scripts directly. Nothing depends on `just` being installed.

## Consequences

- `just --list` works here like everywhere else in the workspace; the ecosystem convention holds.
- Drift is contained by the delegation rule: a script rename breaks the recipe loudly (command not found), and there is never a behavioral difference to reconcile because recipes have no behavior.
- A new script only needs a justfile recipe if it is a top-level entry point; internal scripts (`routes:gen`, `cf-typegen`) deliberately stay off the list.

## Alternatives Considered

### No justfile (pnpm scripts only)

Zero drift risk, one fewer file. Rejected: it makes this the one repo in the workspace where `just --list` fails, and pnpm scripts cannot self-document. The cost of the file is a few delegation lines; the discoverability is used daily.

### Justfile as the primary runner (logic in recipes)

Full `just` power (dependencies between recipes, arguments). Rejected: it would fork the source of truth; CI, prek, and documentation all speak pnpm scripts, and a recipe that diverges from its script is a silent lie.

## Validation

`just --list --unsorted` prints all recipes with descriptions; `just verify` runs the same gate as `pnpm ci:local`.
