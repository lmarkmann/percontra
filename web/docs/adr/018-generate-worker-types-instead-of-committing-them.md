# ADR 018: Generate Worker Types Instead of Committing Them

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

Cloudflare generates Worker runtime and `Env` types from the project's own configuration: the correct types depend on the compatibility date, compatibility flags, bindings, and module rules declared in `wrangler.jsonc`. Their TypeScript guidance recommends `wrangler types` over the `@cloudflare/workers-types` package for applications, and then offers two ways to keep CI honest: commit the generated `worker-configuration.d.ts` (optionally verified with `wrangler types --check`), or regenerate it before any command that relies on TypeScript.

The generated file is large, changes with every wrangler release because runtime types ship inside the CLI, and contains nothing hand-written. Wrangler also prints a reminder on every command when it considers the file stale relative to `wrangler.jsonc`, which surfaces as recurring noise in CI logs if the generation step is missing or misplaced.

## Decision

Types are generated, never committed. `pnpm cf-typegen` runs `wrangler types --strict-vars=false`, writing `worker-configuration.d.ts` to the repo root, and that file is gitignored. Both `pnpm typecheck` and `pnpm build` invoke `cf-typegen` as their first step, so every local check, every CI run, and every deploy build type-checks against types freshly derived from the current `wrangler.jsonc`. This is Cloudflare's sanctioned regenerate-before-CI path; the `--check` flag is unnecessary because there is no committed copy to drift.

Two settings depart from the stock documentation example:

- `--strict-vars=false` types `vars` as `string` rather than freezing each var to its literal value. The committed `WORKOS_CLIENT_ID` is an empty placeholder overridden by `.dev.vars` locally and by real configuration in production, so the literal type `""` would be wrong everywhere the value matters.
- The generated file enters the program through `include` in `tsconfig.worker.json` rather than the `compilerOptions.types` array. The effect is identical for a declaration file, and the placement is deliberate: only the Worker project sees workerd globals, so application, Node, and test code cannot use runtime APIs their environments lack (the boundary established in ADR 007).

## Consequences

- CI and builds are always type-checked against types matching the exact configuration being shipped; there is no committed copy to go stale.
- Wrangler version bumps never produce a large generated-file diff in review.
- After any change to `wrangler.jsonc` (vars, bindings, compatibility date or flags), `pnpm cf-typegen` must be rerun by hand for the editor to see fresh types; until the next `typecheck` or `build`, the on-disk file is stale and wrangler reminds about it on every command.
- A fresh clone has no `worker-configuration.d.ts` until the first `typecheck` or `build`; editors report missing Worker types until then.
- If a var must carry a literal or union type someday, that var has outgrown `--strict-vars=false` and the flag choice should be revisited.

## Alternatives Considered

### Commit the generated file, optionally with `wrangler types --check` in CI

Cloudflare's primary recommendation. Rejected because our scripts regenerate before every TypeScript task anyway, so a committed copy adds no correctness and costs review churn: every wrangler upgrade rewrites thousands of generated lines, and the `--check` step exists only to police drift this setup cannot have.

### Use the `@cloudflare/workers-types` package

Rejected for application code: the package types a generic latest runtime, not this Worker's compatibility date, flags, and bindings, and it provides no `Env` type at all. It remains the right tool for libraries targeting the Workers environment, which this repository is not.

## Validation

Run `pnpm cf-typegen && pnpm typecheck`; the Worker project compiles against the freshly generated types. `git status --porcelain` stays clean afterwards, confirming the generated file is untracked.
