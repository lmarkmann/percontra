import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

type StaleBannerProps = {
	/** Batches whose approval no longer covers the decisions they were bound to. */
	batchLabels: readonly string[];
	onReview?: () => void;
};

/**
 * The product's whole reason for existing, said out loud.
 *
 * A decision changed after an approval was recorded, so the approval no longer
 * covers what would be exported. This is not a warning the reviewer may dismiss:
 * the export is withheld until the affected batches are approved again, and the
 * banner says so rather than letting a disabled button explain itself.
 *
 * role="alert" rather than "status": it appears as the result of someone else's
 * edit, so a reviewer who is not looking at this region still needs to hear it.
 */
export function StaleBanner({ batchLabels, onReview }: StaleBannerProps) {
	if (batchLabels.length === 0) return null;

	const count = batchLabels.length;
	return (
		<div
			role="alert"
			data-slot="stale-banner"
			className="flex flex-wrap items-start gap-3 rounded-lg border border-status-stale-mark/40 bg-status-stale-tint p-3.5"
		>
			<CircleAlert
				aria-hidden="true"
				className="mt-0.5 size-4 shrink-0 text-status-stale-mark"
			/>
			<div className="min-w-0 flex-1 space-y-1">
				<p className="text-caption font-medium text-status-stale-fg">
					Export withheld:{" "}
					{count === 1 ? "an approval is" : `${count} approvals are`} out of
					date
				</p>
				<p className="text-caption text-muted-foreground">
					A mapping decision changed after{" "}
					{count === 1 ? "this batch was" : "these batches were"} approved, so
					the approval no longer covers what would leave. Approve again to
					release {count === 1 ? "it" : "them"}.
				</p>
				<p className="text-label text-muted-foreground">
					{batchLabels.join(", ")}
				</p>
			</div>
			{onReview ? (
				<Button variant="outline" size="sm" onClick={onReview}>
					Review the change
				</Button>
			) : null}
		</div>
	);
}
