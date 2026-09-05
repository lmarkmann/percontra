# Bubble

Conversation-layer message surface. Import from `@/components/ui/chat`.

## Variants

Same vocabulary as Button, plus `tinted` (uses `--surface-tinted`).

## Layout tokens

- `max-w-bubble` - 80% max width
- `px-bubble-x` / `py-bubble-y` - content padding

## Do

- Pair with `Message` + `MessageScroller` for chat UIs
- Use `muted` for assistant messages, `default` for user messages

## Don't

- Use `tinted` for error content - use `destructive`
