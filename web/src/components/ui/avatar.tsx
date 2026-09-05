import type * as React from "react";

/* oxlint-disable react/only-export-components -- shadcn primitive co-exports its cva variants */
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

function Avatar({
	className,
	size = "default",
	...props
}: AvatarPrimitive.Root.Props & {
	size?: "default" | "sm" | "lg";
}) {
	return (
		<AvatarPrimitive.Root
			data-slot="avatar"
			data-size={size}
			className={cn(
				"group/avatar relative flex size-8 shrink-0 rounded-full select-none data-[size=lg]:size-10 data-[size=sm]:size-6",
				className,
			)}
			{...props}
		/>
	);
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
	return (
		<AvatarPrimitive.Image
			data-slot="avatar-image"
			className={cn(
				"aspect-square size-full rounded-full object-cover image-outline",
				className,
			)}
			{...props}
		/>
	);
}

function AvatarFallback({
	className,
	...props
}: AvatarPrimitive.Fallback.Props) {
	return (
		<AvatarPrimitive.Fallback
			data-slot="avatar-fallback"
			className={cn(
				"flex size-full items-center justify-center rounded-full bg-muted text-caption text-muted-foreground group-data-[size=sm]/avatar:text-label",
				className,
			)}
			{...props}
		/>
	);
}

const avatarBadgeVariants = cva(
	"absolute right-0 bottom-0 z-raised inline-flex items-center justify-center rounded-full ring-2 ring-background status-dot select-none group-data-[size=default]/avatar:size-2.5 group-data-[size=lg]/avatar:size-3 group-data-[size=sm]/avatar:size-2 group-data-[size=default]/avatar:[&>svg]:size-2 group-data-[size=lg]/avatar:[&>svg]:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
	{
		variants: {
			status: {
				success: "bg-success text-success-foreground",
				warning: "bg-warning text-warning-foreground",
				error: "bg-destructive text-background",
				info: "bg-info text-info-foreground",
				neutral: "bg-muted-foreground text-background",
			},
		},
		defaultVariants: {
			status: "success",
		},
	},
);

function AvatarBadge({
	className,
	status,
	"aria-label": ariaLabel,
	...props
}: React.ComponentProps<"span"> & VariantProps<typeof avatarBadgeVariants>) {
	return (
		<span
			data-slot="avatar-badge"
			data-status={status}
			className={cn(avatarBadgeVariants({ status, className }))}
			{...props}
			aria-label={ariaLabel}
			role={ariaLabel ? "img" : undefined}
			aria-hidden={ariaLabel ? undefined : true}
		/>
	);
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="avatar-group"
			className={cn(
				"group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
				className,
			)}
			{...props}
		/>
	);
}

function AvatarGroupCount({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="avatar-group-count"
			className={cn(
				"relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-caption text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
				className,
			)}
			{...props}
		/>
	);
}

export {
	Avatar,
	AvatarBadge,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
	AvatarImage,
	avatarBadgeVariants,
};
