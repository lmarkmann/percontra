# OfflineBanner

App-shell offline strip. One instance under RootLayout.

Import from `@/components/offline-banner`.

## Contract

- Driven by `useOnlineStatus`
- `role="status"` + `aria-live="polite"`
- Features may disable writes; they must not add another full-width offline banner

## Do

- Keep copy calm and actionable (queue / sync framing)

## Don't

- Use destructive styling for routine disconnects
