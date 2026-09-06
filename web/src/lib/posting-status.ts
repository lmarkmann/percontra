import type { Posting, Release } from "@/contract/migration";

/**
 * The six statuses a reviewer sees, fixed by docs/frontend/brief.md.
 *
 * Wider than the wire: `Posting.status` carries four values, `approved` comes
 * from a Release and `exported` from an Export record. Deriving them here keeps
 * one vocabulary in the UI instead of three, and the order below is the brief's
 * order, which is also the order the overview counts render in.
 *
 * Never render one of these as colour alone. Every status owes a word and an
 * icon as well, because the palette collapses under forced-colors and roughly
 * one reviewer in twelve cannot separate the red from the green.
 */
export const POSTING_STATUSES = [
	"ready",
	"needs-decision",
	"blocked",
	"stale",
	"approved",
	"exported",
] as const;

export type PostingStatus = (typeof POSTING_STATUSES)[number];

const WIRE_STATUS: Record<Posting["status"], PostingStatus> = {
	ready: "ready",
	needs_decision: "needs-decision",
	blocked: "blocked",
	stale: "stale",
};

export const STATUS_LABEL: Record<PostingStatus, string> = {
	ready: "Ready",
	"needs-decision": "Needs decision",
	blocked: "Blocked",
	stale: "Stale",
	approved: "Approved",
	exported: "Exported",
};

/**
 * Sort rank for the review table: rows owing the reviewer action float to the
 * top of the scroll cage, resolved rows sink. Stale outranks everything
 * because that is the state the product exists to catch.
 */
export const ATTENTION_RANK: Record<PostingStatus, number> = {
	stale: 0,
	blocked: 1,
	"needs-decision": 2,
	ready: 3,
	approved: 4,
	exported: 5,
};

/** Qualifier the brief attaches to a status, shown beside the label. */
export const STATUS_NOTE: Partial<Record<PostingStatus, string>> = {
	exported: "destination not checked",
};

/**
 * A posting's status as the reviewer reads it, which outranks the posting's own
 * field: an approved release makes its postings approved, and an export makes
 * them exported, neither of which the posting record knows about. A stale
 * release beats both, because that is the state the product exists to catch.
 */
export function postingStatus(
	posting: Posting,
	release?: Release | null,
	exported = false,
): PostingStatus {
	if (release?.state === "stale") return "stale";
	if (posting.status !== "ready") return WIRE_STATUS[posting.status];
	if (exported) return "exported";
	if (release?.state === "approved") return "approved";
	return "ready";
}
