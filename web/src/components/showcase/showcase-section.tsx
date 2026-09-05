import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ShowcaseSectionProps = {
	slug: string;
	title: string;
	description?: string;
	/** Editorial figure label, e.g. "01 / OVERVIEW". */
	figure?: string;
	/** bare: no forced card rhythm; default: children as provided. */
	layout?: "default" | "bare";
	children: ReactNode;
	className?: string;
};

export function ShowcaseSection({
	slug,
	title,
	description,
	figure,
	layout = "default",
	children,
	className,
}: ShowcaseSectionProps) {
	const sectionId = `showcase-${slug}`;
	const headingId = `${sectionId}-title`;

	return (
		<section
			id={sectionId}
			aria-labelledby={headingId}
			className={cn(
				// content-visibility pauses the always-on demos (Spinner, LogoTraceLoader)
				// while a section is offscreen; see docs/adr/009. Its paint containment
				// clips at the padding box, so p-2/-m-2 keeps flush cards' shadow-border visible.
				"flex scroll-mt-28 flex-col gap-4 [contain-intrinsic-size:auto_40rem] [content-visibility:auto]",
				"-m-2 p-2",
				layout === "bare" && "gap-6",
				className,
			)}
		>
			<div className="flex flex-col gap-1">
				{figure ? (
					<p className="font-mono text-label font-medium tracking-[0.14em] text-muted-foreground uppercase">
						{figure}
					</p>
				) : null}
				<h2 className="text-title font-medium" id={headingId}>
					{title}
				</h2>
				{description ? (
					<p className="max-w-prose font-prose text-caption text-muted-foreground">
						{description}
					</p>
				) : null}
			</div>
			{children}
		</section>
	);
}
