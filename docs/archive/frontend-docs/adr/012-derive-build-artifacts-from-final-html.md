# ADR 012: Derive build artifacts from final HTML

**Status:** Accepted
**Date:** 2026-07-11

## Context

Hand-maintained filename patterns drifted from the actual client graph. The service worker missed home boot chunks and Charter while matching the deferred Inter latin-ext face. The critical CSS plugin could select a lazy route stylesheet by directory order. Build plugins also ignored mode-specific `.env` files.

## Decision

Build plugins load Vite mode environment files through `loadEnv`. Critical CSS selects only `main-*.css`. The service-worker precache is derived from asset URLs in the built `index.html`, then extended with the same exact font matcher used by `preload-fonts.ts`.

## Consequences

New home dependencies enter the repeat-visit cache automatically, while deferred routes and unicode-range-gated fonts remain deferred. Missing first-paint font matches produce a build warning instead of silent drift.
