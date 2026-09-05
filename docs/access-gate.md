# Closing the demo

Two gates, and they are not equivalent. Pick by what you are actually trying to
stop.

## The edge gate: actually closes the site

HTTP basic auth in `edge/proxy.ts`, in front of the Cloudflare Worker that
proxies `percontra.dev` to Cloud Run. An unauthorized request never reaches the
origin, so the SPA bundle is never served, `/api/*` is never reachable, and the
DuckDB data behind it is never queried.

Arm it with two Worker secrets. Unset either one and every request passes
through, so it is opt-in and there is no way to lock yourself out by deploying.

```fish
# stdin, never --text: the value stays out of shell history and process args
printf '%s' 'percontra' | pnpm --dir edge exec wrangler secret put ACCESS_USER
op read 'op://Private/percontra demo/password' \
  | pnpm --dir edge exec wrangler secret put ACCESS_PASSWORD
just deploy-edge
```

Remove it the same way:

```fish
pnpm --dir edge exec wrangler secret delete ACCESS_PASSWORD
just deploy-edge
```

Caveat worth knowing before the demo: basic auth is a browser-chrome prompt, not
a page you control, and it is remembered per origin for the session. Judges will
see a native dialog rather than anything designed. If that matters for the video,
unlock in the browser first and record after.

## The in-app gate: a doormat, not a lock

`src/components/access-gate.tsx`, armed by `VITE_ACCESS_CODE_SHA256`. It renders
a code field over the workbench and remembers acceptance in `sessionStorage`.

**It does not prevent access to anything.** The bundle, this module, and every
API route are served to whoever asks; the gate only declines to render the UI.
Anyone who opens devtools, disables JavaScript, or curls `/api/overview` walks
straight past it. It is there to turn away someone who wandered onto the URL.

The configured value is a SHA-256 hash rather than the code, so the code is not
a plain string in the bundle for anyone who searches it. That is obfuscation,
not encryption: whoever has the bundle has the hash, and a short code falls to a
wordlist in seconds. Use a long one.

```fish
printf '%s' 'the code you will share' | shasum -a 256
```

`VITE_*` values are read at **build** time, not run time, so setting this on the
Cloud Run service does nothing. It has to reach `pnpm build`, which is why it is
an `ARG` in the Dockerfile. Leaving it empty disables the gate, which is what
local development wants.

## Which to use

The edge gate, if the concern is the anonymised client data. Nothing else on
this list actually withholds it.

The in-app gate is worth keeping alongside it only for the sentence it puts on
screen: a native basic-auth prompt says nothing about what the site is or who to
ask for access, and a passer-by who hits a browser dialog learns less than one
who reads "this is a work in progress being shown to a few people".

Both come off before submission: the repo is public at that point and the deck
warns that judges look for committed secrets.
