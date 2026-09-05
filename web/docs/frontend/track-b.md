# Track B: vite-template adaptation

Mapped from catalys-lite `FRONTEND_PLAN` clusters. Static primitives stay in `ChatShowcase`; features land in `src/features/`.

| Cluster         | catalys-lite          | vite-template                                        | Status  |
| --------------- | --------------------- | ---------------------------------------------------- | ------- |
| **B1 Feedback** | FeedbackBar           | `sonner` toasts on chat send, attach, error retry    | Done    |
| **B4 Upload**   | Route upload          | Pending attachment in composer (`state=idle`)        | Done    |
| **B5 Chat UX**  | Invoice/chat surfaces | `ChatFeature` + `chat-transport.ts` scripted replies | Done    |
| B2 Disputes     | InvoiceView           | N/A - product-only                                   | Skipped |
| B3 Materials    | GoaeCard              | N/A                                                  | Skipped |
| B6 Mahnflow     | Timeline chips        | N/A                                                  | Skipped |

## Integration rules (from plan)

1. Primitives unchanged: `ChatShowcase` remains the static reference.
2. Track A standards applied: empty/skeleton states, a11y labels, token semantics.
3. Transport isolated in `src/lib/chat-transport.ts`. Swap for `@ai-sdk/react` or fetch on first real API.

## Next consumer step

Replace `sendChatMessage` with your API client; keep `ChatFeature` composition intact.
