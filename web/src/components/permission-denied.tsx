import type { ReactNode } from "react";

import { Lock, type LucideIcon } from "lucide-react";

import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

type PermissionDeniedProps = {
	title: string;
	description: string;
	/** Optional resource name for context. */
	resource?: string;
	primaryAction?: ReactNode;
	secondaryAction?: ReactNode;
	icon?: LucideIcon;
	className?: string;
	"data-testid"?: string;
};

/**
 * Production-matrix permission denial (403-class). Not a retry of the same
 * request; primary action should navigate to an allowed surface or request access.
 */
export function PermissionDenied({
	title,
	description,
	resource,
	primaryAction,
	secondaryAction,
	icon: Icon = Lock,
	className,
	"data-testid": testId = "permission-denied",
}: PermissionDeniedProps) {
	return (
		<Empty
			className={cn("border border-dashed", className)}
			data-testid={testId}
		>
			<EmptyHeader>
				<EmptyMedia type="icon">
					<Icon aria-hidden="true" />
				</EmptyMedia>
				<EmptyTitle>{title}</EmptyTitle>
				<EmptyDescription>
					{description}
					{resource ? (
						<>
							{" "}
							<span className="font-medium text-foreground">({resource})</span>
						</>
					) : null}
				</EmptyDescription>
			</EmptyHeader>
			{primaryAction || secondaryAction ? (
				<EmptyContent className="flex-row flex-wrap justify-center gap-2">
					{primaryAction}
					{secondaryAction}
				</EmptyContent>
			) : null}
		</Empty>
	);
}
