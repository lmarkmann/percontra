import type { Batch, Overview, Receipt } from "./migration-client";

import { expect, test } from "vitest";

import {
	blastRadius,
	boundDecisionRows,
	completedSteps,
	reviewQueueEmptiness,
	staleBatches,
} from "./desk-state";

type ReleaseState = "approved" | "stale" | "draft" | "revoked";

function batch(id: string, state: ReleaseState | null): Batch {
	return {
		id,
		key: { legal_entity: `Entity ${id}`, source_batch_id: id },
		rows: 10,
		statuses: { ready: 10 },
		release:
			state === null
				? null
				: {
						release_id: `r-${id}`,
						batch_key: { legal_entity: `Entity ${id}`, source_batch_id: id },
						state,
						bound_decisions: [],
						mapping_snapshot_digest: "d",
						posting_ids: [],
						approved_by: "A reviewer",
						approved_at: "2026-09-05T10:00:00Z",
						state_changed_at: "2026-09-05T10:00:00Z",
						state_reason: "",
					},
		totals: {},
	};
}

function overview(batches: Batch[], gaps: Overview["gaps"] = []): Overview {
	return { loaded: true, source_count: 33902, batches, gaps };
}

test("only a stale release counts as stale; approved and draft do not", () => {
	const result = staleBatches(
		overview([batch("a", "approved"), batch("b", "stale"), batch("c", null)]),
	);
	expect(result).toEqual(["Entity b / batch b"]);
});

test("no overview means nothing is stale, not a crash", () => {
	expect(staleBatches(null)).toEqual([]);
});

test("an unloaded migration is empty because nothing was brought in", () => {
	expect(reviewQueueEmptiness(null, false)).toBe("unloaded");
	expect(reviewQueueEmptiness({ ...overview([]), loaded: false }, false)).toBe(
		"unloaded",
	);
});

test("a loaded migration with no gaps left is the goal state, not an absence", () => {
	expect(reviewQueueEmptiness(overview([]), false)).toBe("resolved");
});

test("the same emptiness reads differently when a filter caused it", () => {
	expect(reviewQueueEmptiness(overview([]), true)).toBe("filtered");
});

function receipt(state: Receipt["state"]): Receipt {
	return {
		submission_id: `s-${state}`,
		company: "Chalbury Co-Invest L.P.",
		state,
		doc_names: [],
		artifact_digest: "d",
		response_digest: null,
		verified_at: null,
		posted_at: null,
		detail: "",
	};
}

test("an unloaded handover leaves every step unfilled", () => {
	expect(completedSteps(null, null, [])).toEqual([]);
	expect(completedSteps({ ...overview([]), loaded: false }, null, [])).toEqual(
		[],
	);
});

test("each gate fills exactly its own step", () => {
	const loaded = overview([]);
	expect(completedSteps(loaded, null, [])).toEqual(["step-handover"]);
	expect(completedSteps(loaded, batch("a", null), [])).toEqual([
		"step-handover",
		"step-review",
	]);
	expect(completedSteps(loaded, batch("a", "approved"), [])).toEqual([
		"step-handover",
		"step-review",
		"step-signoff",
	]);
	expect(
		completedSteps(loaded, batch("a", "approved"), [receipt("verified")]),
	).toEqual([
		"step-handover",
		"step-review",
		"step-signoff",
		"step-acceptance",
	]);
});

test("a receipt that did not reach the destination does not fill acceptance", () => {
	expect(
		completedSteps(overview([]), batch("a", "approved"), [
			receipt("submitted"),
		]),
	).toEqual(["step-handover", "step-review", "step-signoff"]);
});

function decision(id: string, version: number, target: string, author: string) {
	return {
		decision_id: id,
		version,
		gap: {
			source_gl_account: "40070",
			source_trans_type: "Bank Fees",
			affected_source_refs: [],
		},
		target: {
			gl_account: "60010",
			trans_type: target,
			corvus_ref: {
				file_name: "corvus.xlsx",
				file_digest: "f",
				sheet: "Corvus",
				physical_row: 1,
			},
		},
		author,
		reason: "because",
		decided_at: `2026-09-06T10:0${version}:00Z`,
		supersedes: version === 1 ? null : version - 1,
	};
}

function gap(
	id: string,
	versions: number,
	entities: string[],
): Overview["gaps"][number] {
	return {
		row: 2,
		values: { GL_Account: "40070", Trans_Type: "Bank Fees" },
		affected: 11,
		entities,
		history: Array.from({ length: versions }, (_, index) =>
			decision(
				id,
				index + 1,
				index === 0 ? "Bank fees" : "Professional fees",
				index === 0 ? "Riad" : "Luis",
			),
		),
	};
}

function bound(
	id: string,
	state: ReleaseState,
	decisionId: string,
	version: number,
): Batch {
	const row = batch(id, state);
	row.release!.bound_decisions = [{ decision_id: decisionId, version }];
	return row;
}

test("a bound decision at its signed version reads as unchanged", () => {
	const rows = boundDecisionRows(
		overview([], [gap("d1", 1, ["Entity a"])]),
		bound("a", "approved", "d1", 1).release!,
	);
	expect(rows).toHaveLength(1);
	expect(rows[0]?.diverged).toBe(false);
	expect(rows[0]?.label).toBe("40070 / Bank Fees");
});

test("a newer version than the one signed reads as diverged, with both sides", () => {
	const [row] = boundDecisionRows(
		overview([], [gap("d1", 2, ["Entity a"])]),
		bound("a", "stale", "d1", 1).release!,
	);
	expect(row?.diverged).toBe(true);
	expect(row?.signedTarget).toBe("Bank fees");
	expect(row?.nowTarget).toBe("Professional fees");
	expect(row?.nowBy).toBe("Luis");
});

test("a bound id the overview does not know is skipped, never thrown", () => {
	expect(
		boundDecisionRows(
			overview([], []),
			bound("a", "approved", "ghost", 1).release!,
		),
	).toEqual([]);
});

test("recording a new version stales only approvals bound to that decision", () => {
	const radius = blastRadius(
		overview(
			[
				bound("a", "approved", "d1", 1),
				bound("b", "approved", "other", 1),
				batch("c", null),
			],
			[gap("d1", 1, ["Entity a", "Entity c"])],
		),
		gap("d1", 1, ["Entity a", "Entity c"]),
	);
	expect(radius.willStale.map((row) => row.id)).toEqual(["a"]);
	expect(radius.unaffected.map((row) => row.id)).toEqual(["b"]);
	expect(radius.notYetApproved.map((row) => row.id)).toEqual(["c"]);
});

test("an unresolved gap has no decision id, so nothing can go stale", () => {
	const radius = blastRadius(
		overview([bound("a", "approved", "d1", 1)], []),
		gap("d1", 0, ["Entity a"]),
	);
	expect(radius.willStale).toEqual([]);
	expect(radius.unaffected.map((row) => row.id)).toEqual(["a"]);
});
