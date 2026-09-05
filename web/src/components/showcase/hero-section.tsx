import { FadeInGroup, FadeInItem } from "@/components/motion-primitives";
import { ShowcaseSection } from "@/components/showcase/showcase-section";

export function HeroSection() {
	return (
		<ShowcaseSection
			slug="overview"
			figure="01 / Overview"
			title="Overview"
			description="Above-the-fold headline and support line with a single staggered enter."
			layout="bare"
		>
			<FadeInGroup className="flex flex-col gap-4 border-y border-border/70 py-8">
				<FadeInItem>
					<h1 className="text-display leading-display font-semibold hyphens-none">
						vite-template
					</h1>
				</FadeInItem>
				<FadeInItem>
					<p className="max-w-prose font-prose text-title leading-body text-muted-foreground">
						Inter for interface type, Charter for prose, a single verdigris
						accent on primary actions.
					</p>
				</FadeInItem>
			</FadeInGroup>
		</ShowcaseSection>
	);
}
