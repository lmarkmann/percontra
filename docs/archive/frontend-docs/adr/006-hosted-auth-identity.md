# ADR 006: Auth Identity Stays Hosted (WorkOS + Demo); Donor Security Posture Adopted Without Better Auth

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

The 2026-07 template audit studied four Better Auth / self-managed-auth starters (kriasoft/react-starter-kit, mugnavo/tanstarter, satnaing/shadcn-admin, epicweb-dev/epic-stack) as donors. An earlier phase draft concluded the template should adopt Better Auth on D1. The user overrode that on 2026-07-10: the donors were studied for their security philosophy, which they were forced into precisely because they fully own their authentication. This template deliberately does not want to own password storage, session tables, or verification flows.

## Decision

Hosted auth remains the template's identity story: the localStorage demo session is the zero-config default, and WorkOS AuthKit is the env-gated hosted provider. Better Auth was evaluated and deliberately not adopted; it makes the template owner of password storage, session tables, and verification flows, against the thin-shell philosophy. No database, no ORM, no `@workos-inc/node` (JWKS verification is keyless and needs no API key).

What was adopted instead is the donors' security posture:

- One server-side verification middleware (`server/auth.ts` `requireSession`), set on the Hono context, never per-route ad hoc SDK calls (kriasoft pattern).
- JWKS-verified stateless sessions: jose `createRemoteJWKSet` + `jwtVerify` against `https://api.workos.com/sso/jwks/{WORKOS_CLIENT_ID}`, issuer-pinned. AuthKit access tokens are short-lived JWTs verified on every request, which also covers tanstarter's freshAuthMiddleware idea (no cached session to go stale). The `aud` claim is not enforced; WorkOS tokens have not always carried it, and the per-client JWKS URL already binds a valid signature to the client id.
- Structural route gating: the pathless `src/routes/_authenticated/` layout owns `requireAuth`; protection is a property of file location (shadcn-admin pattern).
- Origin checks on mutating `/api/*` requests and `secureHeaders()` on API responses (the donors' trustedOrigins CSRF posture translated to a same-origin API).
- problem+json auth errors without oracles: a 401 never says why the token failed; `GET /api/session` answers 501 when `WORKOS_CLIENT_ID` is unset and the client falls back to the demo session.
- E2E fixture philosophy: only the login spec drives the login UI; other specs get a session programmatically (epic-stack pattern, adapted to the demo localStorage boundary).

The `org_id`, `role`, and `permissions` claims that AuthKit adds once an organization is selected are documented here for a future RBAC fork but deliberately not consumed.

## Consequences

- **Easier:** the auth boundary is now real (server-side verification, fail-closed on a WorkOS outage), while the template still stores no credentials and runs no auth database; demo mode stays byte-identical with no env vars set.
- **Harder:** the positive path needs a real WorkOS client id to exercise end to end; WorkOS-mode e2e stays deferred (hosted login page).
- **Revisit:** Better Auth per decision map section 9, only when a product fork needs first-party auth with its own user database; then it replaces the demo default, not the WorkOS bolt-on.
