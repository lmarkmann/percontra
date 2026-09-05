# Composition Spec - vite-template

Durable **what** between [brief.md](./brief.md) (why) and implementation (how). Lives under `docs/frontend/` (not `.frontend/`; brief §6). Append-mostly: new surfaces get a new section; edit a section only when composition decisions change.

Motion values are owned by the motion spine (`src/lib/motion.ts`, `--motion-*` tokens). This file names **where** motion is allowed, not durations or easings. Character default: **standard** (brief principle 4).

**Frame still, work moves:** shells, rails, kickers, and headers are static. Resource state changes use `ContentSlot` in a fixed body cell (`cellCrossfade` for loading/ready; `cellSettle` for empty/error). No route-level page fades.

Contract refs point at [variants.md](./variants.md), [glossary.md](./glossary.md), and [components/](./components/).

---

## Surface: App shell

### Composition

**Recipe:** shared chrome for every routed view  
**Why:** One offline signal and skip path for the whole app so features do not invent their own (brief §6 states foundation).

### Layout skeleton

Desktop / Mobile (identical stack)

```
┌──────────────────────────────────────────────┐
│ [SkipLink - focus only]                      │
│ [OfflineBanner - when offline]               │
├──────────────────────────────────────────────┤
│  <Outlet: route main>                        │
└──────────────────────────────────────────────┘
```

### Component inventory

| Region  | Component                | Contract ref              |
| ------- | ------------------------ | ------------------------- |
| a11y    | SkipLink                 | components (skip-link)    |
| network | OfflineBanner            | components/offline-banner |
| body    | route `<main id="main">` | every surface             |

### State lattice

| State                   | Required / Optional / N-A | Notes                                           |
| ----------------------- | ------------------------- | ----------------------------------------------- |
| idle                    | Required                  | online, banner hidden                           |
| offline                 | Required                  | shell banner; features may still disable writes |
| loading                 | N-A                       | route-owned                                     |
| empty / error / partial | N-A                       | route-owned                                     |
| conflict / success      | N-A                       | route-owned                                     |

### Acceptance bar

- [x] Skip link targets `#main` on every route shell
- [x] Offline banner appears once at shell (`role="status"`, `aria-live="polite"`)
- [x] Features do not ship a second full-width offline strip

### Motion

- Shell chrome: CSS only; no JS enter/exit on the banner
- Skip link: focus-visible only

---

## Surface: Home (`/`)

### Composition

**Recipe:** product-forward lander (kicker, display title, one primary + one secondary CTA)  
**Why:** Success metric is five-minute recognition of a coherent system; lander is the first paint (brief §4).

### Layout skeleton

Desktop

```
┌──────────────────────────────────────────────┐
│ [mono kicker]               [ThemeToggleLean]│  ← hairline border-x rail
├──────────────────────────────────────────────┤
│  display title (outcome headline)            │
│  prose body (font-prose, max-w-prose)        │
│  [Primary CTA]  [Secondary outline CTA]      │
│  ─────────────────────────────────────────   │
│  mono version chip                           │
└──────────────────────────────────────────────┘
```

Mobile: same single column; CTAs wrap.

### Component inventory

| Region       | Component                        | Contract ref                 |
| ------------ | -------------------------------- | ---------------------------- |
| header       | mono kicker + ThemeToggleLean    | theme-toggle-lean            |
| hero         | h1 + font-prose description      | type scale (display / title) |
| actions      | Button default + outline as Link | components/button            |
| footer motif | mono version chip                | home.versionChip             |

### State lattice

| State                                        | Required / Optional / N-A | Notes              |
| -------------------------------------------- | ------------------------- | ------------------ |
| idle / ready                                 | Required                  | static lander      |
| loading                                      | N-A                       | no data fetch      |
| empty / error / partial / offline / conflict | N-A                       | shell owns offline |

### Acceptance bar

- [x] Static shell in `index.html` mirrors kicker / title / description / CTAs for first paint
- [x] One primary CTA (showcase); secondary is outline (login)
- [x] Prefetch on focus and hover for showcase and login
- [x] Lean theme toggle (no tooltip) keeps entry JS small

