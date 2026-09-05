import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { actionClass } from "@/lib/action-class";
import { routeSeo, seoHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
	// Keep home meta aligned with index.html first paint (see routeSeo.home).
	head: () => seoHead(routeSeo.home, { includeJsonLd: true }),
	component: HomeRoute,
});

function HomeRoute() {
	const stackItems = [
		{ label: "Interface", value: "Inter" },
		{ label: "Prose", value: "Charter" },
		{ label: "Accent", value: "Verdigris" },
		{ label: "Routing", value: "TanStack" },
	] as const;

	return (
		<div className="min-h-svh bg-background">
			<SiteHeader />

			<main
				id="main"
				tabIndex={-1}
				className="mx-auto flex w-full max-w-3xl flex-col gap-10 border-x border-border/70 px-6 pb-24 outline-none safe-bottom"
			>
				<div className="flex flex-col gap-4">
					<h1 className="text-display leading-display font-semibold text-pretty hyphens-none">
						Start design‑forward. Stay lean.
					</h1>
					<p className="max-w-prose font-prose text-title leading-body text-muted-foreground">
						Inter for interface type, Charter for prose, a single verdigris
						accent on primary actions. Explore the design system or sign in to
						try protected routes.
					</p>
				</div>

				<div className="flex flex-wrap gap-3">
					{/* Real <a> CTAs (not Button+Link role=button) so home keeps link semantics. */}
					<Link to="/showcase" className={cn(buttonVariants(), actionClass())}>
						Design system showcase
					</Link>
					<Link
						to="/login"
						className={cn(
							buttonVariants({ variant: "outline" }),
							actionClass(),
						)}
					>
						Log in
					</Link>
				</div>

				<ul className="grid gap-3 border-t border-border pt-8 sm:grid-cols-2">
					{stackItems.map((item) => (
						<li
							key={item.label}
							className="flex items-baseline justify-between gap-3 rounded-xl px-4 py-3 shadow-border dark:bg-card"
						>
							<span className="text-label text-muted-foreground">
								{item.label}
							</span>
							<span className="text-caption font-medium">{item.value}</span>
						</li>
					))}
				</ul>

				<p className="font-mono text-label text-muted-foreground">
					Vite, React, Tailwind, shadcn
				</p>
			</main>
		</div>
	);
}
