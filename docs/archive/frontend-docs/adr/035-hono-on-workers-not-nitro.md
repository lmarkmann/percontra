# ADR 035: Hono on Workers, Not Nitro

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

Workers is a runtime. Nitro is a portable server engine that can target Workers (and Node, Bun, Deno, Vercel, Netlify, Lambda). They are not alternatives at the same layer. Vite-ecosystem intros still sell "full-stack" as a reason to add Nitro to an SPA that already has a thin Hono Worker behind `/api/*`.

## Decision

Cloudflare-locked apps from this template keep the shipped stack: Hono on Workers (`server/index.ts`, `@cloudflare/vite-plugin`, wrangler bindings). Nitro is added only when the product must move hosts or sits on a Nitro meta-framework (Nuxt, TanStack Start, SolidStart).

This template does not install Nitro, nitropack, or a Nitro Vite plugin. The Worker stays databaseless and domain-free until a fork decides otherwise. Leaving Cloudflare as a host is a different question; that how-to lives in `docs/reference/detach-cloudflare.md`.

| Need                                                      | Choice                                       |
| --------------------------------------------------------- | -------------------------------------------- |
| Thin API / BFF next to the SPA, Cloudflare is the host    | Hono on Workers (shipped)                    |
| Deploy-anywhere server, meta-framework, or multi-host SSR | Nitro (or the meta-framework that brings it) |

## Consequences

- Growing the API is extending `server/index.ts`, not re-tooling.
- A fork that needs D1, Durable Objects, Queues, Workflows, or R2 as primary building blocks stays native; Nitro's Cloudflare path exists but is built for multi-host, not CF-native design.
- Auth posture is orthogonal (ADR 006). Nitro does not reopen Better Auth.

## Evidence

The one-line tradeoff: Nitro buys multi-host packaging and meta-framework ergonomics; native Workers buys first-class Cloudflare primitives and a smaller edge surface. You rarely want both layers for the same API.
