# LoadingSurface

Loading contract for resource views. Prefer this over a centered spinner.

Import from `@/components/loading-surface`.

## Behavior

1. Under ~200ms: render `early` only (or nothing)
2. After delay: layout-matched `skeleton`
3. After ~5s: show `slowMessage` under the skeleton

## Do

- Match skeleton geometry to the ready layout
- Pass `active` from navigation or query loading flags

## Don't

- Put Motion enter animations on the skeleton (CSS Skeleton pulse only)
- Flash a full spinner for sub-200ms loads
