# ADR 034: Telemetry Posture

**Status:** Accepted
**Date:** 2026-07-13
**Deciders:** Luis Markmann

## Context

The manual review left telemetry as an open three-part question: is cookieless PostHog EU still
the lasting analytics default (§8.1), which hosted EU services are acceptable (§8.2), and is
self-hosting a real requirement or a privacy proxy (§8.3). CLAUDE.md and the code already practice
an answer (`src/lib/analytics.ts`: lazy dynamic import, `persistence: "memory"`,
`disable_session_recording: true`, default host `https://eu.i.posthog.com`), but nothing recorded
it as decided, and the per-project CSP recipe was blocked on knowing the telemetry surface.

## Decision

- **Product analytics default:** cookieless PostHog against the EU ingest host, env-gated and
  lazy, exactly as `src/lib/analytics.ts` ships it. Memory persistence and no session recording
  keep it consent-banner-free. For pure content sites, Cloudflare Web Analytics instead of any
  SDK.
- **Hosted EU services are acceptable in general.** The bar is: EU data residency, no cookies or
  fingerprinting by default, and no PII leaving the app's control beyond what the service needs.
  Sentry (EU ingest, `sendDefaultPii: false`) meets it for error reporting when an SLA exists.
- **Self-hosting is not a requirement.** The privacy properties it would buy (residency, no
  third-country transfer, no ad-tech reuse) are already delivered by the EU-hosted cookieless
  setup; what self-hosting adds is an ops burden with no user-visible gain at this scale.
  Revisit only if a fork handles special-category data (health, per the GOÄ cluster) where a
  processor relationship itself is the problem.

Same posture as the font rule: self-host what is trivially self-hostable (fonts, SDK bundles via
pnpm), buy residency for what is not (ingest infrastructure).

## Consequences

- The connect/script surface is now known, which unblocks the CSP derivation recipe in
  `docs/reference/deploy-checklist.md`: PostHog EU ingest, WorkOS API origin, Sentry ingest, nothing else.
- Google Analytics stays banned (cookie consent, US transfer); nothing in this stack introduces a
  consent banner.
- A fork changing the analytics vendor re-derives its CSP and revisits this ADR; the seam
  (`src/lib/analytics.ts`) makes the swap local.

## Alternatives Considered

### Self-hosted PostHog or Plausible

Full data control. Rejected: a personal-template fleet should not run an ingest cluster; the
cookieless EU-hosted setup already satisfies the privacy bar, and the seam keeps the exit open.

### No analytics by default, decide per fork

Zero surface. Rejected in practice: the seam already exists and is inert without env vars, which
is the same thing with a better default when a fork flips it on.

## Validation

`src/lib/analytics.ts` matches the decision as shipped (EU host default, memory persistence,
recording off); no analytics package is a default dependency; the CSP recipe in
`docs/reference/deploy-checklist.md` derives only from the origins named here plus auth.
