import { BookOpen } from "lucide-react";
import { m } from "motion/react";

import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

type DocsButtonProps = {
	href: string;
	label?: string;
	className?: string;
};

/**
 * Secondary docs CTA with a restrained book-open hover (icon press, not spectacle).
 */
export function DocsButton({
	href,
	label = "Documentation",
	className,
}: DocsButtonProps) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			className={cn(
				"group duration-fast relative inline-flex h-7 items-center gap-2 rounded-capped-md border focus-ring border-transparent bg-background px-2.5 text-caption font-medium shadow-border outline-none after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-1/2 after:content-['']",
				"hover-fine:hover:bg-muted hover-fine:hover:text-foreground hover-fine:hover:shadow-border-hover",
				className,
			)}
			data-testid="docs-button"
		>
			<m.span
				className="inline-flex"
				whileHover={{ rotate: -6, scale: 1.06 }}
				whileTap={{ scale: 0.94 }}
				transition={spring.snappy}
			>
				<BookOpen className="size-3.5" aria-hidden />
			</m.span>
			{label}
			<span className="sr-only">(opens in new tab)</span>
		</a>
	);
}
