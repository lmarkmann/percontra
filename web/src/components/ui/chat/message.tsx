import type * as React from "react";

import { cn } from "@/lib/utils";

function MessageGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="message-group"
			className={cn("flex min-w-0 flex-col gap-message-inner", className)}
			{...props}
		/>
	);
}

function Message({
	className,
	align = "start",
	variant = "default",
	...props
}: React.ComponentProps<"div"> & {
	align?: "start" | "end";
	variant?: "default" | "ghost";
}) {
	return (
		<div
			data-slot="message"
			data-align={align}
			data-variant={variant}
			className={cn(
				"group/message relative flex w-full min-w-0 gap-message-inner text-caption data-[align=end]:flex-row-reverse",
				className,
			)}
			{...props}
		/>
	);
}

function MessageAvatar({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="message-avatar"
			className={cn(
				"flex w-fit min-w-8 shrink-0 items-center justify-center self-end overflow-hidden rounded-full bg-muted group-has-data-[slot=message-footer]/message:-translate-y-8",
				className,
			)}
			{...props}
		/>
	);
}

function MessageContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="message-content"
			className={cn(
				"flex w-full min-w-0 flex-col gap-2.5 wrap-break-word group-data-[align=end]/message:[&>[data-slot]]:self-end",
				className,
			)}
			{...props}
		/>
	);
}

function MessageHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="message-header"
			className={cn(
				"flex max-w-full min-w-0 items-center px-message-meta text-label font-medium text-muted-foreground group-data-[variant=ghost]/message:px-0",
				className,
			)}
			{...props}
		/>
	);
}

function MessageFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="message-footer"
			className={cn(
				"flex max-w-full min-w-0 items-center px-message-meta text-label font-medium text-muted-foreground group-data-[align=end]/message:justify-end group-data-[variant=ghost]/message:px-0",
				className,
			)}
			{...props}
		/>
	);
}

export {
	Message,
	MessageAvatar,
	MessageContent,
	MessageFooter,
	MessageGroup,
	MessageHeader,
};
