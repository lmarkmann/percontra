# ADR 011: Gate app mount on AuthKit initialization

**Status:** Accepted
**Date:** 2026-07-11

## Context

The optional AuthKit provider previously appeared after the router had already mounted. That changed the provider element type, remounted the full route tree, and allowed authenticated API reads to run before the access-token bridge existed. The login redirect also discarded the requested route.

## Decision

When WorkOS is configured, load its optional SDK before mounting React and mount the route tree under `AuthKitProvider` once. Leave the static HTML shell in place during that boot. Token reads await the bridge's first getter registration. Login redirects preserve a validated internal return path through TanStack search state and WorkOS OAuth `state`.

Remote session reads treat 401, 403, and 404 as anonymous, and 501 as the documented demo fallback. Network failures, schema failures, and 5xx responses remain errors.

## Consequences

Cold WorkOS loads no longer remount the router or race token registration. Hosted sign-in returns users to the route they requested. Authentication outages surface through route error handling instead of looking like logout.
