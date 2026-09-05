# Design Brief - vite-template

## 1. Product purpose

Personal starter for design-forward websites - ships Vite, React, Tailwind v4, shadcn (Base UI), and a token spine so new projects begin with craft defaults instead of generic AI-startup chrome.

## 2. Primary user

A solo developer or small team spinning up a marketing site or lightweight product UI on a laptop, iterating in the browser, deploying to Cloudflare Workers Static Assets.

## 3. Principles

1. **Add on first need, not at init.** Dependencies and components land when a real feature requires them - the template stays lean and opinionated.
2. **Typography carries hierarchy.** Inter runs the interface; Charter carries prose (`font-prose`, system Charter stack). Color and decoration are secondary to type rhythm and whitespace. Display type fluid-scales via `--text-display` clamp.
3. **One accent, ninety percent neutral.** A single intentional accent color; status semantics only where data demands them. No gradient heroes, no decorative color pills.
4. **Motion is punctuation, not spectacle.** Character **standard**: CSS hover/press always; JS enter/exit only for occasional UI (modals, panels, chat markers). Marketing scroll reveals stay on `/showcase`. Respect `prefers-reduced-motion` at every layer; loading spinners keep animating. **Frame still, work moves:** route chrome (rails, kickers, headers, theme controls) never animates; content cells crossfade or settle in place (`ContentSlot`, `cellCrossfade` / `cellSettle`).
5. **Tokens before arbitrary values.** OKLCH CSS variables in `src/index.css` are the source of truth; components consume semantics, not raw hex.

## 4. Success metric

A developer clones the template, runs `pnpm dev`, and within five minutes recognizes a coherent visual system - readable type, working dark mode, polished button states - without ripping out default styling first.

## 5. Out of scope

- Full product surfaces (dashboards, admin consoles, multi-route apps) - add `react-router` on the second view.
- Storybook or component-catalog infrastructure - primitive verification happens via the in-app showcase until a consumer project adds Storybook.
- Magic UI / Aceternity-style animated kits and second component libraries.
- German copy, PHI, or domain-specific medical billing flows (catalys-lite concerns do not apply here).
- Net-new feature ports (FRONTEND_PLAN Track B) - this repo is the starter, not the product.

## 6. Learned constraints

- **2026-07-03** - Post-Storybook UI plan adapted without Storybook; primitive polish runs against `App.tsx` showcase and `components/ui/*` directly. _Why:_ user exercises frontend-skills phases on this template before catalys-lite.
- **2026-07-03** - UI craft notes live in `docs/frontend/`, not `.frontend/`. _Why:_ keep design docs alongside project documentation.
- **2026-07-03** - `StatesShowcase` is the **Data view** reference for loading / empty / error. _Why:_ catalys plan's RueckmeldungenView pattern, adapted for template.
- **2026-07-09** - UI states foundation: `lib/view-state.ts` + `ErrorState` / `LoadingSurface` / `MetricValue` / `OfflineBanner`; showcase covers the full 7-state lattice. _Why:_ template was not wired for non-happy paths as a shared system; routes re-invented error and loading markup.
- **2026-07-09** - Motion foundation: canonical `--motion-*` / ease tokens; `lib/motion.ts` character registers + presence presets; `MotionShell` stays lazy on showcase with `character.standard`. _Why:_ durations/easings were incomplete and misnamed (`--ease-out` was emphasized); template needs a general, copyable spine without putting Motion on the entry path.
- **2026-07-09** - Composition ground truth is `docs/frontend/spec.md` (all product surfaces + state lattice). Component contracts for ErrorState / LoadingSurface / MetricValue / OfflineBanner live under `docs/frontend/components/`. _Why:_ ui-pipeline detected missing spec while states and motion landed; brief alone is not a build bar.
- **2026-07-09** - Card fine-pointer hover uses `@custom-variant hover-fine` (hover + fine pointer) with `shadow-border-hover` and `-translate-y-px`; durations stay on `duration-fast` / `ease-out` tokens. _Why:_ polish checklist requires rest/hover/active without sticky touch hover.
- **2026-07-09** - Foundation: Charter restored as **prose-only** (`font-prose` / `--font-serif`); headings stay Inter. Tracking tokens `--tracking-display|title|label`; z stack includes tooltip above toast; code surfaces use scale tokens not ad-hoc rem. _Why:_ brief principle 2 and live `font-prose` call sites were unbacked after the July 3 slimming pass.
- **2026-07-09** - UI critique pass: product chrome on home/login/dashboard, hairline page rail, editorial showcase figures, Charter prose token, dashboard ready hierarchy + activity list, demo states behind `?debug=1`. _Why:_ mode-1 review flagged scaffold copy and flat catalog rhythm.
- **2026-07-09** - Multi-skill perfect pass (foundation / states / motion / polish): static shell resynced; badge no `transition-all`; EmptyTitle is `h2`; button hover uses `hover-fine`; skeleton pulse is `motion-safe`; theme-color + description meta; living gap board at `docs/frontend/template-gaps.md`. _Why:_ template must make missing product work obvious without looking unfinished as a starter.
- **2026-07-09** - Gap-board implementation: intermediate type tokens; brand favicon + OG; dashboard forbidden/filtered/conflict demos; `PermissionDenied`; motion character showcase; `en`/`de` core with EN fallback + `LocaleSwitch`. Plan: `docs/frontend/improvement-plan.md`.
- **2026-07-09** - ui-review + ui-polish pass: product and primitive hovers gated to `hover-fine`; table/activity row tints; login submit uses `loading` spinner; locale chip hit area expanded; hero titles `hyphens-none`; login hint demoted to caption hierarchy. _Why:_ capture at 1280/768/375 showed sticky-touch risk and missing interaction feedback on lists.
- **2026-07-13** - General Translation, the German catalog, and locale controls were removed. The template is English-only and internationalization is a product-specific addition (ADR 032).
- **2026-07-09** - make-interfaces-feel-better pass: no `transition-all`; press scale 0.96; hit areas on all button sizes; CSS `IconSwap` (opacity/scale 0.25/blur 4px); `image-outline` utility; concentric demo radii. _Why:_ craft checklist gaps on shipped primitives.
- **2026-07-09** - In-slot settle preference: frame still / work moves; `ContentSlot` + `cellCrossfade`/`cellSettle`; dashboard chrome static while body crossfades; skeleton matches ready geometry. _Why:_ product motion should read as competence, not page theater.
- **2026-07-09** - Panel chrome uses `shadow-border` / `shadow-elevated` / `shadow-floating` instead of hard `border` / `ring-1 ring-foreground/10`. Inputs and dashed empty states keep real borders. _Why:_ shadows adapt to light/dark; solid borders read as dirt.
- **2026-08-02** - Type is gated, not merely documented: `docs/frontend/type-spec.md` justifies both faces, and `scripts/type-spec-gate.ts` (prek hook on `src/styles/*.css`, `src/fonts/`, the spec) fails the commit for any family the spec does not name. Inter is argued as a starter's neutral control condition, explicitly not as a product argument, with the replace step now a fork checklist item. Inter and Charter measured 13.5% apart on x-height, which is why the register split reads at all; `font-size-adjust: 0.546` is the fix if a fork ever sets them inline. _Why:_ the template shipped two faces with their justification living only in whatever conversation chose them, and guidance that names no artifact cannot tell a decision from a default.
