# Button

Primary action primitive. Surface variants align with [variants.md](../variants.md).

## Variants

`default`, `secondary`, `muted`, `outline`, `ghost`, `destructive`, `link`

## Sizes

`xs`, `sm`, `default`, `lg`, `icon-xs`, `icon-sm`, `icon`, `icon-lg`

## Loading

```tsx
<Button loading>Saving...</Button>
```

Sets `aria-busy`, disables interaction, and renders `Spinner` sized to the button.

## Do

- Use `default` for one primary CTA per surface
- Use `muted` for low-emphasis fills (parity with Bubble `muted`)

## Don't

- Stack multiple `default` buttons in one row
- Use `destructive` for non-destructive actions
