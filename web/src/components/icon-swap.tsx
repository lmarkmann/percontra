import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const layerClass =
	"absolute inset-0 flex items-center justify-center transition-[opacity,transform,filter] duration-fast ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none";

type IconSwapProps = {
	activeKey: string;
	icons: Record<string, ReactNode>;
	className?: string;
};

/**
 * Dual/multi icon crossfade without Motion: opacity + scale 0.25 + blur 4px.
 * Home-safe; keeps both (or all) icons in the DOM for enter and exit.
 */
export function IconSwap({ activeKey, icons, className }: IconSwapProps) {
	return (
		<span
			className={cn("relative inline-flex size-4 shrink-0", className)}
			aria-hidden
		>
			{Object.entries(icons).map(([key, icon]) => {
				const active = key === activeKey;
				return (
					<span
						key={key}
						data-icon-active={active ? "true" : "false"}
						className={cn(
							layerClass,
							active
								? "blur-0 scale-100 opacity-100"
								: "pointer-events-none scale-[0.25] opacity-0 blur-xs",
						)}
					>
						{icon}
					</span>
				);
			})}
		</span>
	);
}
