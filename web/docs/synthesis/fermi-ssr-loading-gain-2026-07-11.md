# Fermi: what would full SSR buy the end user?

**Date:** 2026-07-11
**Question:** This template is a client-rendered SPA (not yet SSR). If it were fully SSR-configured, how much better would loading time / perceived experience / security get for the end user?
**Method:** measure the current build, then estimate the delta. No code edited.

## Measured baseline (from `dist/`)

- `index.html` = 37.7 kB raw (~11 kB gzip). Contains a **static first-paint shell** (`data-static-shell`) with kicker/title/description/CTAs + real `<a href>` links, plus **inlined critical CSS** (`<style id="critical">`).
- Home boot JS+CSS graph ≈ 130-150 kB gzip (main 86 kB, css 30 kB, site 19 kB, gt-bootstrap 5.3 kB, react 4.7 kB, + small chunks). Budget: 170 kB brotli.
- LHCI desktop gates (throttled): FCP <= 1400 ms, LCP <= 1700 ms; GHA measures ~1290/1520.
- Worker (`server/index.ts`) already serves `/api/*`; secrets stay server-side; only `VITE_*` public vars ship.

## Decomposition

The user-facing effect of SSR splits into three independent quantities. Treat them separately; do not average them.

    content_visible_gain = (time content paints without SSR) - (with SSR)
    interactive_gain      = TTI_without - TTI_with        # hydration downloads same JS either way
    crawler_visibility    = binary (JS-blind bots see body HTML: yes/no)

Transfer math (fend):

- 150 kB gzip home graph: **750 ms** on slow-4G (1.6 Mbps), **60 ms** on 20 Mbps cable.
- 11 kB shell: **55 ms** on slow-4G. Already near-instant.

## Estimate by route class

**Home route (`/`).** The static shell is hand-rolled SSR for the above-fold content. SSR's incremental FCP/LCP gain ≈ **0 to slightly negative** (SSR HTML is larger; runtime SSR also loses pure-static-CDN caching unless you prerender/SSG). Median gain **~0 ms**, 80% CI [-100, +150] ms.

**Content routes without a shell (`/showcase`, `/dashboard`).** Today: blank/skeleton until ~130-150 kB JS downloads + parses + React mounts + loader runs. Content-visible today ≈ 1.5-2.5 s mobile / 0.6-1.0 s desktop. SSR paints server HTML at HTML-parse time (~0.5-0.8 s mobile).

- **content_visible_gain ≈ 0.7-1.5 s on mobile, 0.2-0.5 s on desktop.** This is the only real human loading-time win.
- **interactive_gain ≈ 0** (hydration downloads the identical bundle; SSR can delay TTI slightly).

**Crawlers / GEO.** Binary flip: GPTBot/CCBot/Googlebot-without-JS go from seeing only the home shell to seeing full body HTML. Not a millisecond number; it is the launch gate the project's own CLAUDE.md names.

## Security

**Delta ≈ negligible, and "more secure" is the wrong frame.** SSR is a rendering strategy, not a security control. This app already keeps secrets in the Worker and ships only public `VITE_*` vars; data already comes from an authenticated API. SSR would let you withhold gated _content_ from the client bundle, but the data is already server-fetched. Client route guards remain UX-only either way; real protection is the server check, which exists now. No credible security gain.

## Moving factor

**Which routes carry meaningful content.** For a counter/landing SPA the answer is "none above the shell" -> SSR buys ~0 loading time, only crawler visibility. The more the product grows content-heavy routes reachable cold, the more the 0.7-1.5 s mobile content-visible win applies.

## Validation

- Independent path (transfer vs the shell design): the shell exists _precisely_ to erase FCP on `/`, so a near-zero home gain is internally consistent, not a coincidence.
- Limiting case: if SSR gave a big home FCP win, the 11 kB/55 ms shell would be pointless engineering. It isn't; it already captures that win.
- Analogue: Astro/Next "SSR vs hydrated SPA" studies put FCP gains at ~0.3-1.5 s on content pages, near-0 where a static skeleton already paints. Consistent.

## Bottom line

- Home route: **~0 ms** human gain. The static shell already did SSR's job there.
- Content routes (cold, JS-heavy): **~0.7-1.5 s** faster _content-visible_ on mobile, ~0.2-0.5 s desktop; **~0** faster to interactive (same hydration cost).
- Security: **no meaningful gain**; SSR is not a security upgrade for this architecture.
- The genuine reason to do it is **GEO/SEO crawler-visible HTML** (a capability flip), which is why CLAUDE.md frames prerender/TanStack Start as the launch gate, not a perf tactic.

Recommendation: if the goal is "feels faster," the money is in trimming the 150 kB hydration graph and adding shells to more routes, not SSR. If the goal is "bots see the content," that is the SSR/prerender case, and it is real.
