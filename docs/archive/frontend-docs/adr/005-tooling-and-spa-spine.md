# ADR 005: Tooling + SPA spine (2026-07 decision map)

**Status:** Accepted
**Date:** 2026-07-09
**Deciders:** Luis Markmann
**Amended:** 2026-07-11: file-based TanStack routing has since shipped (routes under `src/routes/`, generated `routeTree.gen.ts`), and the Better Auth auth narrative in this record is superseded by ADR-6 (evaluated, deliberately not adopted). The record below is otherwise unchanged.

## Context

The frontend stack decision map v2 (2026-07-07) locks defaults through ~2029:

- SPA / app behind auth, no SEO -> **Vite + React + TanStack Router**
- Lint **oxlint**, format **oxfmt** (map §11; Biome no longer the template default)
- Identity core **Better Auth** when a backend exists; WorkOS only as enterprise SSO bolt-on
- Host **Workers** static assets for this template shape

The template previously shipped React Router v8 Data Mode, Biome as sole format/lint, and WorkOS as the documented auth default.

## Decision

1. **oxfmt** sole formatter (tabs, double quotes, `sortImports` with `@/` internal group, `sortTailwindcss` against `src/index.css`, embedded language formatting auto).
2. **oxlint** sole linter with an explicit plugin list that restores defaults: unicorn, oxc, typescript, react, jsx-a11y, vitest, plus import + promise. Categories: correctness + suspicious as error, perf as warn. Type-aware **on** via `oxlint-tsgolint` with a curated rule set (unsafe assertion/argument/return as error; assignment/member/call as warn; pedantic traps like `prefer-readonly-parameter-types` off). `react/only-export-components` error-scoped to UI primitives. `tsc` remains type checker of record.
3. **TanStack Router** code-based route tree in `src/router.tsx` (not file-based this pass). Auth via `beforeLoad` + `requireAuth`. Dashboard `view`/`debug` search params validated with zod.
4. **Auth narrative:** demo `session.ts` default; Better Auth documented as production core; WorkOS optional env-gated seam for archetype C only.
5. **No Biome, no ESLint, no react-router.** No Vite+/`vp`. No oxlint `jsPlugins` until a leftover ESLint plugin is required.
6. **Editors:** project `.vscode/` and `.zed/` wire the official Oxc extensions for format-on-save and type-aware lint.

## Consequences

- **Easier:** stack matches the decision map SPA row; typed search params on the dashboard; format/lint share Oxc lineage with Vite 8; agents and humans get the same lint contract in editors and CI (`--format=github`).
- **Harder:** type-aware rules still need UI/test overrides for shadcn noise; file-based TanStack route codegen deferred; Better Auth still needs a backend to install for real.
- **Revisit:** oxfmt 1.0 (map §14); promote remaining `no-unsafe-*` warns to error when route-loader typing is solid; `react-perf` plugin only if non-UI trees grow; file-based TanStack if route count grows; TanStack Start GA as SSR alternative (map §14).

## Action Items

1. [x] Remove Biome; add oxfmt + expanded oxlint; prek + CI.
2. [x] Migrate React Router -> TanStack Router (code-based).
3. [x] Auth docs/seams: Better Auth core, WorkOS bolt-on, demo default.
4. [x] State-matrix test helpers (`src/test/state-matrix.ts`).
5. [x] Global `Agents.md` updated to oxfmt/oxlint + TanStack SPA (no Vite+/vp).
6. [x] Oxlint full plugin set + curated type-aware; editor + CI github format; docs/reference/tooling policy (2026-07-09).
