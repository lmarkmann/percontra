# Ubiquitous language - vite-template

Domain terms for this starter (not catalys-lite). Use consistently in copy, component names, and docs.

| Term                   | Meaning                                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primitive**          | A shadcn/ui component in `src/components/ui/` - owned source, CLI-updated via `pnpm exec shadcn add`.                                        |
| **Chat primitive**     | Conversation-layer component in `src/components/ui/chat/`. Import from `@/components/ui/chat`.                                               |
| **Showcase**           | The in-app design preview on `/showcase`: `src/routes/showcase.tsx` and `src/components/showcase/*`. Lazy-loaded; product home lives on `/`. |
| **Token**              | OKLCH CSS variable in `src/index.css` (`--primary`, `--shadow-elevated`, etc.) consumed as Tailwind semantics.                               |
| **Accent**             | The single verdigris primary (Patina, `oklch` ~162 hue) reserved for CTAs and focus rings - not decorative color.                            |
| **Conversation layer** | Composed chat UI: `MessageScroller` -> `Message` -> `Bubble` / `Attachment` / `Marker`.                                                      |
| **Transport**          | The data layer behind chat (API, `@ai-sdk/react`, mocked script) - deliberately outside primitives.                                          |
| **Surface**            | A composed UI area (showcase section, route, card) built from primitives.                                                                    |
| **State matrix**       | Per-surface coverage of idle, loading, empty, error, partial - see `states-showcase.tsx`.                                                    |
| **Preset**             | shadcn CLI v4 design-system code (`b0` = base-nova neutral) from [shadcn/create](https://ui.shadcn.com/create).                              |
| **Surface variant**    | Paint prop (`variant`) on `Button` / `Bubble` - see [variants.md](./variants.md).                                                            |
| **Lifecycle state**    | Upload/sync prop (`state`) on `Attachment` - not a surface variant.                                                                          |
| **Seam**               | A swappable module in `src/lib/` (`auth`, `session`, `analytics`, `chat-transport`); see [architecture.md](../architecture.md).              |

## Out of scope terms (catalys-lite only)

GOÄ, Mahnwesen, PADnext, Befund, Versandt, Gezahlt - do not use in this template.
