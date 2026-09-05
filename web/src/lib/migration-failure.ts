import { ApiProblem } from "@/lib/api-problem";
import { createSupportId } from "@/lib/support-id";

/**
 * A failure the reviewer can act on.
 *
 * Three parts, always in this order: what happened (title), why plus what to do
 * (message), and an identifier they can quote (supportId). A message with only
 * the first part is the "Something went wrong" failure this type exists to
 * prevent.
 *
 * The cause is never invented here. The server knows why a workbook was
 * rejected and says so in the problem detail; this only adds the recovery step,
 * which the server cannot know.
 */
export type MigrationFailure = {
	title: string;
	message: string;
	supportId: string;
	/** False when retrying the same request cannot change the outcome. */
	retryable: boolean;
};

// A rejected workbook is the one failure whose detail is worth reading in full:
// it names the sheet and column that did not match. Recognised so the recovery
// step can talk about the file rather than about the network.
const SHAPE_HINTS = [
	"sheet",
	"header",
	"column",
	"workbook",
	"missing",
	"unexpected",
];

function looksLikeShapeRejection(detail: string): boolean {
	const lower = detail.toLowerCase();
	return SHAPE_HINTS.some((hint) => lower.includes(hint));
}

function endWithStop(text: string): string {
	return /[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;
}

export function describeMigrationFailure(error: unknown): MigrationFailure {
	if (!navigator.onLine) {
		return {
			title: "You are offline",
			message:
				"The workbench could not reach the server. Nothing was changed. Reconnect and retry; no decision or approval is recorded while offline.",
			supportId: createSupportId(),
			retryable: true,
		};
	}

	if (error instanceof ApiProblem) {
		const { status, detail, requestId } = error;

		if (status === 0 || status === 503) {
			return {
				title: "The server did not answer",
				message: `${endWithStop(detail)} Nothing was changed. Retry, and if it keeps failing check that the API is running on port 8080.`,
				supportId: requestId,
				retryable: true,
			};
		}

		if (status === 501) {
			return {
				title: "Not wired up yet",
				message: `${endWithStop(detail)} This part of the workbench is not built, so there is nothing to retry.`,
				supportId: requestId,
				retryable: false,
			};
		}

		if (status === 404) {
			return {
				title: "That batch is no longer here",
				message:
					"It may have been superseded by a newer ingest of the same workbook. Reload the migration to pick up the current batches.",
				supportId: requestId,
				retryable: true,
			};
		}

		if (status >= 400 && status < 500) {
			return looksLikeShapeRejection(detail)
				? {
						title: "That workbook is not the shape we expect",
						message: `${endWithStop(detail)} Nothing was ingested, so the migration is unchanged. Check that you picked the right file, and that its sheets and header row match the reference pack.`,
						supportId: requestId,
						retryable: false,
					}
				: {
						title: "The request was rejected",
						message: `${endWithStop(detail)} Nothing was changed.`,
						supportId: requestId,
						retryable: false,
					};
		}

		// 5xx: the detail may carry internals, so it stays behind the support ID.
		return {
			title: "The server failed on that request",
			message:
				"Nothing was changed. Retry once; if it fails again, quote the reference below so the run can be traced in the server log.",
			supportId: requestId,
			retryable: true,
		};
	}

	// fetch rejects with a TypeError when the request never reached a server.
	if (error instanceof TypeError) {
		return {
			title: "The request never reached the server",
			message:
				"Nothing was changed. Check that the API is running on port 8080, then retry.",
			supportId: createSupportId(),
			retryable: true,
		};
	}

	return {
		title: "Something failed on that step",
		message:
			"Nothing was changed. Retry once; if it fails again, quote the reference below.",
		supportId: createSupportId(),
		retryable: true,
	};
}
