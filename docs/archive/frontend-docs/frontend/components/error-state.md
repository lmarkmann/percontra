# ErrorState

Shared three-part error surface: what happened, why, what to do (retry + copy support ID).

Import from `@/components/error-state`.

## Layouts

| layout            | Use                                             |
| ----------------- | ----------------------------------------------- |
| `panel` (default) | Page and card-level failures (login, dashboard) |
| `inline`          | Thread / composer failures (chat transport)     |

## Contract

- Always pass `title`, `message`, `supportId`
- `onRetry` optional; omit when recovery is navigation-only
- Field validation stays on the field; do not route zod issues through ErrorState
- `role="alert"` is set on the root

## Do

- Use for server, network, and transport failures
- Keep support ID copyable; toast message is optional

## Don't

- Use for empty data (use Empty)
- Invent a second offline strip (use OfflineBanner at shell)
