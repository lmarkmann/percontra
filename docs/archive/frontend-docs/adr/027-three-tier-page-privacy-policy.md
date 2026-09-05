# ADR 027: Three-Tier Page Privacy Policy

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

A crawler/metadata audit confirmed the template's SEO surface is coherent: home is `index,follow`; showcase, login, dashboard, and the catch-all are `noindex,nofollow` via per-route meta from `src/lib/route-metadata.ts`; `robots.txt` is a single allow-all group; the sitemap emits only indexable routes. What was undefined is what a fork should do with a page like pricing that some products want public, some want unlisted, and some want genuinely private. The recurring confusion this ADR settles: robots.txt is often reached for as if it were an access or de-indexing tool. It is neither. A crawler blocked by robots.txt can never fetch the page, so it never sees a `noindex` meta tag, and the URL can still enter the index from external links (title-less, but present).

## Decision

Every "private" page in a fork is classified into exactly one of three tiers:

1. **Discoverable**: crawlable, `index,follow` in `routeSeo`, listed in the sitemap. For pages that should rank (public pricing as a marketing asset).
2. **Public but unlisted**: crawlable, meta `noindex` via `routeSeo`, absent from the sitemap, and **no robots.txt Disallow** (the Disallow would hide the noindex from the crawler and defeat it). For pages anyone with the link may view but that should not surface in search (pricing you show customers but not competitors' comparison pages, changelogs, internal-ish docs).
3. **Confidential**: behind `requireAuth` under `_authenticated/`. Access control is the server session check; crawler directives are irrelevant because unauthenticated requests never see the content. Meta stays `noindex` as hygiene, nothing more.

Neither robots.txt nor `noindex` is access control; anything that must not be seen belongs in tier 3. `Disallow` in robots.txt remains reserved for crawl-budget or hard path blocks where indexing status does not matter.

## Consequences

- "Make the pricing page private" becomes a classification question with three answers instead of an ambiguous request.
- Tier 2 pages stay crawlable on purpose; that is the mechanism, not an oversight to "fix" with a Disallow.
- The template's own demo routes are all tier 2 (showcase, login) or tier 3 (dashboard) already; no changes were needed.

## Alternatives Considered

### Treat noindex + robots.txt Disallow as belt and suspenders

Feels safer. Rejected because the two mechanisms cancel: Disallow prevents the crawler from ever reading the noindex, leaving the URL indexable from external links. The "belt" cuts the "suspenders".

### Only two tiers (public / authenticated)

Simpler. Rejected: it loses the real middle case, pages that must stay reachable by link (no login wall) without appearing in search results.

## Validation

`routeSeo` in `src/lib/seo.ts` plus `src/lib/route-metadata.ts` express tiers 1 and 2 today; `_authenticated/route.tsx` (`requireAuth`) is tier 3. Policy paragraph lives in README "SEO / crawlers".
