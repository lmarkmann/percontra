import type { Batch, Overview } from "./migration-client";

import { expect, test } from "vitest";

import { reviewQueueEmptiness, staleBatches } from "./desk-state";

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

test("a queue with gaps is not empty and renders its rows", () => {
	const gaps = [
		{ row: 2, values: {}, affected: 14, entities: ["Entity a"], history: [] },
	];
	expect(reviewQueueEmptiness(overview([], gaps), false)).toBeNull();
});
