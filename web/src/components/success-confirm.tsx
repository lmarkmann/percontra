import { Check } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

import { MOTION_DURATION, MOTION_EASE, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

type SuccessConfirmProps = {
	show: boolean;
	className?: string;
	label?: string;
};

/**
 * Subtle success punctuation (not confetti): scale-in check when a primary action completes.
 */
export function SuccessConfirm({
	show,
	className,
	label = "Done",
}: SuccessConfirmProps) {
	return (
		<AnimatePresence initial={false}>
			{show ? (
				<m.span
					role="status"
					aria-live="polite"
					className={cn(
						"inline-flex items-center gap-1.5 text-caption font-medium text-success",
						className,
					)}
					initial={{ opacity: 0, scale: 0.85 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.9 }}
					transition={{
						opacity: {
							duration: MOTION_DURATION.fast,
							ease: MOTION_EASE.out,
						},
						scale: spring.snappy,
					}}
					data-testid="success-confirm"
				>
					<span className="flex size-5 items-center justify-center rounded-full bg-success/15 text-success">
						<Check className="size-3.5" aria-hidden />
					</span>
					{label}
				</m.span>
			) : null}
		</AnimatePresence>
	);
}
