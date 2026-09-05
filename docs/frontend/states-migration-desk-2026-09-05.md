# States: migration desk, 2026-09-05

Inventory lane over `web/src/features/migration/migration-desk.tsx` and the
surfaces it owns. Every state below is rendered at `/states` without a server;
that route is how they get reviewed, and it is why the failure classifier takes
an error rather than a preformatted string.

## Inventory

| Surface | Component | idle | loading | empty | error | partial | conflict | offline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Migration overview | `src/features/migration/migration-desk.tsx#MigrationDesk` | designed | designed | designed | designed | missing | N.A. | designed |
| Review queue | `src/components/review-queue-empty.tsx#ReviewQueueEmpty` | designed | designed | designed | designed | N.A. | N.A. | designed |
| Postings table | `src/features/migration/migration-desk.tsx#MigrationDesk` | designed | designed | designed | designed | missing | N.A. | designed |
| Stale approvals | `src/components/stale-banner.tsx#StaleBanner` | designed | N.A. | designed | N.A. | N.A. | designed | N.A. |
| Amount evidence | `src/features/migration/evidence-dialog.tsx#EvidenceDialog` | designed | missing | N.A. | designed | N.A. | N.A. | designed |

N.A. justifications:

- **conflict** on read surfaces: the overview and the postings table are
  read-only projections. The one genuine conflict in this product is a decision
  changing under an approval, and that is not a merge dialog, it is the stale
  state; it has its own row.
- **loading** on the stale banner: it is derived from the overview that is
  already loaded, so it has no fetch of its own.
- **empty / partial** on the evidence dialog: it only opens from an amount that
  exists, so there is no empty case, and its four sections come from one
  response.
- **offline** on the stale banner: nothing to fetch.

## What was wrong

| Before | After | Why |
| --- | --- | --- |
| `busy`, `error`, `notice` as three independent strings | one `DeskActivity` union | The three could all be truthy at once, so the surface could claim it was loading, had failed, and had succeeded simultaneously. A union cannot express that. |
| `overview: Overview \| null` | `OverviewState` union | `null` conflated "still loading", "the load failed" and "loaded and genuinely empty". Those are three different screens. |
| `postings: Posting[]` plus `total: number` | `PostingsState` union | Same conflation one level down, and it produced the bug below. |
| `postings.length === 0` rendered "Loading postings..." | separate loading, empty and failed branches | A batch that legitimately generated no postings reported itself as loading, forever. |
| Errors surfaced as `failure.message` from a bare `Error` | `describeMigrationFailure` returning title, message, support id, retryable | The client threw away the HTTP status, so every failure read the same and none said what to do about it. |
| `readApi` threw `new Error(detail)` | throws `ApiProblem` | The status is what separates a malformed workbook from an outage; discarding it made a specific error state impossible. |
| No empty state on the review queue | `ReviewQueueEmpty` with three causes | Unloaded, resolved and filtered need three different next actions. "Every gap has a decision" is the goal state, not an absence. |
| No stale surface at all | `StaleBanner`, `role="alert"` | The product exists to catch a decision changing under an approval. It was not on screen. |
| No loading placeholder | `MigrationSkeleton` via `LoadingSurface` | A status line over an empty frame reads as broken on a 34,000-row ingest. |
| `posting.status.replaceAll("_", " ")` | `StatusMark` plus `statusRowClass` | The raw wire value, with no icon, no colour and no row tint, against a brief that fixes six statuses each carrying a word and an icon. |
| Amounts in plain figures | `tabular-nums` on the amount cell | Brief requirement; digits did not align down the column. |
| `bg-muted` skeletons | `bg-skeleton`, its own token | `--muted` and `--card` resolve to the same value in both themes, so every skeleton on a card was invisible. Found by looking at the rendered page, not by reading the CSS. |

## Boundaries

Which mechanism owns which failure, per iron rule 9:

- **Anticipated failures** (rejected fetch, problem+json, transport) are values:
  they become `DeskActivity.failed`, `OverviewState.failed` or
  `PostingsState.failed` and render through `ErrorState`. No render-time throw
  is involved and there is no `threw` union member.
- **Render-time throws** are caught by the app-level `ErrorBoundary` in
  `src/main.tsx`, which wraps the whole router subtree.
- **Async and handler throws** reach the unions above through the `act()`
  wrapper and the `.catch` on the postings effect; neither relies on a boundary.

There is no route-level boundary between the app boundary and the desk, so a
throw inside `MigrationDesk` takes the whole page to the fallback rather than
just the panel. That is on the still-at-risk list.

## Proven

Every state, and how it is reached without a backend:

| State | Where to look | Test |
| --- | --- | --- |
| Overview loading | `/states`, Loading | `LoadingSurface` covered by its own suite |
| Overview failed | `/states`, Failures | `src/lib/migration-failure.test.ts` |
| Review queue unloaded / resolved / filtered | `/states`, Empty review queue | `src/components/review-queue-empty.test.tsx` |
| Stale approvals, one and many | `/states`, Stale approvals | `src/components/stale-banner.test.tsx` |
| Malformed workbook | `/states`, Failures | `migration-failure.test.ts` |
| Server failure, 501, 404, transport | `/states`, Failures | `migration-failure.test.ts` |
| Offline | classifier branch | `migration-failure.test.ts` |
| Status vocabulary, all six | `/states`, Status vocabulary | `src/lib/posting-status.test.ts` |
| Emptiness and staleness derivation | n/a, pure | `src/features/migration/desk-state.test.ts` |

Both themes checked in the browser at `/states`. The skeleton defect above was
found that way and would not have been found by reading the code.

## Still at risk

- **Partial is missing on the overview and the postings table.** The desk
  fetches `overview`, `adapters` and `submissions` together and one failure
  fails all three, so a working overview is hidden when only `submissions` is
  down. Needs the three calls settled independently before a per-tile error
  makes sense.
- **No route-level error boundary.** A throw inside the desk takes the whole
  page down. One boundary per route panel is the fix.
- **Offline is classified but not prevented.** `describeMigrationFailure`
  reports it correctly after the fact, and `OfflineBanner` is mounted at the
  root, but write actions are not disabled while offline and nothing is queued.
  For this product that may be correct (a decision recorded offline and lost is
  worse than a blocked button), but it is a decision nobody has taken yet.
- **The evidence dialog has no loading state.** It opens through
  `act("Opening evidence", ...)`, so the desk-level activity line covers it, but
  the dialog itself pops fully formed with no in-place placeholder.
- **`/states` is not gated.** It is `noindex` and unlinked, but it ships in the
  production bundle as a lazy route. Worth a build-time gate if the deployed
  demo should not expose it.
