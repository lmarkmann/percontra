import type * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const statusPillVariants = cva(
	"inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-label leading-ui font-medium",
	{
		variants: {
			status: {
				success: "text-success",
				warning: "text-warning",
				error: "text-destructive",
				info: "text-info",
				neutral: "text-muted-foreground",
			},
		},
		defaultVariants: {
			status: "neutral",
		},
	},
);

const statusDotVariants = cva("size-1.5 shrink-0 rounded-full status-dot", {
	variants: {
		status: {
			success: "bg-success",
			warning: "bg-warning",
			error: "bg-destructive",
			info: "bg-info",
			neutral: "bg-muted-foreground",
		},
	},
	defaultVariants: {
		status: "neutral",
	},
});

function StatusPill({
	className,
	status,
	children,
	...props
}: React.ComponentProps<"span"> & VariantProps<typeof statusPillVariants>) {
	return (
		<span
			data-slot="status-pill"
			data-status={status}
			className={cn(statusPillVariants({ status, className }))}
			{...props}
		>
			<span aria-hidden="true" className={cn(statusDotVariants({ status }))} />
			{children}
		</span>
	);
}

// oxlint-disable-next-line react/only-export-components
export { StatusPill, statusPillVariants };
