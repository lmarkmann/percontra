import type { ReactNode } from "react";

import { useLoadingEscalation } from "@/hooks/use-loading-escalation";
import { cn } from "@/lib/utils";

type LoadingSurfaceProps = {
	active: boolean;
	/** Layout-matched skeleton; only rendered after the delay. */
	skeleton: ReactNode;
	/** Optional pre-delay placeholder (status text). Null avoids flash. */
	early?: ReactNode;
	/** Copy shown after the slow threshold (~5s). */
	slowMessage?: string;
	className?: string;
};

/**
 * Loading contract: hide under ~200ms, skeleton matching final layout that
 * stays at least `minVisibleMs` once shown (no flash either way), escalate
 * past 5s with slowMessage. Prefer this over a centered spinner. Pair with
 * `ContentSlot` so the skeleton occupies the same cell as ready content
 * (frame still, work moves).
 */
export function LoadingSurface({
	active,
	skeleton,
	early = null,
	slowMessage,
	className,
}: LoadingSurfaceProps) {
	const { showSkeleton, isSlow } = useLoadingEscalation(active);

	// Skeleton outlives `active` while the minimum-visible hold runs.
	if (showSkeleton) {
		return (
			<div className={cn("flex flex-col gap-3", className)} aria-busy="true">
				{skeleton}
				{isSlow && slowMessage ? (
					<p className="text-label text-muted-foreground">{slowMessage}</p>
				) : null}
			</div>
		);
	}

	if (!active) {
		return null;
	}

	return early ? (
		<div aria-busy="true" className={className}>
			{early}
		</div>
	) : null;
}
