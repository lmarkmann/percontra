import type { ReactNode } from "react";

import { ThemeToggleLean } from "@/components/theme-toggle-lean";

export function SiteHeader({
	kicker = "vite-template",
	children,
}: {
	kicker?: string;
	children?: ReactNode;
}) {
	return (
		<header className="mx-auto flex w-full max-w-3xl items-center justify-between border-x border-border/70 px-6 py-8 safe-top">
			<p className="font-mono text-label font-medium tracking-label text-muted-foreground uppercase">
				{kicker}
			</p>
			<div className="flex items-center gap-2">
				{children ?? <ThemeToggleLean />}
			</div>
		</header>
	);
}
