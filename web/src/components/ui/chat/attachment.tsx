import type * as React from "react";

/* oxlint-disable react/only-export-components -- shadcn primitive co-exports its cva variants */
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const attachmentVariants = cva(
	"group/attachment duration-fast relative flex w-fit max-w-full min-w-0 shrink-0 flex-wrap rounded-xl bg-card text-card-foreground shadow-border transition-[background-color,box-shadow] ease-out focus-within:shadow-border-hover focus-within:ring-3 focus-within:ring-ring/50 has-[>a,>button]:hover:bg-muted/50 has-[>a,>button]:hover:shadow-border-hover data-[state=error]:shadow-destructive-ring data-[state=idle]:border data-[state=idle]:border-dashed data-[state=idle]:border-border data-[state=idle]:shadow-none",
	{
		variants: {
			size: {
				default:
					"gap-2 text-caption has-data-[slot=attachment-content]:px-2.5 has-data-[slot=attachment-content]:py-2 has-data-[slot=attachment-media]:p-2",
				sm: "gap-2.5 text-label has-data-[slot=attachment-content]:px-2 has-data-[slot=attachment-content]:py-1.5 has-data-[slot=attachment-media]:p-1.5",
				xs: "gap-1.5 rounded-lg text-label has-data-[slot=attachment-content]:px-1.5 has-data-[slot=attachment-content]:py-1 has-data-[slot=attachment-media]:p-1",
			},
			orientation: {
				horizontal: "min-w-40 items-center",
				vertical: "w-24 flex-col has-data-[slot=attachment-content]:w-30",
			},
		},
		defaultVariants: {
			size: "default",
			orientation: "horizontal",
		},
	},
);

function Attachment({
	className,
	state = "done",
	size = "default",
	orientation = "horizontal",
	...props
}: React.ComponentProps<"div"> &
	VariantProps<typeof attachmentVariants> & {
		state?: "idle" | "uploading" | "processing" | "error" | "done";
	}) {
	return (
		<div
			data-slot="attachment"
			data-state={state}
			data-size={size}
			data-orientation={orientation}
			className={cn(attachmentVariants({ size, orientation }), className)}
			{...props}
		/>
	);
}

const attachmentMediaVariants = cva(
	"relative flex aspect-square icon-default size-attachment-media shrink-0 items-center justify-center overflow-hidden rounded-attachment bg-muted text-foreground group-data-[orientation=vertical]/attachment:w-full group-data-[size=sm]/attachment:size-attachment-media-sm group-data-[size=sm]/attachment:rounded-attachment-sm group-data-[size=xs]/attachment:size-attachment-media-xs group-data-[size=xs]/attachment:rounded-attachment-xs group-data-[state=error]/attachment:bg-destructive/10 group-data-[state=error]/attachment:text-destructive group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:size-6! [&_svg]:pointer-events-none group-data-[orientation=vertical]/attachment:[&_svg:not([class*='size-'])]:size-6 group-data-[size=xs]/attachment:[&_svg:not([class*='size-'])]:size-3.5",
	{
		variants: {
			type: {
				icon: "",
				image:
					"opacity-60 group-data-[state=done]/attachment:opacity-100 group-data-[state=idle]/attachment:opacity-100 *:[img]:aspect-square *:[img]:w-full *:[img]:object-cover",
			},
		},
		defaultVariants: {
			type: "icon",
		},
	},
);

function AttachmentMedia({
	className,
	type = "icon",
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof attachmentMediaVariants>) {
	return (
		<div
			data-slot="attachment-media"
			data-type={type}
			className={cn(attachmentMediaVariants({ type }), className)}
			{...props}
		/>
	);
}

function AttachmentContent({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="attachment-content"
			className={cn(
				"max-w-full min-w-0 flex-1 leading-tight group-data-[orientation=vertical]/attachment:px-1",
				className,
			)}
			{...props}
		/>
	);
}

function AttachmentTitle({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="attachment-title"
			className={cn(
				"block max-w-full min-w-0 truncate font-medium group-data-[state=processing]/attachment:shimmer-sweep group-data-[state=uploading]/attachment:shimmer-sweep",
				className,
			)}
			{...props}
		/>
	);
}

function AttachmentDescription({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="attachment-description"
			className={cn(
				"mt-0.5 block min-w-0 truncate text-label text-muted-foreground group-data-[state=error]/attachment:text-destructive",
				"max-w-full",
				className,
			)}
			{...props}
		/>
	);
}

function AttachmentActions({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="attachment-actions"
			className={cn(
				"relative z-dropdown flex shrink-0 items-center group-data-[orientation=vertical]/attachment:absolute group-data-[orientation=vertical]/attachment:top-3 group-data-[orientation=vertical]/attachment:right-3 group-data-[orientation=vertical]/attachment:gap-1",
				className,
			)}
			{...props}
		/>
	);
}

function AttachmentAction({
	className,
	variant,
	size = "icon-xs",
	...props
}: React.ComponentProps<typeof Button>) {
	return (
		<Button
			data-slot="attachment-action"
			variant={variant ?? "ghost"}
			size={size}
			className={cn(className)}
			{...props}
		/>
	);
}

function AttachmentTrigger({
	className,
	render,
	type,
	...props
}: useRender.ComponentProps<"button">) {
	return useRender({
		defaultTagName: "button",
		props: mergeProps<"button">(
			{
				type: render ? type : (type ?? "button"),
				className: cn("absolute inset-0 z-dropdown outline-none", className),
			},
			props,
		),
		render,
		state: {
			slot: "attachment-trigger",
		},
	});
}

function AttachmentGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="attachment-group"
			className={cn(
				"flex max-w-full min-w-0 shrink-0 snap-x snap-mandatory scroll-px-1 scrollbar-none gap-3 overflow-x-auto overscroll-x-contain edge-fade-x py-1 *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start",
				className,
			)}
			{...props}
		/>
	);
}

export {
	Attachment,
	AttachmentAction,
	AttachmentActions,
	AttachmentContent,
	AttachmentDescription,
	AttachmentGroup,
	AttachmentMedia,
	AttachmentTitle,
	AttachmentTrigger,
	attachmentMediaVariants,
	attachmentVariants,
};
