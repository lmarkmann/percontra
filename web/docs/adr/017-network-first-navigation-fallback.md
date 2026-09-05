# ADR 017: Use a Network-First Navigation Fallback for Queued Work

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

The chat demo persists queued sends in IndexedDB, but an offline document reload failed before the application could read that queue. The service worker cached fingerprinted assets only and ignored navigation requests. A previously visited showcase therefore had its route chunks in Cache Storage but no document from which to restart the SPA.

## Decision

Add `/` to the generated install precache. Handle navigation requests network-first and use the cached SPA document only when the network request fails. Keep asset requests cache-first and continue runtime-caching visited lazy chunks.

This is a continuity mechanism for previously visited routes, not an offline-first product contract. First visits remain network-dependent, and an unvisited lazy route is not guaranteed to work offline.

## Consequences

- IndexedDB queues can be restored after an offline reload on a previously visited route.
- Normal online navigation continues to revalidate through the network.
- The cached document and fingerprinted assets share the content-addressed deployment cache lifecycle.
- End-to-end coverage verifies one queued send persists across reload and flushes exactly once after reconnect.
