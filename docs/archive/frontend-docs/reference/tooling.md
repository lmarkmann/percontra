# Tooling standard (2026)

This SPA starter uses **oxfmt** (format) + **oxlint** (full-tree lint, type-aware) + **`tsc`** (types). Tests **Vitest**. Build **Vite 8 / Rolldown** with **Oxc JSX** via `@vitejs/plugin-react`. Package manager **pnpm 11**. Runtime **Node 24 LTS**.

Rationale (decision map §11): pair the VoidZero stack already in the build (Oxc JSX, Rolldown) with oxfmt for format (including Tailwind class sort) and oxlint as the sole linter. No Biome, no Prettier, no ESLint. `oxlint-tsgolint` powers type-aware rules; `tsc` remains the type checker of record.

## Defaults

| Category        | Choice                           | Override only when                           |
| --------------- | -------------------------------- | -------------------------------------------- |
| Package manager | **pnpm 11**                      | Bun install if runtime is Bun                |
| Runtime         | **Node 24 LTS**                  | Bun/Deno for non-SPA CLIs                    |
| Formatter       | **oxfmt**                        | -                                            |
| Linter          | **oxlint** (full tree)           | -                                            |
| Type checker    | **`tsc -b`**                     | `tsgo`-only after ecosystem-stable           |
| Test runner     | **Vitest**                       | -                                            |
| Bundler         | **Vite 8 + Rolldown**            | -                                            |
| SPA router      | **TanStack Router**              | React Router framework mode for SEO/SSR apps |
| Host            | Cloudflare Workers Static Assets | -                                            |

## Node version policy (ADR 023)

`.node-version` pins the exact runtime CI and local dev were tested on (fnm reads it on cd); `engines.node` in `package.json` is the compatibility floor, not a pin. Cadence: bump `.node-version` to the newest 24.x LTS patch as part of routine dependency-bump commits; move the `engines` floor only when code actually requires a newer runtime; evaluate the next LTS major once it reaches Active LTS, not before. The two values answer different questions ("what was tested" vs "what is known incompatible") and must not be collapsed into one moving selector.

## Oxc product map (what we use)

| Oxc surface                                    | Role here                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| **oxfmt**                                      | Sole formatter; import sort (`@/` internal); Tailwind class sort   |
| **oxlint** + tsgolint                          | Sole linter; type-aware rules on; multi-file via `import/no-cycle` |
| **Oxc JSX** (plugin-react)                     | Transform + Fast Refresh in Vite 8 (not Babel)                     |
| **Parser / transformer / minifier / resolver** | Transitive via Vite/Rolldown; not first-class CLIs                 |
| **Vite+ / `vp`**                               | **Not used** (by design; standalone pnpm scripts only)             |
| **jsPlugins** (alpha)                          | **Not used** (no leftover ESLint plugins to bridge)                |

## Oxlint policy

**Plugins** (explicit list restores defaults that an array would otherwise wipe):

`unicorn`, `oxc`, `typescript`, `react`, `jsx-a11y`, `vitest`, `import`, `promise`

Not enabled: `react-perf` (too noisy on shadcn trees), `jsdoc`, `node`, `nextjs`, `vue`.

**Categories**

| Category                            | Level | Notes                                         |
| ----------------------------------- | ----- | --------------------------------------------- |
| `correctness`                       | error | Always                                        |
| `suspicious`                        | error | Always                                        |
| `perf`                              | warn  | Oxc/unicorn perf rules; not react-perf        |
| `pedantic`                          | off   | Avoids `prefer-readonly-parameter-types` etc. |
| `style` / `restriction` / `nursery` | off   | Style is oxfmt's job; nursery unstable        |

Rules arrive with the linter, not only with config edits: oxlint 1.76 added `oxc/bad-match-all-arg` to `correctness`, so it became an error here with no change to `.oxlintrc.json`. Diff `oxlint --print-config` across any linter bump; that rule was the entire diff for 1.73 to 1.76.

One pedantic rule is opted in explicitly: `eqeqeq` (`always`, `null: ignore`), because the enabled categories do not cover loose equality and the `== null` nullish idiom stays allowed (ADR 025).

**Type-aware** (`options.typeAware: true` + `oxlint-tsgolint`)

Errors: floating promises, await-thenable, misused promises, unnecessary assertion/conversion, restrict-template-expressions (numbers/booleans allowed), consistent-return, confusing-void (void op + arrow shorthand ignored), unsafe type assertion / argument / return.

Warns: unsafe assignment / member access / call, prefer-nullish-coalescing, prefer-optional-chain.

Off: `prefer-readonly-parameter-types`, `strict-boolean-expressions`, `strict-void-return` (template noise).

**Overrides**

- `src/components/ui/**` + motion shells: shadcn-friendly (export rule on; shadow/nested/unsafe relaxed).
- tests + `vite/plugins/**`: looser type-aware and vitest rules.

**Ignore**: `dist`, `coverage`, generated route tree, agent dirs (`.claude`, `.agents`, `.grok`).

**Options**

- `typeAware: true`
- `reportUnusedDisableDirectives: error` so a leftover `oxlint-disable` fails CI instead of quietly covering nothing. Do not map `Link`/`Button` through `jsx-a11y.components` or `react.linkComponents` here: Base UI `render={<Button />}` triggers and TanStack `to` then false-positive as unlabeled controls / `a` without `href`.

## Supply chain (pnpm-workspace.yaml)

Four settings, all configuration rather than a service:

