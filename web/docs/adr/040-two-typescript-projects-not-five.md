# ADR 040: Two TypeScript Projects, Not Five

**Status:** Accepted
**Date:** 2026-08-31
**Deciders:** Luis Markmann

**Supersedes:** [ADR 007](./007-shared-typescript-compiler-options.md)

## Context

ADR 007 split the repository into four TypeScript projects behind a shared `tsconfig.base.json` and a reference-only root, so app, Node, e2e, and Worker code were each checked against the ambient types of the runtime they execute in. That is six files in the repository root for a single-app template, and four of them differed from each other only in `lib`, `types`, and `include`.

Three of those four boundaries turned out to be nominal. The app carries DOM plus `vite/client`, the Node project carries `@types/node`, and the e2e project carries both; nothing in `vite/`, `scripts/`, or `e2e/` breaks when the union is applied, because every one of those globals exists in the environment those files actually run in. Merging app, Node, and e2e into one project typechecks clean and changes no diagnostic.

The Worker boundary is not nominal. `worker-configuration.d.ts` (ADR 018) redeclares `Request`, `Response`, and `caches` as their workerd counterparts. Placed in the same program as `lib.dom`, the workerd declarations win and seven client tests stop compiling, because `Response` is no longer the DOM `Response`. Generating the file with `--include-runtime=false` avoids the collision but leaves `Fetcher` unresolved, and `skipLibCheck` hides that inside a declaration file: `Env["ASSETS"]` silently becomes an error type, which type-aware oxlint then reports as `no-unsafe-*` across `server/index.ts`. Neither variant is acceptable, so the Worker keeps its own program.

## Decision

Two configurations, and the second one is not in the root.

- `tsconfig.json` is a complete, self-contained project: every compiler option written out once, `include` covering `src`, `vite`, `scripts`, `e2e`, `vite.config.ts`, and `playwright.config.ts`. No `extends`, no `references`, no base file.
- `server/tsconfig.json` checks the Worker with `lib: ["ES2025"]`, `types: []`, and `../worker-configuration.d.ts`. It sits beside the code it configures, which keeps the root at one `tsconfig.json` and, more usefully, puts it where oxlint's per-file config discovery already looks: type-aware linting of `server/` resolves through it with no extra wiring. A root-level `tsconfig.worker.json` does not get discovered that way, and `server/` would lint as untyped.
- `target` and `lib` move from ES2023 to ES2025 in both.
- Neither project is composite, so they cannot be wired as a reference from a root that includes files of its own. `tsc -b` therefore names both: `tsc -b tsconfig.json server/tsconfig.json`, in the `build` and `typecheck` scripts and the `typerun` and `typewatch` recipes.

## Consequences

- Six root configuration files become one, plus one colocated with the Worker.
- The Worker boundary that ADR 007 was mainly protecting survives intact; the three that were carrying no weight are gone.
- Compiler policy is no longer inherited, so there is one place to change it for app code and one for the Worker. Two files can now drift where six could not. The `vite/plugins/` contract tests do not cover this, and nothing else does either; it is a review item, not a gate.
- The project list is written out in four commands rather than discovered from a `references` array. A third project, if one is ever needed, has to be added to each.
- ADR 018 still holds, but its file reference is stale: `worker-configuration.d.ts` now enters the program through `include` in `server/tsconfig.json`, not `tsconfig.worker.json`. ADR 029's citations of `tsconfig.base.json` read as `tsconfig.json`.

## Alternatives Considered

### Keep the ADR 007 layout

Correct, and the reason the Worker half of it survives here. It was paying for four boundaries and getting one.

### One project for everything, with hand-written Worker bindings

`server/auth.ts` declares its own `Bindings` type instead of `Pick<Env, ...>`, `worker-configuration.d.ts` leaves the tsc program, and the root holds exactly one config. It typechecks and lints clean. Rejected because a future KV, R2, or D1 binding would then be hand-typed against the wrangler runtime types rather than generated from `wrangler.jsonc`, which is the drift ADR 018 exists to prevent.

### Solution-style root plus two children

A root with `files: []` and a `references` array keeps `tsc -b` bare and single-sources the project list. It costs a third file for a directory whose file count is the reason for this ADR.

## Validation

Run `pnpm typecheck` and `pnpm exec oxlint`. Both projects compile clean, and oxlint reports zero findings across 222 files with type-aware rules active in `server/`.
