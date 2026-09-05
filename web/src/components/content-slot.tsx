import type { ReactNode } from "react";

import { AnimatePresence, m } from "motion/react";

import { cellCrossfade, cellSettle } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ContentSlotMode = "crossfade" | "settle";

type ContentSlotProps = {
	/** Stable key for the active resource state (e.g. loading, ready, empty). */
	slotKey: string;
	/**
	 * `crossfade`: opacity only (loading ↔ ready).
	 * `settle`: opacity + 4px Y (ready to empty/error).
	 */
	mode?: ContentSlotMode;
	children: ReactNode;
	className?: string;
};

/**
 * In-slot state transitions: frame chrome stays still; only this cell animates.
 * Parent must provide LazyMotion (`MotionShell` or test LazyMotion). Prefer
 * `mode="wait"` so exit finishes (~75%) before the next enter.
 */
export function ContentSlot({
	slotKey,
	mode = "crossfade",
	children,
	className,
}: ContentSlotProps) {
	const presence = mode === "settle" ? cellSettle : cellCrossfade;

	return (
		<div className={cn("relative min-w-0", className)} data-content-slot="">
			<AnimatePresence mode="wait" initial={false}>
				<m.div
					key={slotKey}
					className="min-w-0"
					initial={presence.initial}
					animate={presence.animate}
					exit={presence.exit}
					transition={presence.transition}
				>
					{children}
				</m.div>
			</AnimatePresence>
		</div>
	);
}
