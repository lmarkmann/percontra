import { createFileRoute, Link } from "@tanstack/react-router";

import { BrandLockup } from "@/components/brand-lockup";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
} from "@/components/ui/empty";
import { actionClass } from "@/lib/action-class";
import { routeSeo, seoHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/$")({
	head: () => seoHead(routeSeo.notFound),
	component: NotFoundRoute,
});

function NotFoundRoute() {
	return (
		<div className="flex min-h-svh flex-col bg-background">
			<SiteHeader />

			<main
				id="main"
				tabIndex={-1}
				className="mx-auto flex w-full max-w-3xl flex-1 items-center border-x border-border/70 px-6 py-6 outline-none safe-bottom"
			>
				<Empty className="w-full border-0">
					<EmptyHeader>
						<BrandLockup state="word" className="mx-auto text-primary" />
						<h1
							data-slot="empty-title"
							className="font-heading text-body font-medium tracking-title"
						>
							No entry on this side
						</h1>
						<EmptyDescription>
							Per contra is the matching entry on the other side of the account.
							This address has none. The desk is one click back.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Link to="/" className={cn(buttonVariants(), actionClass())}>
							Back to the desk
						</Link>
					</EmptyContent>
				</Empty>
			</main>
		</div>
	);
}
