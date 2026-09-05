# ADR 007: Share TypeScript Compiler Options Across Runtime Configurations

**Status:** Superseded by [ADR 040](./040-two-typescript-projects-not-five.md)
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

The repository has four TypeScript projects with different runtime boundaries:

- `tsconfig.app.json` checks the React application with DOM and Vite client types.
- `tsconfig.node.json` checks Vite configuration code with Node types.
- `tsconfig.e2e.json` checks Playwright tests with DOM and Node types.
- `tsconfig.worker.json` checks the Cloudflare Worker without ambient DOM or Node types.

Each project repeated the same language target, module behavior, bundler resolution, strictness, no-emit setting, and compiler diagnostics. This duplication made a compiler-policy change easy to apply inconsistently. Combining every source set into one TypeScript project would remove the duplication, but it would also merge incompatible ambient types and allow code to use globals that are unavailable in its actual runtime.

## Decision

Add `tsconfig.base.json` for compiler options that are identical across all four projects. Each runtime configuration extends the base and continues to own the settings that define its environment and project boundary:

- `lib`
- `types`
- `include`
- `jsx`, where applicable
- `paths`, because their relative paths are resolved from the configuration that declares them
- `tsBuildInfoFile`, so each project retains a separate incremental-build cache

The root `tsconfig.json` remains the project-reference entry point used by `tsc -b`. Its previous `compilerOptions.paths` declaration is removed because the root includes no files and project references do not pass compiler options to their children. The application and Worker projects retain their own `paths` declarations, so alias resolution, type-checking behavior, and every child project's effective configuration remain unchanged. Repeated properties have only moved to a shared parent, and an ineffective root declaration has been deleted.

## Consequences

- Shared TypeScript policy now has one source of truth.
- Runtime-specific ambient types remain isolated, so browser, Node, test, and Worker code are checked against the environments where they execute.
- Adding a compiler option to the base affects every TypeScript project and therefore requires checking that it is valid for all four environments.
- A runtime-specific option must remain in its child configuration, even if moving it to the base appears to reduce more lines.
- The root project contains only `files` and `references`; compiler options belong in the shared base or the child project where they take effect.

## Alternatives Considered

### Keep the duplicated configurations

This preserves the runtime boundaries but leaves identical compiler policy in four files, creating avoidable drift.

### Use one TypeScript project for the entire repository

This produces fewer configuration files but merges DOM, Node, Vite, Playwright, and Worker ambient types. Type checking could then accept APIs that are unavailable in the target runtime, so the simpler file layout would weaken correctness.

## Validation

Run `pnpm exec tsc -b --noEmit`. TypeScript resolves each child configuration through `tsconfig.base.json` while retaining its own runtime types, included files, path aliases, JSX mode, and build-info file.
