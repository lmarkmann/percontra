# ADR 004: Status Page: Upptime (Self-Hosted via GitHub Actions + Pages), Not a SaaS Vendor

**Status:** Accepted
**Date:** 2026-07-03
**Deciders:** Luis Markmann

## Context

Sites deployed from this template have no monitoring or public status page by default (see the "No backend ships here" rule in `.claude/CLAUDE.md`). Real users currently learn about downtime only from the site itself being unreachable. A `status.<domain>` page is a plausible default for every project this template spawns, not a one-off for a single site, so the pattern needs to be cheap to repeat across many personal/side-project domains without becoming a recurring subscription per domain.

## Decision

Ship the status page as its own clone-and-rename starter, `status-template`, built on **Upptime** (MIT-licensed, `github.com/upptime/upptime`): scheduled checks run as a GitHub Actions workflow, downtime is tracked as GitHub Issues, and the static status site is generated and deployed to GitHub Pages; all inside the cloned repo, nothing else to pay for or operate. It lives alongside `cli-template`, `tui-template`, and `theme-template` at the `~/Documents/` workspace level, not inside this repo's `src/`: it deploys to GitHub Pages, not Cloudflare Workers, and shares no code with the Vite/React app.

Wiring a domain's status page is then: clone `status-template`, rename, add the domain's endpoint(s) to `.upptimerc.yml`, set `cname: status.<domain>`, point a DNS-only Cloudflare CNAME at `<username>.github.io`. See the "First deploy" checklist in `.claude/CLAUDE.md`.

## Options Considered

### Option A: Instatus

| Dimension     | Assessment                                                             |
| ------------- | ---------------------------------------------------------------------- |
| Setup         | Lowest, hosted, polished page in minutes                               |
| Custom domain | Paid only (Pro tier, ~$15-20/mo)                                       |
| Monitoring    | Basic HTTP/keyword checks, bolted on                                   |
| Fit           | Poor for many low-traffic personal domains, a subscription per project |

### Option B: Better Stack / OpenStatus (hosted)

| Dimension     | Assessment                                                                           |
| ------------- | ------------------------------------------------------------------------------------ |
| Setup         | Low, hosted dashboards                                                               |
| Custom domain | Paid tier on both (Better Stack ~$12-24/mo; OpenStatus cloud $30/mo)                 |
| Monitoring    | Real (Better Stack: uptime + logs + on-call; OpenStatus: 28-region synthetic checks) |
| Fit           | Capability aimed at teams with on-call and paying customers, not a solo side project |

### Option C: Upptime, self-hosted via GitHub Actions + Pages (chosen)

| Dimension     | Assessment                                                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Setup         | Low, clone, edit one YAML file, enable Pages                                                                                           |
| Custom domain | Free, it's a normal GitHub Pages CNAME                                                                                                 |
| Monitoring    | Real but coarse: HTTP checks on a cron (default every 5 min); GitHub's own scheduled-workflow queue can delay a run further under load |
| Fit           | Matches the domain: a free/personal project, git-native state (issues = incidents), no new vendor relationship                         |

## Trade-off Analysis

Every SaaS option gates a custom domain behind a paid tier, the free plans are upgrade bait, not a permanent home. Paying $15-30/month per status page is fine for one product with paying customers; it's the wrong shape for a template meant to be cloned across many small or hobby domains. Upptime trades away check-interval precision and on-call/escalation features none of these domains need, in exchange for the page costing nothing to run no matter how many domains exist, and for incident history living in an plain git repo instead of a vendor's database, consistent with this workspace's existing preference for self-owned tooling (prek over pre-commit, `rtk`, self-hosted fonts) over opaque hosted defaults.

## Consequences

- **Easier:** zero marginal cost per domain; incident history and checks are plain git history, greppable and exportable; no vendor account to manage per project.
- **Harder:** checks run on GitHub's shared Actions scheduler, not a dedicated monitoring fleet: expect occasional multi-minute drift in check timing, and there's no SMS/phone escalation if that's ever needed.
- **Revisit:** if a project graduates to real paying customers with an SLA, a hosted vendor with escalation policies and multi-region checks (Better Stack or OpenStatus) is the correct upgrade, that's a reason to upgrade that one project, not to change the default for every other project.

## Action Items

1. [ ] Create `status-template` at `~/Documents/` from `upptime/upptime`, matching the clone-and-rename pattern of `cli-template`/`tui-template`/`theme-template`.
2. [ ] Add `status-template` to the `~/Documents/.claude/CLAUDE.md` project inventory table.
3. [x] Document the wiring steps in this repo's `.claude/CLAUDE.md` "First deploy" checklist and in `docs/reference/incident-response.md`.
