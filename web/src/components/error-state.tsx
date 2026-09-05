import type { ReactNode } from "react";

import { RefreshCw } from "lucide-react";

import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Marker, MarkerContent } from "@/components/ui/chat/marker";
import { StatusPill } from "@/components/ui/status-pill";
import { actionClass } from "@/lib/action-class";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
	title: string;
	message: string;
	supportId: string;
	onRetry?: () => void;
	retryDisabled?: boolean;
	retryLabel?: string;
	copyToastMessage?: string;
	/** Compact layout for inline surfaces (chat, tiles). */
	layout?: "panel" | "inline";
	className?: string;
	"data-testid"?: string;
	retryTestId?: string;
	copyTestId?: string;
	children?: ReactNode;
};

/**
 * Three-part error contract: what happened, why (message), what to do (retry + copy ID).
 * Use for server, network, and transport failures; field errors stay on the field.
 */
export function ErrorState({
	title,
	message,
	supportId,
	onRetry,
	retryDisabled,
	retryLabel,
	copyToastMessage,
	layout = "panel",
	className,
	"data-testid": testId,
	retryTestId,
	copyTestId,
	children,
}: ErrorStateProps) {
	const isInline = layout === "inline";

	return (
		<div
			className={cn(
				"flex flex-col",
				isInline
					? "gap-2"
					: "gap-3 rounded-xl bg-destructive/5 p-4 shadow-border",
				className,
			)}
			role="alert"
			data-testid={testId}
		>
			{isInline ? (
				<div className="flex flex-col gap-1.5">
					<StatusPill status="error">{title}</StatusPill>
					<Marker layout="border">
						<MarkerContent>{message}</MarkerContent>
					</Marker>
				</div>
			) : (
				<div className="flex flex-col gap-1">
					<p className="text-body leading-ui font-medium">{title}</p>
					<p className="text-caption leading-body text-muted-foreground">
						{message}
					</p>
				</div>
			)}

			<p
				className={cn(
					"text-label text-muted-foreground",
					isInline && "text-center",
				)}
			>
				Error ID:{" "}
				<code className="rounded-sm bg-muted/60 px-1 py-0.5 font-mono text-label text-foreground tabular-nums">
					{supportId}
				</code>
			</p>

			<div className={cn("flex flex-wrap gap-2", isInline && "justify-center")}>
				{onRetry ? (
					<Button
						size="sm"
						variant="outline"
						className={actionClass()}
						disabled={retryDisabled}
						data-testid={retryTestId}
						onClick={onRetry}
					>
						<RefreshCw data-icon="inline-start" />
						{retryLabel ?? "Retry"}
					</Button>
				) : null}
				<CopyButton
					value={supportId}
					label="Copy error ID"
					copiedLabel="Copied"
					announceCopied="Copied"
					toastMessage={copyToastMessage}
					data-testid={copyTestId}
				>
					Copy error ID
				</CopyButton>
			</div>

			{children}
		</div>
	);
}
