import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { IconSwap } from "@/components/icon-swap";
import { Button, type buttonVariants } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const COPY_RESET_MS = 2000;

type CopyButtonProps = {
	value: string;
	label: string;
	copiedLabel?: string;
	announceCopied?: string;
	toastMessage?: string;
	onCopied?: () => void;
	onCopyError?: (error: unknown) => void;
	children?: ReactNode;
	className?: string;
	"data-testid"?: string;
} & Pick<VariantProps<typeof buttonVariants>, "size" | "variant">;

async function writeToClipboard(text: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(text);
		return;
	} catch (clipboardError) {
		const textarea = document.createElement("textarea");
		textarea.value = text;
		textarea.style.position = "fixed";
		textarea.style.opacity = "0";
		document.body.appendChild(textarea);
		textarea.select();
		const fellBack = document.execCommand("copy");
		textarea.remove();
		if (!fellBack) throw clipboardError;
	}
}

export function CopyButton({
	value,
	label,
	copiedLabel,
	announceCopied = "Copied",
	toastMessage,
	onCopied,
	onCopyError,
	children,
	className,
	size = "sm",
	variant = "ghost",
	"data-testid": dataTestId,
}: CopyButtonProps) {
	const [copied, setCopied] = useState(false);
	const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
		};
	}, []);

	async function handleCopy() {
		try {
			await writeToClipboard(value);
		} catch (error) {
			onCopyError?.(error);
			return;
		}
		setCopied(true);
		onCopied?.();
		if (toastMessage) {
			toast.success(toastMessage);
		}
		if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
		copyTimerRef.current = setTimeout(() => setCopied(false), COPY_RESET_MS);
	}

	return (
		<>
			<Button
				type="button"
				size={size}
				variant={variant}
				className={cn(className)}
				data-testid={dataTestId}
				aria-label={copied ? (copiedLabel ?? label) : label}
				onClick={() => void handleCopy()}
			>
				<span data-icon="inline-start" className="inline-flex">
					<IconSwap
						activeKey={copied ? "check" : "copy"}
						icons={{
							copy: <Copy className="size-4" />,
							check: <Check className="size-4" />,
						}}
					/>
				</span>
				{children}
			</Button>
			<span aria-live="polite" className="sr-only">
				{copied ? announceCopied : ""}
			</span>
		</>
	);
}
