export function SkipLink() {
	return (
		<a
			href="#main"
			className="sr-only fixed top-4 left-4 z-toast rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus-visible:ring-3 focus-visible:ring-ring/50"
		>
			Skip to content
		</a>
	);
}
