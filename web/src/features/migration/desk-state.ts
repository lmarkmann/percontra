import type { Batch, Overview, Posting } from "./migration-client";
import type { MigrationFailure } from "@/lib/migration-failure";

/**
 * What the desk is doing, as one value.
 *
 * Previously three independent strings (`busy`, `error`, `notice`), which let
 * the surface claim it was loading, had failed, and had succeeded at the same
 * time. A union cannot express that, so the impossible combinations stop being
 * something the render has to defend against.
 */
export type DeskActivity =
	| { tag: "idle" }
	| { tag: "working"; label: string }
	| { tag: "done"; notice: string }
	| { tag: "failed"; failure: MigrationFailure };

/**
 * Whether the overview has arrived.
 *
 * `Overview | null` could not tell "still loading" from "the load failed" from
 * "loaded, and there is genuinely nothing in it", and those are three different
 * screens for the reviewer.
 */
export type OverviewState =
	| { tag: "loading" }
	| { tag: "ready"; overview: Overview }
	| { tag: "failed"; failure: MigrationFailure };

/**
 * The postings page for the selected batch. Kept apart from OverviewState
 * because it reloads on its own (batch, offset, revision) while the overview
 * stays put, and because "no postings yet" and "this batch has none" are not
 * the same sentence.
 */
export type PostingsState =
	| { tag: "loading" }
	| { tag: "ready"; items: Posting[]; total: number }
	| { tag: "failed"; failure: MigrationFailure };

export const IDLE: DeskActivity = { tag: "idle" };
export const LOADING_POSTINGS: PostingsState = { tag: "loading" };
export const LOADING_OVERVIEW: OverviewState = { tag: "loading" };

/** A batch label a reviewer would recognise, for banners and lists. */
function batchLabel(batch: Batch): string {
	return `${batch.key.legal_entity} / batch ${batch.key.source_batch_id}`;
}

/**
 * Batches whose recorded approval no longer covers the decisions it was bound
 * to. This is the condition the product exists to catch, so it is computed in
 * one place and read by both the banner and the export gate.
 */
export function staleBatches(overview: Overview | null): string[] {
	if (!overview) return [];
	return overview.batches
		.filter((batch) => batch.release?.state === "stale")
		.map(batchLabel);
}

/**
 * Why the review queue is empty, which decides what the reviewer should do.
 * `null` means it is not empty and the queue should render.
 */
export function reviewQueueEmptiness(
	overview: Overview | null,
	filtered: boolean,
): "unloaded" | "resolved" | "filtered" | null {
	if (!overview?.loaded) return "unloaded";
	if (overview.gaps.length > 0) return null;
	return filtered ? "filtered" : "resolved";
}
