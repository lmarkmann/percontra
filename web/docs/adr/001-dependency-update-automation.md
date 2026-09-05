# ADR 001: Dependency Update Automation Tooling

**Status:** Accepted (config not shipped)
**Date:** 2026-07-03
**Updated:** 2026-07-11
**Deciders:** Luis Markmann

## Context

This repo needs an automated way to keep npm dependencies current instead of manual `pnpm update` passes. The candidates are Renovate (Mend-hosted app, self-hosted, or via Mend's config engine) and GitHub-native Dependabot. The repo is GitHub-only (no GitLab/Bitbucket need), currently a single app (not yet the `apps/web` + `packages/*` monorepo shape described elsewhere in this file, but that promotion is a documented future step), solo-maintained, and has a full CI check suite (`ci.yml`: oxfmt, oxlint, tsc, knip, audit, vitest, build, size-limit, Playwright e2e) gating every PR.

The open question wasn't "does automation help" - it clearly does - but which tool, and how to install it without over-committing to a third party.

## Decision

When dependency automation is wanted, use Renovate via the **Mend-hosted GitHub App, installed with repository access scoped to this repo only** ("Only select repositories", not org/account-wide). The template does **not** ship `renovate.json` inertly: add the config file when the app is actually installed on the repo.

Recommended `renovate.json` shape when re-adding:

- Patch-level updates (excluding pre-1.0 packages, where SemVer patch can still break) are grouped into one weekly PR and automerged once CI is green.
- Minor updates are grouped into a separate PR, not automerged - still worth a skim.
- Major updates stay individual (default `config:recommended` behavior) and get a changelog read.
- `platformAutomerge` is explicitly `false`: `main` has no branch protection or required status checks configured, and GitHub's native auto-merge only waits on checks marked _required_ by branch protection - without that, native auto-merge would merge a PR immediately rather than waiting for CI. Setting it to `false` makes Renovate poll the CI check itself before merging, which works regardless of branch protection.

## Options Considered

### Option A: Dependabot (GitHub-native)

| Dimension         | Assessment                                 |
| ----------------- | ------------------------------------------ |
| Setup             | Zero - built into every GitHub repo        |
| Complexity        | Low; `dependabot.yml`, ~30 ecosystems      |
| Vendor dependency | None (first-party GitHub feature)          |
| Fit for this repo | Weak on the exact grouping this repo wants |

**Pros:** no app to install, no third party, tightest integration with GitHub Security Advisories, MIT-licensed.
**Cons:** does not group updates across directories in a monorepo (relevant once this repo promotes to `apps/web` + `packages/*`); as of Feb 2026 has an open, unresolved upstream bug (dependabot-core#14202) where a group scoped to `update-types: [minor, patch]` silently suppresses the separate major-version PR entirely, rather than opening it individually - exactly the patch/minor/major split this repo wants.

### Option B: Renovate, self-hosted via GitHub Actions

| Dimension         | Assessment                                                                           |
| ----------------- | ------------------------------------------------------------------------------------ |
| Setup             | Higher - own PAT or GitHub App, token rotation, `renovatebot/github-action` workflow |
| Complexity        | Medium-high                                                                          |
| Vendor dependency | None (runs on your own Actions runners)                                              |
| Fit for this repo | Full Renovate feature set, no Mend involvement                                       |

**Pros:** removes Mend from the picture entirely; full control.
**Cons:** trades vendor lock-in for maintenance lock-in - owning token rotation, the workflow file, and the Renovate action version. Worth it running Renovate across many private org repos; disproportionate for one personally-maintained template repo.

### Option C: Renovate, Mend-hosted app scoped to this repo (chosen)

| Dimension         | Assessment                                                           |
| ----------------- | -------------------------------------------------------------------- |
| Setup             | Low - one GitHub OAuth install, scoped to one repo                   |
| Complexity        | Low; same `renovate.json` as any Renovate install                    |
| Vendor dependency | Mend's hosted infra, but reversible                                  |
| Fit for this repo | Best - grouping, scheduling, and monorepo support all work correctly |

**Pros:** full Renovate config power (90+ ecosystems, shareable presets, precise grouping, monorepo-aware updates) with near-zero setup. Per-repo scoping means the install is reversible with one click; the entire config is portable JSON already committed to the repo, not trapped in a vendor dashboard. Mend's docs state they clone source only transiently per job and don't retain it.
**Cons:** does depend on Mend's infrastructure staying up and the free tier staying free. For a personal template repo with no compliance requirements, that risk is low-severity and low-probability, and it's cheaply reversible (uninstall the app, keep `renovate.json`, switch to Dependabot or self-hosting if it ever stops being free).

## Trade-off Analysis

The real axis isn't "Renovate vs Dependabot" in the abstract - it's how much lock-in the _installation method_ creates versus how much configurability the repo actually needs. Dependabot has no lock-in but currently can't correctly express this repo's patch/minor/major split (open upstream bug) and won't group monorepo packages once this repo promotes. Self-hosted Renovate has no vendor lock-in but replaces it with ongoing operational ownership disproportionate to a one-repo, one-maintainer project. The Mend-hosted app scoped to a single repository sits at the actual optimum for this repo's size: full configurability, near-zero setup, and a lock-in whose entire cost is "uninstall the app," because the config was never vendor-proprietary to begin with.

## Consequences

- **Easier:** patch-level bumps land unattended once CI passes; minor/major bumps still surface for review; dependency staleness stays low without manual `pnpm update` runs; the monorepo promotion path (see the "Single app by default" rule) will keep working without a tooling change.
- **Harder:** automerge timing depends on Renovate's own polling cadence rather than an instant GitHub-native merge, since there's no branch protection driving the native queue.
- **Revisit:** if branch protection with required status checks is ever added to `main`, flip `platformAutomerge` back to `true` for faster merges. If this repo is ever managed as part of a multi-repo org, reconsider self-hosting once there's more than one repo's worth of Renovate traffic to justify the operational cost.

## Caveat: vitest is pinned twice; a bump must move both

`vitest` is pinned in two places that must move in lockstep: the exact version in `package.json` and a hard `overrides.vitest` entry in `pnpm-workspace.yaml` (there to keep a single test runner so no transitive dep splits test state). The override wins tree-wide, so editing the `package.json` range alone does nothing - `pnpm install` leaves vitest where the override pins it. Because `@vitest/coverage-v8` is _not_ overridden, it moves on its own, and you get a transient coverage-v8/vitest peer mismatch until the override is bumped too (observed bumping 4.1.9 -> 4.1.10 on 2026-07-11; package.json edit did nothing, coverage-v8 advanced alone, and only editing the override then reinstalling brought vitest to 4.1.10 and cleared the peer warning).

Consequence for automation: Renovate updates manifest ranges and the lockfile but does not touch the `overrides` block, so an unattended vitest bump lands half-applied. Either keep vitest on the manual-update path, or add a Renovate rule that also rewrites `pnpm-workspace.yaml`'s `overrides.vitest` (a regex manager or `packageRules` group) so the override and the manifest never drift.

## Action Items

1. [ ] When automation is needed: install the Mend Renovate GitHub App scoped to `Only select repositories` -> this repo only, and commit `renovate.json` with the shape above.
2. [ ] If branch protection with required checks is added to `main` later, set `platformAutomerge: true` in that config.
3. [ ] If vitest is ever put on the automated path, add a Renovate regex manager (or `packageRules` entry) that bumps `overrides.vitest` in `pnpm-workspace.yaml` alongside the `package.json` range, or exclude vitest from automation so the two-place pin is only ever moved by hand.
