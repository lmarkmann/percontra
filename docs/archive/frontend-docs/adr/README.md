# Architecture decision records

A decision that constrains future code lives here, once.

## What belongs here, and what does not

| the fact                                                                             | its home          |
| ------------------------------------------------------------------------------------ | ----------------- |
| a decision that constrains future code                                               | **here**          |
| current system shape, env contract, toolchain values, deploy and incident procedures | `docs/reference/` |
| a dated investigation or pass record                                                 | `docs/synthesis/` |
| design brief, glossary, component specs                                              | `docs/frontend/`  |
| what is still open in this template                                                  | `docs/TODO.md`    |

A new ADR is owed when a choice would be expensive to reverse and a future reader would otherwise re-litigate it. Not for a knob, not for a bug, not for a runbook.

Designators are stable. Do not reuse or renumber them. Superseding means a new file marking both, never editing the old one into agreement.

## Format

`NNN-kebab-title.md`. Context, Decision (present tense), Consequences, Evidence. Keep it under about fifty lines.

## The record

| ADR                                                                | Decision                                        | Status                   |
| ------------------------------------------------------------------ | ----------------------------------------------- | ------------------------ |
| [001](./001-dependency-update-automation.md)                       | Dependency update automation tooling            | Accepted, config shipped |
| [002](./002-oxc-rolldown-build-toolchain.md)                       | Oxc and Rolldown build toolchain                | Accepted                 |
| [003](./003-in-app-design-showcase.md)                             | In-app design showcase                          | Accepted                 |
| [004](./004-upptime-status-page.md)                                | Upptime status pages                            | Accepted                 |
| [005](./005-tooling-and-spa-spine.md)                              | Tooling and SPA spine                           | Accepted                 |
| [006](./006-hosted-auth-identity.md)                               | Hosted auth identity                            | Accepted                 |
| [007](./007-shared-typescript-compiler-options.md)                 | Shared TypeScript compiler options              | Accepted                 |
| [008](./008-colocate-small-tool-configurations-in-package-json.md) | Colocated small tool configurations             | Accepted                 |
| [009](./009-showcase-idle-paint-content-visibility.md)             | Offscreen showcase rendering                    | Accepted                 |
| [010](./010-own-generated-ui-primitives.md)                        | Ownership of generated UI primitives            | Accepted                 |
| [011](./011-authkit-initialization-and-return-paths.md)            | AuthKit initialization and return paths         | Accepted                 |
| [012](./012-derive-build-artifacts-from-final-html.md)             | Build artifacts derived from final HTML         | Accepted                 |
| [013](./013-gate-production-on-ci-and-aggregate-home-bytes.md)     | CI-gated production and aggregate home bytes    | Accepted                 |
| [014](./014-router-and-route-metadata-are-authoritative.md)        | Router and route metadata authority             | Accepted                 |
| [015](./015-iso-timestamps-at-the-wire-boundary.md)                | ISO timestamps at the wire boundary             | Accepted                 |
| [016](./016-remove-expired-release-age-exceptions.md)              | Expired release-age exceptions                  | Accepted                 |
| [017](./017-network-first-navigation-fallback.md)                  | Network-first navigation fallback               | Accepted                 |
| [018](./018-generate-worker-types-instead-of-committing-them.md)   | Generated Worker types stay untracked           | Accepted                 |
| [019](./019-no-lhci-github-status-token.md)                        | No LHCI GitHub status token                     | Accepted                 |
| [020](./020-simulated-latency-stays-off-the-test-clock.md)         | Simulated latency stays off the test clock      | Accepted                 |
| [021](./021-test-infrastructure-changes-are-trigger-gated.md)      | Test infrastructure changes are trigger-gated   | Accepted                 |
| [022](./022-accessibility-conformance-and-fork-safe-storage.md)    | Accessibility conformance and fork-safe storage | Accepted                 |
| [023](./023-node-exact-pin-plus-engines-floor.md)                  | Node exact pin plus engines floor               | Accepted                 |
| [024](./024-justfile-as-discovery-layer.md)                        | Justfile as discovery layer                     | Accepted                 |
| [025](./025-explicit-strict-equality-rule.md)                      | Explicit strict equality rule                   | Accepted                 |
| [026](./026-size-budgets-are-tripwires-not-headroom.md)            | Size budgets are tripwires, not headroom        | Accepted (a decline)     |
| [027](./027-three-tier-page-privacy-policy.md)                     | Three-tier page privacy policy                  | Accepted                 |
| [028](./028-zod-at-storage-boundaries-no-rename-aliases.md)        | Zod at storage boundaries, no rename aliases    | Accepted                 |
| [029](./029-mdn-and-google-style-guide-adoption.md)                | MDN and Google style guide adoption             | Accepted                 |
| [030](./030-ship-only-audited-referenced-primitives.md)            | Ship only audited, referenced primitives        | Accepted                 |
| [031](./031-zod-mini-on-the-entry-path.md)                         | zod/mini in the client                          | Accepted                 |
| [032](./032-internationalization-is-opt-in.md)                     | Internationalization is opt-in                  | Accepted                 |
| [033](./033-comment-placement-policy.md)                           | Comment placement policy                        | Accepted                 |
| [034](./034-telemetry-posture.md)                                  | Telemetry posture                               | Accepted                 |
| [035](./035-hono-on-workers-not-nitro.md)                          | Hono on Workers, not Nitro                      | Accepted                 |
| [036](./036-static-shell-not-ssr.md)                               | Static shell, not SSR, for first paint          | Accepted                 |
| [037](./037-template-scope.md)                                     | Template scope: what this starter will not add  | Accepted                 |
| [038](./038-happy-dom-until-real-browser-apis.md)                  | happy-dom until a test needs real-browser APIs  | Accepted                 |
| [039](./039-git-cliff-not-changesets.md)                           | git-cliff for the changelog, not Changesets     | Accepted                 |
| [040](./040-two-typescript-projects-not-five.md)                   | Two TypeScript projects, not five               | Accepted                 |
| [041](./041-patina-color-way.md)                                   | Patina as the color way                         | Accepted                 |
