import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { AttachmentStatesSection } from "@/components/showcase/attachment-states-section";
import { AvatarSection } from "@/components/showcase/avatar-section";
import { BubbleVariantsSection } from "@/components/showcase/bubble-variants-section";
import { ButtonVariantsSection } from "@/components/showcase/button-variants-section";
import { CraftPatternsSection } from "@/components/showcase/craft-patterns-section";
import { FormControlsSection } from "@/components/showcase/form-controls-section";
import { HeroSection } from "@/components/showcase/hero-section";
import { HotkeysSection } from "@/components/showcase/hotkeys-section";
import { MotionCharacterSection } from "@/components/showcase/motion-character-section";
import { OverlaySection } from "@/components/showcase/overlay-section";
import { ShowcaseSection } from "@/components/showcase/showcase-section";
import { StatesShowcase } from "@/components/showcase/states-showcase";
import { StatusSection } from "@/components/showcase/status-section";
import { TruncationTableSection } from "@/components/showcase/truncation-table-section";
import { TypeScaleSection } from "@/components/showcase/type-scale-section";
import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatFeature } from "@/features/chat/chat-feature";
import { routeSeo, seoHead } from "@/lib/seo";

export const Route = createFileRoute("/showcase")({
	head: () => seoHead(routeSeo.showcase),
	component: ShowcaseRoute,
});

const MotionShell = lazy(() =>
	import("@/components/motion-shell").then((module) => ({
		default: module.MotionShell,
	})),
);

const SHOWCASE_NAV = [
	{ href: "#showcase-overview", label: "Overview" },
	{ href: "#showcase-button-variants", label: "Buttons" },
	{ href: "#showcase-bubble-variants", label: "Bubbles" },
	{ href: "#showcase-attachment-states", label: "Attachments" },
	{ href: "#showcase-avatars", label: "Avatars" },
	{ href: "#showcase-form-controls", label: "Forms" },
	{ href: "#showcase-overlays", label: "Overlays" },
	{ href: "#showcase-status-semantics", label: "Status" },
	{ href: "#showcase-data-view-states", label: "States" },
	{ href: "#showcase-chat-feature", label: "Chat" },
	{ href: "#showcase-motion-character", label: "Motion" },
	{ href: "#showcase-type-scale", label: "Type" },
	{ href: "#showcase-truncation-and-tables", label: "Truncation" },
	{ href: "#showcase-keyboard-shortcuts", label: "Hotkeys" },
	{ href: "#showcase-bookmark-craft-patterns", label: "Craft" },
] as const;

function ShowcasePageFallback() {
	return (
		<div className="min-h-svh bg-background">
			<SiteHeader kicker="Design system preview">
				<Skeleton className="h-8 w-16 rounded-md" />
				<Skeleton className="size-8 rounded-lg" />
			</SiteHeader>
			<main className="mx-auto flex w-full max-w-3xl flex-col gap-8 border-x border-border/70 px-6 pb-24 safe-bottom">
				<div className="flex flex-col gap-3">
					<Skeleton className="h-3 w-24" />
					<Skeleton className="h-8 w-40" />
					<Skeleton className="h-4 w-full max-w-md" />
				</div>
				<Skeleton className="h-28 w-full rounded-xl" />
				<Skeleton className="h-24 w-full rounded-xl" />
				<Skeleton className="h-24 w-full rounded-xl" />
			</main>
		</div>
	);
}

function ShowcaseRoute() {
	return (
		<Suspense fallback={<ShowcasePageFallback />}>
			<MotionShell>
				<div className="min-h-svh bg-background">
					<SiteHeader kicker="Design system preview">
						<ThemeToggle />
					</SiteHeader>

					<nav
						aria-label="Showcase sections"
						className="sticky top-0 z-sticky border-b border-border/70 bg-background/90 backdrop-blur-sm"
					>
						<div className="mx-auto flex w-full max-w-3xl gap-1 overflow-x-auto border-x border-border/70 px-4 py-2">
							{SHOWCASE_NAV.map((item) => (
								<a
									key={item.href}
									href={item.href}
									className="duration-fast shrink-0 rounded-md px-2.5 py-1.5 text-label text-muted-foreground transition-[background-color,color] ease-out hover-fine:hover:bg-muted hover-fine:hover:text-foreground"
								>
									{item.label}
								</a>
							))}
						</div>
					</nav>

					<main
						id="main"
						tabIndex={-1}
						className="isolate mx-auto flex w-full max-w-3xl flex-col gap-16 border-x border-border/70 px-6 pt-10 pb-24 outline-none safe-bottom"
					>
						<HeroSection />
						<ButtonVariantsSection />
						<BubbleVariantsSection />
						<AttachmentStatesSection />
						<AvatarSection />
						<FormControlsSection />
						<OverlaySection />
						<StatusSection />
						<StatesShowcase />
						<ShowcaseSection
							slug="chat-feature"
							figure="10 / Chat feature"
							title="Chat feature"
							description="Composer, attachments, offline queue, and toast feedback in one surface."
							layout="bare"
						>
							<ChatFeature />
						</ShowcaseSection>
						<MotionCharacterSection />
						<TypeScaleSection />
						<TruncationTableSection />
						<HotkeysSection />
						<CraftPatternsSection />
					</main>
				</div>
			</MotionShell>
		</Suspense>
	);
}
