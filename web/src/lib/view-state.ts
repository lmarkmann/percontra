/**
 * Shared vocabulary for non-happy UI states.
 * Prefer these tags over boolean soup (`isLoading && !error && data`).
 *
 * Lattice (inventory order): idle -> loading -> empty | ready | partial | error | offline
 * Conflict is write/collab-only; success feedback is the ready path, not a separate column.
 */

/** Full inventory lattice including shell and write concerns. */
/** @public - state vocabulary the review and release surfaces tag against. */
export type ViewState =
	| "idle"
	| "loading"
	| "empty"
	| "ready"
	| "error"
	| "partial"
	| "conflict"
	| "offline";

/** Resource load result for read surfaces (loaders, queries). */
/** @public */
export type ResourceResult<TData, TPartial = TData> =
	| { status: "empty" }
	| { status: "ready"; data: TData }
	| { status: "partial"; data: TPartial; failed: readonly string[] }
	| { status: "error"; supportId: string; message: string };

/** Mutation / transport phase for write surfaces. */
/** @public - write phase for decision approval and export. */
export type MutationPhase<TRetry = undefined> =
	| { type: "idle" }
	| { type: "submitting" }
	| {
			type: "failed";
			supportId: string;
			message: string;
			retry?: TRetry;
	  };

/** Placeholder for unknown metric values; never N/A, null, 0, or an em dash. */
export const UNKNOWN_METRIC = "-" as const;
