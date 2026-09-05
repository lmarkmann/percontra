import {
	Circle,
	CircleAlert,
	CircleArrowRight,
	CircleCheck,
	CircleHelp,
	CircleSlash,
	type LucideIcon,
} from "lucide-react";

import {
	type PostingStatus,
	STATUS_LABEL,
	STATUS_NOTE,
} from "@/lib/posting-status";
import { cn } from "@/lib/utils";

const STATUS_ICON: Record<PostingStatus, LucideIcon> = {
	ready: Circle,
	"needs-decision": CircleHelp,
	blocked: CircleSlash,
	stale: CircleAlert,
	approved: CircleCheck,
	exported: CircleArrowRight,
};

// Written out rather than interpolated: Tailwind only emits a class it can see
// as a literal, and `text-status-${status}-fg` is invisible to the scanner.
const STATUS_TEXT: Record<PostingStatus, string> = {
	ready: "text-status-ready-fg",
	"needs-decision": "text-status-needs-decision-fg",
	blocked: "text-status-blocked-fg",
	stale: "text-status-stale-fg",
	approved: "text-status-approved-fg",
	exported: "text-status-exported-fg",
};

const STATUS_ROW: Record<PostingStatus, string> = {
	// ready keeps the plain surface; it is the majority state.
	ready: "",
	"needs-decision": "bg-status-needs-decision-tint",
	blocked: "bg-status-blocked-tint",
	stale: "bg-status-stale-tint",
	approved: "bg-status-approved-tint",
	exported: "bg-status-exported-tint",
};

/** Row background for a status, for table rows and list items. */
export function statusRowClass(status: PostingStatus): string {
	return STATUS_ROW[status];
}

export function StatusMark({
	status,
	showNote = true,
	className,
	...props
}: React.ComponentProps<"span"> & {
	status: PostingStatus;
	showNote?: boolean;
}) {
	const Icon = STATUS_ICON[status];
	const note = STATUS_NOTE[status];
	return (
		<span
			data-slot="status-mark"
			data-status={status}
			className={cn(
				"inline-flex items-center gap-1.5 text-caption leading-ui font-medium whitespace-nowrap",
				STATUS_TEXT[status],
				className,
			)}
			{...props}
		>
			<Icon aria-hidden="true" className="size-3.5 shrink-0" />
			{STATUS_LABEL[status]}
			{showNote && note ? (
				<span className="font-normal text-muted-foreground">({note})</span>
			) : null}
		</span>
	);
}
