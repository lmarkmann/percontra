import type * as React from "react";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const markerLayoutVariants = cva(
	"group/marker relative flex icon-default min-h-4 w-full items-center gap-2 text-left text-caption text-muted-foreground [a]:underline [a]:underline-offset-3 [a]:hover:text-foreground",
	{
		variants: {
			layout: {
				default: "",
				separator:
					"before:mr-1 before:h-px before:min-w-0 before:flex-1 before:bg-border after:ml-1 after:h-px after:min-w-0 after:flex-1 after:bg-border",
				border: "border-b border-border pb-2",
			},
			tone: {
				default: "",
				info: "text-info [&_[data-slot=marker-icon]_svg]:text-info",
			},
		},
		defaultVariants: {
			layout: "default",
			tone: "default",
		},
	},
);

function Marker({
	className,
	layout = "default",
	tone = "default",
	render,
	...props
}: useRender.ComponentProps<"div"> &
	VariantProps<typeof markerLayoutVariants>) {
	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(
			{
				className: cn(markerLayoutVariants({ layout, tone, className })),
			},
			props,
		),
		render,
		state: {
			slot: "marker",
			layout,
			tone,
		},
	});
}

function MarkerIcon({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="marker-icon"
			aria-hidden="true"
			className={cn("icon-default size-4 shrink-0", className)}
			{...props}
		/>
	);
}

function MarkerContent({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="marker-content"
			className={cn(
				"min-w-0 wrap-break-word group-data-[layout=separator]/marker:flex-none group-data-[layout=separator]/marker:text-center *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
				className,
			)}
			{...props}
		/>
	);
}

// oxlint-disable-next-line react/only-export-components
export { Marker, MarkerContent, MarkerIcon, markerLayoutVariants };
