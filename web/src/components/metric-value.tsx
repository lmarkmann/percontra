import { cn } from "@/lib/utils";
import { UNKNOWN_METRIC } from "@/lib/view-state";

type MetricValueProps = {
	/** Numeric or formatted metric; null/undefined means unknown, not zero. */
	value: string | number | null | undefined;
	className?: string;
	/** Override the unknown placeholder (default hyphen-minus). */
	unknownLabel?: string;
};

/**
 * Partial-data contract: unknown metrics render as a hyphen-minus (or label),
 * never N/A, null, or 0 when the value is truly missing.
 */
export function MetricValue({
	value,
	className,
	unknownLabel = UNKNOWN_METRIC,
}: MetricValueProps) {
	const isUnknown = value === null || value === undefined || value === "";
	return (
		<span
			className={cn(
				"tabular-nums",
				isUnknown && "text-muted-foreground",
				className,
			)}
			data-unknown={isUnknown ? "true" : undefined}
		>
			{isUnknown ? unknownLabel : value}
		</span>
	);
}
