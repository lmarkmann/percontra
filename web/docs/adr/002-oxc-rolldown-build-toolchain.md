# ADR 002: Build Toolchain: Oxc + Rolldown, No Babel in the App Path

**Status:** Accepted
**Date:** 2026-07-03
**Deciders:** Luis Markmann
**Amended:** 2026-07-11: the in-app design preview has since moved from `/` to `/showcase` (route split; see ADR-3 and `docs/synthesis/slimming-reference.md` §1). The record below is otherwise unchanged.

## Context

Vite 8 uses Rolldown as its bundler. `@vitejs/plugin-react` v6 configures **Oxc** for JSX transform and Fast Refresh, not Babel. The repo still had Babel packages in `node_modules` from (a) Storybook's `react-docgen` and (b) the `shadcn` CLI's codemods. That created confusion about whether the template was on a slow Babel build path.

## Decision

- **Application build and dev** use Oxc + Rolldown exclusively. No `babel.config.js`, no `@rolldown/plugin-babel`, no `babel-plugin-react-compiler` unless explicitly added later for React Compiler.
- **Typechecking** stays `tsc -b` (no Babel for TypeScript).
- **Storybook removed** (2026-07-03): it was the only runtime-adjacent Babel consumer besides the shadcn CLI. Design preview is the in-app showcase on `/`.
- **shadcn CLI** keeps its transitive `@babel/preset-typescript`; it runs only on `pnpm dlx shadcn add`, never on `pnpm dev` or `pnpm build`.
- **Custom build plugins** live under `vite/plugins/` (`critical-css.ts`, `preload-fonts.ts`).

## Consequences

- **Easier:** fast dev/build; clear mental model (Oxc in, Rolldown out); smaller `node_modules` after Storybook removal.
- **Harder:** no isolated Storybook for primitive docs: showcase + Playwright cover preview instead.
- **Revisit:** add React Compiler via optional `@rolldown/plugin-babel` + `babel-plugin-react-compiler` only when compiler annotations are a project requirement.

## Action Items

1. [x] Remove Storybook and `*.stories.tsx`.
2. [x] Consolidate Vite plugins under `vite/plugins/`.
3. [x] Document build path in `docs/reference/architecture.md` (living doc).
