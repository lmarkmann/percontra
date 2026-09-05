# Post-Storybook UI plan: vite-template progress

Adapted from `frontend-skills/catalys/POST_STORYBOOK_UI_PLAN.md`.

| Phase                         | Work                                   | Status | Notes                                                                                       |
| ----------------------------- | -------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| **0** Design preview gate     | showcase + E2E                         | Done   | In-app showcase on `/`; Storybook removed (ADR-3)                                           |
| **PS-1** Anchor               | brief, tokens, glossary                | Done   | `docs/frontend/brief.md`, `token-audit.md`, `glossary.md`                                   |
| **PS-2** Primitive polish     | tokens, type, color, motion            | Done   | Tokens, button, card hover, motion budget, audit doc                                        |
| **PS-3** Track A              | FRONTEND_PLAN A1-A5 (adapted)          | Done   | Theme flash already handled; added `empty`/`skeleton`; a11y labels on sections              |
| **PS-4** State language       | unhappy states, hardening              | Done   | `states-showcase.tsx` matrix                                                                |
| **PS-5** Structure            | extract, distill                       | Done   | App split into `showcase/*` sections; removed scroll FadeIn clutter                         |
| **PS-6** Copy                 | microcopy pass                         | Done   | Actionable empty/error copy; header reads "Design system preview"                           |
| **PS-7** Composed polish      | critique, polish                       | Done   | Card elevation hover; see `assessments.md`                                                  |
| **PS-7b** Spec + state polish | composition spec, state surface polish | Done   | `spec.md`; ErrorState / OfflineBanner / MetricValue / dashboard tiles / login loading       |
| **PS-8** Track B              | FRONTEND_PLAN B (adapted)              | Done   | B1 sonner, B4 attach, B5 `ChatFeature`; see `track-b.md`                                    |
| **PS-9** Ship gate            | audit, a11y review, E2E                | Done   | 12 E2E specs; summary in `assessments.md`                                                   |
| **PS-10** Gap board           | multi-skill perfect pass               | Done   | `template-gaps.md`; static shell sync; EmptyTitle h2; hover-fine buttons; badge transitions |
| **PS-11** Gap implementation  | improvement-plan.md                    | Done   | type 18/20/30; favicon/OG; permission/filtered/conflict; motion character; de core i18n     |

## Gate commands

```sh
pnpm build && pnpm test:run && pnpm lint
```
