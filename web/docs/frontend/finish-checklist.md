# Finish checklist (anti-patterns)

Use before calling a surface ship-ready. Drawn from marketing ship fails (Cloudflare marketing teardown: contrast, tab order, motion CPU), not as new features.

## Contrast

- [ ] Body and muted text meet **WCAG 1.4.3** AA against their surfaces (light and dark).
- [ ] Primary and destructive controls keep legible labels on hover/disabled.
- [ ] Status color is never the only signal (pair with text or icon).

## Tab order and keyboard

- [ ] Tab order follows visual reading order; no surprise jumps into offscreen chrome.
- [ ] Interactive elements are reachable without a mouse; custom widgets use expected keys (tabs: arrows; dialogs: Esc).
- [ ] Focus is visible via `focus-ring` / `:focus-visible`; no bare `outline-none` without a replacement.
- [ ] Skip link reaches `#main`; main content is focusable when landed on.

## Motion and CPU

- [ ] Motion is punctuation: hover/press CSS first; JS enter/exit only for occasional UI.
- [ ] No continuous decorative animation on product routes (scroll spectacle stays marketing/showcase only).
- [ ] `prefers-reduced-motion` is honored; skeleton pulse is `motion-safe`.
- [ ] Loading spinners may keep animating; large blur, filter, or layout thrash loops do not.

## Quick verify

```sh
pnpm lint && pnpm test:run && pnpm test:e2e
```

Manual: keyboard-only pass on login, dashboard, chat, showcase; flip system reduced-motion and recheck spinners vs decorative motion.

## Optional agent tooling (outside the app)

Not product dependencies. Use when an agent should audit or polish UI:

- `npx react-doctor` (React code health)
- `npx ui-skills` (Ibelick motion/UI polish)
- animations.dev Claude skill (motion review)
- text-to-lottie / Lottie harness when brand motion assets are needed
