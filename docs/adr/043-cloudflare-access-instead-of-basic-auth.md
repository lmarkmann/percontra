# ADR 043: Cloudflare Access instead of basic auth

**Status:** Accepted
**Date:** 2026-09-06
**Decider:** Luis Markmann

## Context

The hosted demo was closed with HTTP basic auth in `edge/proxy.ts` and a second, in-app access-code overlay armed by `VITE_ACCESS_CODE_SHA256`.

Basic auth closed the site correctly and looked like nothing. The challenge is browser chrome, not a page: a native credential dialog drops out of the top of the window, carries no product name, no explanation and no way to ask for access, and is remembered per origin for the session so it cannot be demonstrated twice without clearing state. A quarter of the hackathon score is UI, judged on a non-technical fund manager meeting the product; the first thing that product showed anyone was an unstyled OS prompt.

It also broke the service worker. A worker answering navigations with `respondWith(fetch(request))` receives the 401 as a successful fetch, and a response delivered that way never raises the dialog, so the page went blank with no way to self-heal. `edge/proxy.ts` still serves a kill switch at `/sw.js` because of it.

The in-app overlay had a different problem: it sat behind whatever the edge gate allowed through and withheld nothing, since the bundle, its own module and every `/api` route shipped to whoever asked. It was a doormat described as one, and with a real gate in front of it, it only asked an authenticated reviewer for a second secret.

The account already had what the replacement needs: a Zero Trust organisation at `qmark.cloudflareaccess.com`, a working Google identity provider, and one-time PIN available by default.

## Decision

Cloudflare Access, as a self-hosted application bound both to the `percontra` Worker and to the `percontra.dev` custom domain. Basic auth and the in-app overlay are both deleted.

The login page is Cloudflare's own, offering Google and a one-time email PIN. `auto_redirect_to_identity` stays false: skipping the chooser saves the two of us one click and strands any reviewer whose address is not a Google account.

The Worker no longer implements a gate. It reads `ctx.access`, answers `GET /api/session` with the identity, and forwards the address to the origin as `X-Access-Email`. `ctx.access` is `undefined` exactly when Access did not run, so deleting the application opens the site with no deploy.

The app shows who is signed in. `SignedInAs` in the desk header replaces the static "Local operator" label with the address and a sign-out link to `/cdn-cgi/access/logout`, and falls back to the label wherever Access is not in front of the app: `wrangler dev`, `just dev`, the Cloud Run URL, and a deployment whose application has been deleted.

WorkOS AuthKit was the other hosted-login candidate and was rejected: a second vendor account, a client id, and a wired SDK, to authenticate two people against a gate that has to disappear before submission. The platform already in front of the origin can do it with no application code.

## Consequences

- Nobody reaches Cloud Run without a session, as before, but now through a page that names the product and says how to get in.
- Sign-in works on a phone, on a judge's laptop, and in a screen recording, none of which a shared basic-auth credential does well.
- The site's open and closed states are one API object, not a pair of Worker secrets whose blank value once silently opened it.
- The identity is available to the origin (`X-Access-Email`), which is what an audit trail on release approvals would need if this outlives the weekend.
- Access is a Cloudflare dependency the rest of the deployment does not otherwise have. A fork that leaves Cloudflare loses the gate and has to write one; `docs/reference/detach-cloudflare.md` is where that lands.
- The `access.dev` block in `edge/wrangler.jsonc` is the only way to exercise the signed-in branch locally, so it has to stay honest with the production identity shape.

Operating it, including who to add and how to open the site, is `docs/access-gate.md`.
