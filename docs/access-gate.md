# Closing the demo

One gate: **Cloudflare Access**, in front of the `percontra` Worker. An
unauthenticated request never reaches the Worker, so it never reaches Cloud
Run: the SPA bundle is not served, `/api/*` is not reachable, and the DuckDB
data behind it is not queried. Whoever is signed in sees their address and a
sign-out link in the app header.

There is no second gate. The in-app access-code overlay is gone: it sat behind
real authentication, asked an already-signed-in reviewer for a shared secret,
and never withheld anything, because the bundle and every API route shipped to
whoever asked regardless.

## The parts

| Piece | Where |
| --- | --- |
| The gate | Access application `Per Contra`, Zero Trust org `qmark.cloudflareaccess.com` |
| Who it lets in | The application's allow policy, one email rule per person |
| The login page | Cloudflare's, at `qmark.cloudflareaccess.com`; Google and one-time PIN both offered |
| Identity in the app | `edge/proxy.ts` reads `ctx.access`, answers `GET /api/session` |
| Identity in the UI | `web/src/components/signed-in-as.tsx` in the desk header |
| Sign out | `/cdn-cgi/access/logout`, served by Cloudflare ahead of the Worker |

The Worker does not re-check anything. `ctx.access` is `undefined` when Access
did not run, and the honest reading of that is "the application was deleted",
which is how the gate comes off: delete the Access application, and the site is
open. Nothing needs redeploying to open or close it.

## Creating the application

Once, from the repo root. The worker id is stable; the two IdP ids are the
Google and one-time PIN providers already configured in the org.

```fish
# The token never reaches the command line or shell history: curl reads the
# header from stdin. A failed `op read` writes nothing, so assert non-empty
# before spending the request.
set -l token (op read 'op://Developer/CLOUDFLARE_API_TOKEN/credential')
and test -n "$token"
and printf 'header = "Authorization: Bearer %s"\n' $token | curl -s --config - \
  -X POST 'https://api.cloudflare.com/client/v4/accounts/da6d99959e1dda5394e5e0df5aadc961/access/apps' \
  -H 'Content-Type: application/json' \
  --data '{
    "type": "self_hosted",
    "name": "Per Contra",
    "destinations": [
      { "type": "worker", "worker_id": "3d9f1e7d07ca44f09b0def06aa161548" },
      { "type": "public", "uri": "percontra.dev" }
    ],
    "session_duration": "24h",
    "auto_redirect_to_identity": false,
    "allowed_idps": [
      "afe1e1bb-c8bf-4f6c-9e5d-37572ef8c518",
      "244ad546-cf13-4572-986b-d3d0715aa2ca"
    ],
    "policies": [{
      "name": "Per Contra reviewers",
      "decision": "allow",
      "include": [{ "email": { "email": "luis.camran.markmann@gmail.com" } }]
    }]
  }'
set -e token
```

Both destinations are listed on purpose. `worker` covers the Worker's own
production and preview URLs; `public` covers the `percontra.dev` custom domain
without depending on the first to extend to it.

`auto_redirect_to_identity` stays false so the login page offers both Google and
a one-time PIN. Instant redirect to Google is one click fewer for the two of us
and a dead end for anyone reviewing from a non-Google address.

Then prove it, rather than trusting the response:

```fish
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://percontra.dev/
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://percontra.dev/api/summary
```

Both must be `302` to `qmark.cloudflareaccess.com`. A `200` means the
application is not enforcing on that path, whatever the API said.

## Adding someone

One request per person, against the application's policy. Adding a reviewer is
adding an `include` rule; the whole `include` array is replaced, so send every
address that should keep working.

```fish
set -l token (op read 'op://Developer/CLOUDFLARE_API_TOKEN/credential')
and test -n "$token"
and printf 'header = "Authorization: Bearer %s"\n' $token | curl -s --config - \
  -X PUT "https://api.cloudflare.com/client/v4/accounts/da6d99959e1dda5394e5e0df5aadc961/access/apps/$APP_ID/policies/$POLICY_ID" \
  -H 'Content-Type: application/json' \
  --data '{
    "name": "Per Contra reviewers",
    "decision": "allow",
    "include": [
      { "email": { "email": "luis.camran.markmann@gmail.com" } },
      { "email": { "email": "someone.else@example.com" } }
    ]
  }'
set -e token
```

Whoever is added signs in with Google if the address is a Google account, or
asks for a one-time PIN by email if it is not. Neither needs anything installed
and neither needs a Cloudflare account.

## Opening the site

Delete the Access application. Nothing else changes: the Worker keeps proxying,
`/api/session` starts answering `{ "email": null }`, and the header falls back
to its static label.

```fish
set -l token (op read 'op://Developer/CLOUDFLARE_API_TOKEN/credential')
and test -n "$token"
and printf 'header = "Authorization: Bearer %s"\n' $token | curl -s --config - \
  -X DELETE "https://api.cloudflare.com/client/v4/accounts/da6d99959e1dda5394e5e0df5aadc961/access/apps/$APP_ID"
set -e token
```

The demo repo is public at submission, so the gate comes off before then, or
the judges cannot run what they are scoring.

## Working on it locally

`wrangler dev` has no Access in front of it. The `access.dev` block in
`edge/wrangler.jsonc` hands the local Worker a fixed identity so it takes the
signed-in branch; remove the block to see the signed-out one. Under `just dev`
there is no Worker at all, Django answers `/api/session` with a 404, and the
header shows its fallback label. All three are correct.
