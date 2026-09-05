# Field

Form composition primitive wrapping `Label`, control, description, and error.

## Anatomy

```
FieldGroup
  Field
    FieldLabel
    Input | Textarea
    FieldDescription
    FieldError
```

## Invalid state

Set `data-invalid="true"` on `Field` and `aria-invalid` on the control. Shared `invalid-ring` utility styles the input.

## Do

- Use `FieldDescription` for hints, `FieldError` for validation messages
- Keep one `Field` per label/control pair

## Don't

- Duplicate label text in placeholders when `FieldLabel` is present
