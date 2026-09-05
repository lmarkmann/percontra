# ADR 016: Remove Expired Minimum Release Age Exceptions

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

pnpm 11 applies a default 24-hour minimum release age when resolving packages. When TypeScript 7.0.2 and the current Cloudflare toolchain releases were less than 24 hours old, pnpm persisted exact-version exceptions in `pnpm-workspace.yaml` so installation could continue.

TypeScript 7 distributes its native compiler through optional packages for each supported operating system and architecture. pnpm recorded the complete optional package family in the lockfile and therefore generated an exception for every platform package. These entries did not configure deployment targets. A local Apple Silicon installation materializes the Darwin ARM64 package, while Linux CI materializes its matching Linux package. Browsers and deployed Cloudflare Workers receive built JavaScript and do not execute the TypeScript compiler.

Exact-version release-age exceptions remain in configuration after the 24-hour waiting period has passed. At that point they no longer enable installation and instead create configuration noise that resembles a platform support matrix.

## Decision

Remove the `minimumReleaseAgeExclude` block after every listed version is older than pnpm's minimum release age. Keep pnpm's default release-age policy in effect and add future exceptions only when intentionally adopting a release before its waiting period expires.

Treat automatically generated exact-version exceptions as temporary. Review and remove them once the selected packages have aged past the policy rather than retaining them as permanent project configuration.

## Consequences

- `pnpm-workspace.yaml` no longer contains a misleading list of TypeScript platform packages.
- macOS ARM64 development and Linux CI continue to select their matching TypeScript native binary through optional dependency metadata and the shared lockfile.
- The browser bundle and Cloudflare Worker runtime remain unchanged because TypeScript is a development dependency.
- Future newly published dependencies may cause pnpm to add or request another exact-version exception. Such entries require a deliberate review and later cleanup.
- Removing an exception before its package reaches the minimum age can make a fresh resolution fail until the waiting period passes.

## Alternatives Considered

### Keep every generated exception

This avoids touching configuration but preserves exemptions that have already served their purpose and makes the list look like an intentional cross-platform support policy.

### Keep only the macOS ARM64 and Linux x64 exceptions

This incorrectly treats release-age exceptions as platform selection. pnpm and TypeScript already select the appropriate optional native package for the installation host.

### Exclude package names without exact versions

This would permanently bypass the release-age policy for future TypeScript and Cloudflare releases, weakening the supply-chain delay more than required.

## Validation

Run `pnpm install --frozen-lockfile`. Installation should succeed on the existing lockfile without restoring `minimumReleaseAgeExclude`. Run `pnpm exec tsc -b --noEmit` to confirm that the platform-specific TypeScript compiler remains available.
