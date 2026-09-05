import { CircleCheck, FileSpreadsheet, FilterX } from "lucide-react";

import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

/**
 * Why the queue is empty decides what the reviewer should do next, so the three
 * causes are three different screens rather than one "No results".
 *
 * - `unloaded`: no migration has been ingested, so there is nothing to review.
 * - `resolved`: every documented gap has a recorded decision. This is the goal
 *   state, not an absence, and it says so.
 * - `filtered`: rows exist but the current filter hides them, so the fix is to
 *   clear the filter rather than to load anything.
 */
type ReviewQueueEmptyProps = {
	reason: "unloaded" | "resolved" | "filtered";
	onClearFilter?: () => void;
	onLoad?: () => void;
	onRelease?: () => void;
};

export function ReviewQueueEmpty({
	reason,
	onClearFilter,
	onLoad,
	onRelease,
}: ReviewQueueEmptyProps) {
	if (reason === "unloaded") {
		return (
			<Empty data-slot="review-queue-empty" data-reason="unloaded">
				<EmptyHeader>
					<EmptyMedia type="icon">
						<FileSpreadsheet aria-hidden="true" className="size-4" />
					</EmptyMedia>
					<EmptyTitle>No migration loaded</EmptyTitle>
					<EmptyDescription>
						Bring in a handover pack and the decisions it needs will be listed
						here, grouped by the accounting question behind them.
					</EmptyDescription>
				</EmptyHeader>
				{onLoad ? (
					<EmptyContent>
						<button type="button" className="underline" onClick={onLoad}>
							Load the example pack
						</button>
					</EmptyContent>
				) : null}
			</Empty>
		);
	}

	if (reason === "filtered") {
		return (
			<Empty data-slot="review-queue-empty" data-reason="filtered">
				<EmptyHeader>
					<EmptyMedia type="icon">
						<FilterX aria-hidden="true" className="size-4" />
					</EmptyMedia>
					<EmptyTitle>No rows match this filter</EmptyTitle>
					<EmptyDescription>
						There are decisions outstanding, but none of them match what you are
						filtering on.
					</EmptyDescription>
				</EmptyHeader>
				{onClearFilter ? (
					<EmptyContent>
						<button type="button" className="underline" onClick={onClearFilter}>
							Clear the filter
						</button>
					</EmptyContent>
				) : null}
			</Empty>
		);
	}

	return (
		<Empty data-slot="review-queue-empty" data-reason="resolved">
			<EmptyHeader>
				<EmptyMedia type="icon">
					<CircleCheck
						aria-hidden="true"
						className="size-4 text-status-approved-mark"
					/>
				</EmptyMedia>
				<EmptyTitle>Every gap has a decision</EmptyTitle>
				<EmptyDescription>
					Nothing in this migration is waiting on a reviewer. Each decision
					carries its author and reason, and changing one will send the batches
					that relied on it back for approval.
				</EmptyDescription>
			</EmptyHeader>
			{onRelease ? (
				<EmptyContent>
					<button type="button" className="underline" onClick={onRelease}>
						Go to the release check
					</button>
				</EmptyContent>
			) : null}
		</Empty>
	);
}