| Setting                  | Value               | Why                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `minimumReleaseAge`      | `4320` (3 days)     | A version must be this old before pnpm installs it, transitive deps included. pnpm 11 defaults to 1440, but `minimumReleaseAgeStrict` turns on **only when the value is set explicitly**: the built-in default falls back to a too-new version so the install succeeds, while a configured value fails resolution. Three days spans a Friday-night publish caught on Monday; a week delays every good release too. |
| `blockExoticSubdeps`     | `true`              | Transitive deps resolve from trusted sources only: no git URLs, no tarball URLs.                                                                                                                                                                                                                                                                                                                                   |
| `trustPolicy`            | `no-downgrade`      | Refuses a version whose trust level fell relative to earlier releases, which is the outward shape of a stolen-credential publish.                                                                                                                                                                                                                                                                                  |
| `trustPolicyIgnoreAfter` | `525600` (365 days) | Exempts the pre-provenance era. Without it the policy rejects `semver@5.7.2` and `semver@6.3.1`, years-old transitive pins, rather than anything suspicious.                                                                                                                                                                                                                                                       |

`allowBuilds` continues to allowlist the only dependencies permitted to run install scripts; never `dangerouslyAllowAllBuilds`. A security fix needed before it ages goes in `minimumReleaseAgeExclude` pinned to the exact version (`pkg@1.2.3`), and comes back out once that version clears the floor.

Policy is verified on every install: pnpm re-applies these rules to all 960 lockfile entries and fails the install rather than warning.

## Enforcement chain

```text
prek (commit)  ->  oxfmt --write  +  typecheck  +  oxlint
prek (push)    ->  vitest run
CI             ->  oxfmt --check  +  oxlint --format=github  +  typecheck  +  knip/audit/vitest/build/size/perf/e2e
CI (v* tag)    ->  changelog section present  +  GitHub release from git-cliff --latest
pnpm ci:local  ->  lint + typecheck + knip + audit + coverage + build + size + perf + e2e
```

| Tool           | Role                                                                         |
| -------------- | ---------------------------------------------------------------------------- |
| **oxfmt**      | Format, import sort (internal `@/`), Tailwind class sort (`sortTailwindcss`) |
| **oxlint**     | Full-tree lint + type-aware; UI-scoped `only-export-components`              |
| **tsc**        | Types (`strict` + extra safety flags)                                        |
| **Vitest**     | Unit tests                                                                   |
| **Playwright** | E2E                                                                          |
| **git-cliff**  | `docs/CHANGELOG.md` from conventional commits (ADR 039)                      |

**Out of scope:** ESLint, Prettier, Biome, husky, Storybook as default, Vite+, Changesets, release-plz.

## EditorConfig

`.editorconfig` is the indent/EOL contract for editors and for languages oxfmt does not format (Python, justfile/Make). It is not a second formatter.

| Glob                                            | Indent                             | Why                                                         |
| ----------------------------------------------- | ---------------------------------- | ----------------------------------------------------------- |
| `*.{ts,tsx,js,json,jsonc,html,svg,css,cjs,mjs}` | tabs                               | Matches oxfmt `useTabs`; tab width is left to the reader    |
| `*.{yml,yaml}`                                  | 2 spaces                           | YAML 1.1/1.2 forbids tab indentation                        |
| `*.py`                                          | 4 spaces                           | PEP 8                                                       |
| `*.toml`                                        | 2 spaces                           | `prek.toml`                                                 |
| `*.{md,mdx}`                                    | 2 spaces, keep trailing whitespace | CommonMark list indent; two trailing spaces is a hard break |
| `justfile` / `Makefile`                         | tabs                               | Recipe lines are tab-prefixed                               |
| `pnpm-lock.yaml`, binaries                      | unset                              | Do not reindent on save                                     |

`max_line_length` is 80 except markdown and YAML (unset so editors do not hard-wrap prose or GitHub Actions expressions). oxfmt still sets `printWidth: 80` in `.oxfmtrc.json` for JS/TS.

oxfmt root `useTabs: true` would otherwise apply to YAML/Markdown/TOML; `.oxfmtrc.json` `overrides` force spaces there, and `proseWrap: preserve` so YAML is not reflowed as prose.

## Editors

- **Zed**: install the [Oxc](https://zed.dev/extensions/oxc) extension; project settings in `.zed/settings.json` (oxfmt on save, oxlint fix-on-format, type-aware).
- **VS Code / Cursor**: recommend `oxc.oxc-vscode` via `.vscode/extensions.json`; format + fix on save in `.vscode/settings.json`.
- **Helix / Neovim**: point LSP at `pnpm exec oxlint --lsp` / `oxfmt --lsp` (see oxc.rs editor docs).
- Indent on save for non-JS files comes from `.editorconfig`, not from the Oxc extension.

## Scripts

| Command            | Purpose                                           |
| ------------------ | ------------------------------------------------- |
| `pnpm check`       | oxfmt write + oxlint --fix                        |
| `pnpm lint`        | oxfmt check + oxlint (matches local CI semantics) |
| `pnpm lint:github` | oxlint GitHub annotations only                    |
| `pnpm format`      | oxfmt write                                       |
| `pnpm typecheck`   | `tsc -b` over both projects, no emit              |
| `pnpm ci:local`    | Full local CI, including audit, perf, and e2e     |
| `just changelog`   | Regenerate `docs/CHANGELOG.md` from the tags      |
| `just unreleased`  | Preview the next section, printed not written     |
| `just release V H` | Write the section, bump, commit, annotate the tag |

## Related

- [architecture.md](./architecture.md)
- [ADR 002](../adr/002-oxc-rolldown-build-toolchain.md), [ADR 005](../adr/005-tooling-and-spa-spine.md), [ADR 039](../adr/039-git-cliff-not-changesets.md)
