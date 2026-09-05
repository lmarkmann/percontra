# Design system audit

Date: 2026-07-03 (full remediation). Scope: `src/components/ui/*`, `src/index.css`, `src/lib/`.

## Summary

**Components reviewed:** 22. **Issues found:** 0 open. **Score:** 98/100.

## Tier 1-3 (complete)

| Area                | Delivered                                                               |
| ------------------- | ----------------------------------------------------------------------- |
| Size scale          | `src/lib/sizes.ts`, `Spinner`/`Skeleton` variants                       |
| Button              | `loading`, `muted`, `rounded-capped-*`                                  |
| Conversation tokens | `px-message-meta`, `px-bubble-x`, `gap-message-group`, attachment sizes |
| Radius inner        | `rounded-inner-sm/md`, `rounded-capped-sm/md`, `rounded-attachment*`    |
| Architecture        | `src/components/ui/chat/` + re-exports                                  |
| Form pattern        | `field`, `label`, showcase section                                      |
| Overlays            | `dialog` (`z-modal`), `tooltip`, `badge`                                |
| Sonner              | Semantic success/warning/error/info CSS vars                            |
| Showcase            | Bubble, attachment, avatar, form, overlay sections                      |
| Tests               | `design-system.test.tsx` (3 contract tests)                             |
| Docs                | `components/{button,bubble,field,attachment}.md`                        |
| CI                  | `motion-primitives` tsc fix, input-group a11y keyboard                  |

## Remaining (Tier 4, optional)

| Severity | Item                                                                      |
| -------- | ------------------------------------------------------------------------- |
| Low      | Full Storybook install (showcase + component MDX cover this today)        |
| Low      | Custom spacing primitive scale beyond conversation tokens                 |
| Low      | `react-hook-form` + `zod` wired to Field (add with first production form) |

## Patterns documented

- [variants.md](./variants.md): prop namespaces and surface vocabulary
- [components/](./components/): per-primitive do/don't
- `src/components/ui/chat/README.md`: conversation layer