### Motion

- CSS hover/press on buttons only (`duration-fast`, press scale from button primitive)
- No scroll reveals on `/`

---

## Surface: Showcase (`/showcase`)

### Composition

**Recipe:** design-system preview (scroll sections + lazy Motion shell)  
**Why:** Primitive verification without Storybook (ADR-3; brief out of scope).

### Layout skeleton

Desktop

```
┌──────────────────────────────────────────────┐
│ [kicker]                         [ThemeToggle]│
├──────────────────────────────────────────────┤
│  HeroSection                                 │
│  Button / Bubble / Attachment / Avatar ...   │
│  Form / Overlay / Status                     │
│  StatesShowcase (7-state lattice)            │
│  ChatFeature                                 │
│  TypeScale                                   │
└──────────────────────────────────────────────┘
```

Mobile: single column, section gap-16.

### Component inventory

| Region    | Component          | Contract ref                  |
| --------- | ------------------ | ----------------------------- |
| shell     | MotionShell (lazy) | lib/motion character.standard |
| sections  | showcase/*         | per section                   |
| states    | StatesShowcase     | view-state lattice            |
| chat demo | ChatFeature        | Surface: Chat feature         |

### State lattice

| State                                                  | Required / Optional / N-A | Notes                               |
| ------------------------------------------------------ | ------------------------- | ----------------------------------- |
| ready                                                  | Required                  | static demo data                    |
| loading / empty / error / partial / conflict / offline | Required                  | demonstrated in StatesShowcase tabs |
| idle                                                   | Optional                  | idle not a tab; ready is rest       |

### Acceptance bar

- [x] Full lattice in StatesShowcase (ready, loading, empty, error, partial, conflict, offline)
- [x] MotionShell lazy; entry path does not pay for Motion
- [x] ThemeToggle full (tooltip + lucide) allowed here; home stays lean
- [ ] E2E visual snapshots green after polish delta

### Motion

- Character: **standard** via MotionConfig on MotionShell
- Allowed: section FadeIn / group stagger, panelPresence for occasional UI, icon swaps
- Not allowed: continuous idle float, bounce easing, confetti

---

## Surface: Login (`/login`)

### Composition

**Recipe:** auth form with mutation phase + shared ErrorState  
**Why:** Protected routes need a demo auth path; WorkOS is optional seam (env).

### Layout skeleton

Desktop

```
┌──────────────────────────────────────────────┐
│  title                                       │
│  description + first-run / WorkOS hint       │
│  [ErrorState panel if failed]                │
│  form: email Field + submit                  │
│  or WorkOsLoginButton (lazy when configured) │
└──────────────────────────────────────────────┘
```

Mobile: same; form max-w-md.

### Component inventory

| Region | Component               | Contract ref                      |
| ------ | ----------------------- | --------------------------------- |
| copy   | title + body            | i18n login.*                      |
| error  | ErrorState layout=panel | components/error-state            |
| form   | Input + Button          | components/field (target), button |
| seam   | WorkOsLoginButton       | optional auth                     |

### State lattice

| State                      | Required / Optional / N-A | Notes                                                    |
| -------------------------- | ------------------------- | -------------------------------------------------------- |
| idle                       | Required                  | form editable                                            |
| submitting                 | Required                  | MutationPhase submitting; button loading                 |
| failed                     | Required                  | ErrorState with retry -> idle; support ID                |
| field error                | Required                  | stays on field, not ErrorState                           |
| offline                    | Optional                  | shell banner; submit still disabled by network if needed |
| empty / partial / conflict | N-A                       |                                                          |

### Acceptance bar

- [x] Zod email validation with field-level message
- [x] Demo fail path when email contains `fail`
- [x] Shared ErrorState (title, message, ID, retry, copy)
- [x] Prefetch dashboard on mount
- [x] Submit uses Button `loading` (not only disabled + label swap)

### Motion

- CSS button press/hover only
- No JS presence on the form

---

## Surface: Dashboard (`/dashboard`)

### Composition

**Recipe:** authenticated resource view with full ResourceResult lattice  
**Why:** Template reference for loaders and non-happy paths (brief §6 StatesShowcase + view-state).

### Layout skeleton

Desktop

```
┌──────────────────────────────────────────────┐
│  title + description          [Sign out]     │
│  view switches (?debug=1 matrix links)       │
├──────────────────────────────────────────────┤
│  empty | filtered | forbidden | conflict |   │
│  error | partial | ready body                │
└──────────────────────────────────────────────┘
```

Mobile: header stacks; project grid 1 col then sm:2.

### Component inventory

| Region    | Component                                       | Contract ref                 |
| --------- | ----------------------------------------------- | ---------------------------- |
| chrome    | h1, sign out Button                             | button outline               |
| loading   | LoadingSurface + Skeleton                       | components/loading-surface   |
| empty     | Empty + primary create                          | ui/empty                     |
| filtered  | Empty + clear filters CTA                       | ui/empty                     |
| forbidden | PermissionDenied + home CTA                     | components/permission-denied |
| conflict  | dual draft cards + keep yours/theirs            | StatusPill + Button          |
| error     | ErrorState                                      | components/error-state       |
| partial   | StatusPill + cards + Marker retry + MetricValue | metric-value                 |
| ready     | project cards                                   | card / tile                  |

### State lattice

| State     | Required / Optional / N-A | Notes                                                 |
| --------- | ------------------------- | ----------------------------------------------------- |
| loading   | Required                  | navigation loading; hide <200ms then skeleton         |
| empty     | Required                  | dashed Empty + create CTA                             |
| filtered  | Required                  | empty with filter label + clear to ready              |
| forbidden | Required                  | PermissionDenied; primary navigates home (not retry)  |
| conflict  | Required                  | two versions; keep yours/theirs to ready (demo)       |
| error     | Required                  | ErrorState + retry to ready view                      |
| partial   | Required                  | warning pill; failed slice retry; MetricValue unknown |
| ready     | Required                  | project grid                                          |
| offline   | Optional                  | shell banner                                          |
| success   | N-A                       | ready is success                                      |

### Demo switches (`?debug=1`)

| `?view=`    | Result                           |
| ----------- | -------------------------------- |
| (default)   | empty                            |
| `ready`     | filled projects                  |
| `partial`   | projects + failed activity slice |
| `error`     | ErrorState                       |
| `forbidden` | PermissionDenied                 |
| `filtered`  | filter empty                     |
| `conflict`  | dual-version picker              |

### Acceptance bar

- [x] Loader driven by `?view=` for demo lattice
- [x] LoadingSurface with slow escalation copy
- [x] ErrorState + support ID + retry
- [x] MetricValue never invents 0 for unknown
- [x] Project tiles use Card hover elevation (polish)
- [x] First ready card slightly differentiated as primary metric treatment
- [x] PermissionDenied for 403-class (no same-resource retry)
- [x] Filtered empty + clear filters
- [x] Conflict dual-version demo

### Motion

- CSS transitions on buttons and cards only
- Skeletons: static pulse from Skeleton primitive; no Motion dependency

---

## Surface: Chat feature (`/showcase` Chat section)

### Composition

**Recipe:** composed chat card (scroller + composer + attachment + transport errors)  
**Why:** Track B demo of conversation primitives with scripted transport (track-b.md).

### Layout skeleton

Desktop

```
┌──────────────────────────────────────────────┐
│ CardHeader: title + description              │
├──────────────────────────────────────────────┤
│ MessageScroller                              │
│   empty | messages | thinking marker         │
│   inline ErrorState on transport failed      │
├──────────────────────────────────────────────┤
│ pending Attachment chip (optional)           │
│ InputGroup composer + attach + send          │
└──────────────────────────────────────────────┘
```

Mobile: full-width card; scroller height constrained.

### Component inventory

| Region   | Component                | Contract ref           |
| -------- | ------------------------ | ---------------------- |
| frame    | Card                     | ui/card                |
| thread   | Message*, Bubble, Avatar | components/bubble      |
| empty    | Empty compose CTA        | ui/empty               |
| error    | ErrorState layout=inline | components/error-state |
| attach   | Attachment*              | components/attachment  |
| composer | InputGroup + Buttons     | input-group, button    |

### State lattice

| State              | Required / Optional / N-A | Notes                             |
| ------------------ | ------------------------- | --------------------------------- |
| idle / ready       | Required                  | messages or empty                 |
| submitting         | Required                  | thinking marker; send disabled    |
| failed             | Required                  | inline ErrorState + retry payload |
| empty              | Required                  | first-run empty with compose      |
| offline            | Required                  | send disabled; shell banner also  |
| loading            | Optional                  | no initial fetch                  |
| partial / conflict | N-A                       |                                   |

### Acceptance bar

- [x] Scripted transport; fail keyword path
- [x] Shared ErrorState inline for transport
- [x] Sonner success on reply
- [x] Offline disables send
- [x] panelPresence for occasional markers (motion spine)

### Motion

- panelPresence / AnimatePresence for thinking marker and attachment chip only
- Message list: no per-message bounce; scroller is layout not spectacle

---

## Surface: Not found (`*`)

### Composition

**Recipe:** empty-pattern 404 with single home CTA  
**Why:** Router `*` + SPA not_found_handling; static `public/404.html` is non-GET fallback only.

### Layout skeleton

```
┌──────────────────────────────────────────────┐
│           Empty (icon + title + body)        │
│              [Back home primary]             │
└──────────────────────────────────────────────┘
```

### Component inventory

| Region | Component              | Contract ref     |
| ------ | ---------------------- | ---------------- |
| body   | Empty + Button as Link | ui/empty, button |

### State lattice

| State      | Required / Optional / N-A | Notes                              |
| ---------- | ------------------------- | ---------------------------------- |
| empty      | Required                  | the whole surface is empty-pattern |
| all others | N-A                       |                                    |

### Acceptance bar

- [x] One primary CTA to `/`
- [x] No competing secondary actions
- [x] `id="main"` for skip link

### Motion

- CSS button only

---

## Surface: Error boundary (render throw)

### Composition

**Recipe:** full-page recovery (not field, not transport)  
**Why:** Class boundary in main provider tree; copy + reload + copy details.

### Layout skeleton

```
┌──────────────────────────────────────────────┐
│  title                                       │
│  message                                     │
│  [Reload] [Copy details]                     │
└──────────────────────────────────────────────┘
```

### Component inventory

| Region  | Component     | Contract ref       |
| ------- | ------------- | ------------------ |
| page    | ErrorBoundary | error-boundary.tsx |
| actions | Button        | button             |

### State lattice

| State      | Required / Optional / N-A | Notes                       |
| ---------- | ------------------------- | --------------------------- |
| error      | Required                  | only state this surface has |
| all others | N-A                       |                             |

### Acceptance bar

- [x] Styled fallback, not blank root
- [x] No PII in copied details by default
- [ ] Prefer shared ErrorState visual language where props allow (polish follow-up)

### Motion

- None

---

## Cross-cutting: state primitives

These are not routes; every resource surface reuses them.

| Primitive                                        | Role                           | Spec owner                 |
| ------------------------------------------------ | ------------------------------ | -------------------------- |
| `ViewState` / `ResourceResult` / `MutationPhase` | Vocabulary                     | `src/lib/view-state.ts`    |
| `ErrorState`                                     | cause + recovery + support ID  | components/error-state     |
| `LoadingSurface`                                 | delay -> skeleton -> slow copy | components/loading-surface |
| `MetricValue`                                    | unknown = `-`, never fake 0    | components/metric-value    |
| `OfflineBanner`                                  | shell offline once             | components/offline-banner  |

Lattice order: idle -> loading -> empty | ready | partial | error | offline. Conflict is write/collab only. Success is ready, not a separate column.

---

## How this file is used

- **Discover:** read after brief.md; do not re-derive composition when a surface section exists.
- **Build / craft:** green the surface acceptance bar before calling the surface done.
- **Polish:** checklist runs against these layouts; motion skill owns timing.
- **Finalize:** bar items + brief §6 are the definition of done.

When motion character or a layout recipe changes, update the affected surface section and add a brief §6 learned line if it is a project-level rule.
