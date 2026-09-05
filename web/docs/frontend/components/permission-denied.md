# PermissionDenied

403-class empty surface. Not a transport error: primary action should leave the resource or request access, never "retry" the same forbidden load.

## Props

| Prop                                | Role                                       |
| ----------------------------------- | ------------------------------------------ |
| `title` / `description`             | Required copy                              |
| `resource`                          | Optional named resource in the description |
| `primaryAction` / `secondaryAction` | React nodes (usually Button + Link)        |
| `icon`                              | Lucide icon, default `Lock`                |
| `data-testid`                       | Default `permission-denied`                |

## Composition

Uses `Empty` / `EmptyHeader` / `EmptyMedia` / `EmptyTitle` / `EmptyDescription` / `EmptyContent` from `ui/empty`. Dashed border shell matches other non-happy empties.

## Demo

`/dashboard?view=forbidden&debug=1` after demo sign-in.
