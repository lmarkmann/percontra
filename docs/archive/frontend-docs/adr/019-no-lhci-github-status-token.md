# ADR 019: Run Lighthouse CI Without a GitHub Status Token

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

`lhci autorun` prints `⚠️ GitHub token not set` during its healthcheck. The warning refers to an optional integration: when `LHCI_GITHUB_TOKEN` or `LHCI_GITHUB_APP_TOKEN` is present, LHCI posts one commit status per audited URL (`lhci/url//`, `lhci/url//showcase`) summarizing assertion results. Without a token, LHCI skips that step and continues; the warning never affects the run outcome. During a CI failure investigation this warning was briefly mistaken for an expired personal access token, but no PAT exists anywhere in this pipeline.

Three credentials could serve the integration. A personal access token is long-lived and needs manual renewal; nothing here uses one. The Lighthouse CI GitHub App token exists for CI systems outside GitHub Actions and is redundant machinery here. The workflow-scoped `GITHUB_TOKEN` is minted per run, expires with the job, and would be the correct choice if the integration were wanted; it costs one `env` line on the `perf:ci` step.

Two facts cap the integration's value in this template. The `assert` block in `lighthouserc.cjs` already fails the workflow on any budget breach, so the CI run itself is the visible red cross; the LHCI status would duplicate it with finer granularity. And `upload.target` is `filesystem`, so the status check's details link has no hosted report to point at; the numbers live in the job log either way.

## Decision

Leave the LHCI GitHub status integration unconfigured. Do not set `LHCI_GITHUB_TOKEN` or `LHCI_GITHUB_APP_TOKEN`, and never introduce a personal access token for it. Treat the healthcheck warning as the accepted, zero-cost price of this decision.

Revisit only if the repository starts taking pull requests where per-URL performance verdicts should be readable in the PR checks UI without opening the job log. In that case add `LHCI_GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` to the `perf:ci` step and switch `upload.target` to `temporary-public-storage` in the same change, so the status check links to an actual report.

## Consequences

- The `⚠️ GitHub token not set` line remains in every `perf:ci` log and is expected; it must not be read as an expiring credential or a failure cause.
- The perf job keeps zero GitHub API write access, in line with least privilege for CI steps.
- Performance regressions surface exactly once, as the failed `ci` workflow, with details in the job log.
- Forked products that enable the integration later inherit the pairing rule: token and hosted report upload arrive together or not at all.

## Alternatives Considered

### Wire `GITHUB_TOKEN` now

One line, no rotation burden. Rejected because it grants write scope for a status marker that duplicates the existing workflow failure and, with filesystem uploads, links nowhere.

### Install the Lighthouse CI GitHub App

Designed for CI providers without an ambient GitHub token. On GitHub Actions it adds a stored secret and an app installation to achieve what `secrets.GITHUB_TOKEN` already provides.

### Use a personal access token

Strictly worse: long-lived, manually renewed, broader scope than the repo needs, and the failure mode is exactly the silent expiry that was initially suspected in this investigation.

## Validation

Run the `ci` workflow. The `perf:ci` step should print the healthcheck warning, complete its Lighthouse runs, and enforce the assertion budgets; no `lhci/url/*` statuses should appear on the commit.
