# ADR 014: Make the router and route metadata authoritative

**Status:** Accepted
**Date:** 2026-07-11

## Context

Hand-written dynamic imports targeted route reference modules that TanStack Router already placed in the entry graph, while actual components lived in generated split chunks. SEO paths and robots directives were also duplicated between client matching and sitemap emission.

## Decision

TanStack Router owns route splitting and intent preloading. Links use router intent behavior, and the two non-link intent sites call `router.preloadRoute`. Preloaded loader data has a stale time of zero.

An environment-free route metadata module owns path and robots values. Client SEO matching and the sitemap plugin consume it. Path matching requires either equality or a slash boundary.

## Consequences

Preloading now warms the component chunk and loader that navigation will use. New route metadata has one registration site, and nearby paths such as `/login-help` cannot inherit login metadata accidentally.
