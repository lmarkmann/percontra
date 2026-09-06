import type {
	Batch,
	Gap,
	Overview,
	Posting,
	Receipt,
} from "./migration-client";
import type { Release } from "@/contract/migration";
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
 * Step ids whose gate has passed, so the rail can fill them in. Each gate is
 * the state its step's own action leaves behind, so the rail answers "where am
 * I in the review" off the current state instead of re-parsing the sections.
 */
export function completedSteps(
	overview: Overview | null,
	batch: Batch | null,
	receipts: Receipt[],
): string[] {
	const done: string[] = [];
	if (overview?.loaded) done.push("step-handover");
	if (batch) done.push("step-review");
	if (batch?.release?.state === "approved") done.push("step-signoff");
	if (receipts.some((receipt) => receipt.state === "verified")) {
		done.push("step-acceptance");
	}
	return done;
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

/** One bound decision as the approval saw it beside its latest version. */
export type BoundDecisionRow = {
	label: string;
	signedVersion: number;
	signedTarget: string;
	signedBy: string;
	nowVersion: number;
	nowTarget: string;
	nowBy: string;
	nowAt: string;
	diverged: boolean;
};

function gapLabel(gap: Gap): string {
	return `${gap.values.GL_Account ?? ""} / ${gap.values.Trans_Type ?? ""}`;
}

/**
 * The per contra view of a release: each decision the approval was granted on
 * against the version that exists now. A bound id with no gap in the overview
 * is skipped rather than thrown, because the overview is a projection and the
 * approval is the record.
 */
export function boundDecisionRows(
	overview: Overview,
	release: Release,
): BoundDecisionRow[] {
	const rows: BoundDecisionRow[] = [];
	for (const bound of release.bound_decisions) {
		const gap = overview.gaps.find((candidate) =>
			candidate.history.some(
				(decision) => decision.decision_id === bound.decision_id,
			),
		);
		const signed = gap?.history.find(
			(decision) => decision.version === bound.version,
		);
		const now = gap?.history.at(-1);
		if (!gap || !signed || !now) continue;
		rows.push({
			label: gapLabel(gap),
			signedVersion: signed.version,
			signedTarget: signed.target.trans_type,
			signedBy: signed.author,
			nowVersion: now.version,
			nowTarget: now.target.trans_type,
			nowBy: now.author,
			nowAt: now.decided_at,
			diverged: now.version !== signed.version,
		});
	}
	return rows;
}

/** What recording a new version of a gap's decision does to each approval. */
export type BlastRadius = {
	willStale: Batch[];
	unaffected: Batch[];
	notYetApproved: Batch[];
};

export function blastRadius(overview: Overview, gap: Gap): BlastRadius {
	const decisionId = gap.history.at(-1)?.decision_id;
	const radius: BlastRadius = {
		willStale: [],
		unaffected: [],
		notYetApproved: [],
	};
	for (const batch of overview.batches) {
		const bound =
			decisionId !== undefined &&
			batch.release?.state === "approved" &&
			batch.release.bound_decisions.some(
				(ref) => ref.decision_id === decisionId,
			);
		if (bound) radius.willStale.push(batch);
		else if (batch.release) radius.unaffected.push(batch);
		else if (gap.entities.includes(batch.key.legal_entity)) {
			radius.notYetApproved.push(batch);
		}
	}
	return radius;
}
