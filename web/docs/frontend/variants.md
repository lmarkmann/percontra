# Variant contract - vite-template

Prop naming rules for `src/components/ui/*`. Keeps surface paint, lifecycle, and layout concerns separate.

## Prop namespaces

| Prop      | Meaning                                            | Used on                                  |
| --------- | -------------------------------------------------- | ---------------------------------------- |
| `variant` | Surface paint (background, border, shadow)         | `Button`, `Bubble`, `Message`            |
| `status`  | Semantic meaning (success, warning, error...)      | `StatusPill`                             |
| `state`   | Lifecycle / upload progress                        | `Attachment`                             |
| `layout`  | Structural presentation                            | `Marker`                                 |
| `type`    | Content shape (icon vs image vs default)           | `EmptyMedia`, `AttachmentMedia`          |
| `align`   | Flow direction (`start` / `end`) or addon position | `Message`, `Bubble`, `InputGroupAddon`   |
| `size`    | Dimensional scale                                  | `Button`, `Avatar`, `Card`, `Attachment` |

## Surface variants (shared vocabulary)

Used by `Button` and `Bubble` unless noted:

| Variant       | Use when                                                      |
| ------------- | ------------------------------------------------------------- |
| `default`     | Primary filled surface (CTA, user message bubble)             |
| `secondary`   | Neutral filled, secondary actions                             |
| `outline`     | Bordered / elevated surface (`shadow-border`)                 |
| `ghost`       | No background until hover; inline chrome                      |
| `destructive` | Dangerous or error-adjacent actions                           |
| `link`        | Text-only navigation                                          |
| `muted`       | Low-emphasis fill (`Button` + `Bubble` - assistant messages)  |
| `tinted`      | Primary-tinted wash (`Bubble` only - uses `--surface-tinted`) |

## Size scale

| Token     | Button height | Avatar | Notes                     |
| --------- | ------------- | ------ | ------------------------- |
| `xs`      | 24px (`h-6`)  | -      | InputGroupButton default  |
| `sm`      | 28px (`h-7`)  | 24px   |                           |
| `default` | 32px (`h-8`)  | 32px   | Form controls match `h-8` |
| `lg`      | 36px (`h-9`)  | 40px   |                           |

Icon sizes: `icon-xs` (24), `icon-sm` (28), `icon` / default (32), `icon-lg` (36).

## Shared utilities

Defined in `src/index.css`:

- `focus-ring` - focus-visible border + ring
- `invalid-ring` - aria-invalid border + ring (+ dark variants)
- `icon-default` - 16px lucide default sizing

Form control recipes live in `src/lib/form-control.ts`.

## Layout tokens (conversation layer)

| Token                      | Utility                                | Value                         |
| -------------------------- | -------------------------------------- | ----------------------------- |
| `--height-chat-panel`      | `h-chat-panel`                         | 35rem                         |
| `--max-width-bubble`       | `max-w-bubble`                         | 80%                           |
| `--ring-width`             | (documented)                           | 3px - matches `ring-3`        |
| `--spacing-message-meta`   | `px-message-meta`                      | Message header/footer padding |
| `--spacing-bubble-x/y`     | `px-bubble-x`, `py-bubble-y`           | Bubble content padding        |
| `--spacing-message-group`  | `gap-message-group`                    | Scroller content gap          |
| `--radius-inner-sm/md`     | `rounded-inner-sm`, `rounded-inner-md` | Nested control radii          |
| `--size-attachment-media*` | `size-attachment-media`                | Attachment media box          |
