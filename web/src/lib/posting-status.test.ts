import type { Posting, Release } from "@/contract/migration";

import { expect, test } from "vitest";

import { POSTING_STATUSES, postingStatus } from "@/lib/posting-status";

function posting(status: Posting["status"]): Posting {
	return {
		contract_version: 1,
		posting_id: "p1",
		batch_key: {
			legal_entity: "Chalbury Co-Invest L.P.",
			source_batch_id: "639661",
		},
		source_refs: [],
		source_identity: {
			legal_entity: "Chalbury Co-Invest L.P.",
			vehicle: "",
			batch_id: "639661",
			je_index: "1",
			transaction_index: "1",
			rfx_id: "",
			occurrence_index: 0,
		},
		mappings_used: [],
		decisions_used: [],
		status,
		destination: null,
		warnings: [],
	};
}

function release(state: Release["state"]): Release {
	return {
		release_id: "r1",
		batch_key: {
			legal_entity: "Chalbury Co-Invest L.P.",
			source_batch_id: "639661",
		},
		state,
		bound_decisions: [],
		mapping_snapshot_digest: "d",
		posting_ids: ["p1"],
		approved_by: "A reviewer",
		approved_at: "2026-09-05T10:00:00Z",
		state_changed_at: "2026-09-05T10:00:00Z",
		state_reason: "",
	};
}

test("the vocabulary is the brief's six, in the brief's order", () => {
	expect([...POSTING_STATUSES]).toEqual([
		"ready",
		"needs-decision",
		"blocked",
		"stale",
		"approved",
		"exported",
	]);
});

test("wire statuses map onto the reviewer's vocabulary", () => {
	expect(postingStatus(posting("ready"))).toBe("ready");
	expect(postingStatus(posting("needs_decision"))).toBe("needs-decision");
	expect(postingStatus(posting("blocked"))).toBe("blocked");
	expect(postingStatus(posting("stale"))).toBe("stale");
});

test("an approved release promotes its ready postings to approved", () => {
	expect(postingStatus(posting("ready"), release("approved"))).toBe("approved");
});

test("an export outranks approval, because the rows have already left", () => {
	expect(postingStatus(posting("ready"), release("approved"), true)).toBe(
		"exported",
	);
});

test("a stale release outranks every other reading", () => {
	expect(postingStatus(posting("ready"), release("stale"), true)).toBe("stale");
	expect(postingStatus(posting("blocked"), release("stale"))).toBe("stale");
});

test("a release never rescues a posting that cannot be generated", () => {
	expect(postingStatus(posting("blocked"), release("approved"))).toBe(
		"blocked",
	);
	expect(postingStatus(posting("needs_decision"), release("approved"))).toBe(
		"needs-decision",
	);
});
