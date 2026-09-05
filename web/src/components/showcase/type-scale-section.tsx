import { ShowcaseSection } from "@/components/showcase/showcase-section";

export function TypeScaleSection() {
	return (
		<ShowcaseSection
			slug="type-scale"
			figure="12 / Type"
			title="Type scale"
			description="Modular sizes from theme tokens; Inter for UI, Charter for prose."
			layout="bare"
		>
			<div className="flex flex-col gap-4 border-y border-border/70 py-8">
				<p className="font-heading text-display leading-display tracking-display">
					Display
				</p>
				<p className="font-heading text-heading leading-heading tracking-title">
					Heading - 30px
				</p>
				<p className="text-title tracking-title">Title - 24px</p>
				<p className="text-lead leading-lead">Lead - 20px</p>
				<p className="text-subtitle leading-subtitle">Subtitle - 18px</p>
				<p className="font-prose text-body text-muted-foreground">
					Body - Charter for longer reading at 1.6 leading
				</p>
				<p className="text-caption text-muted-foreground">
					Caption - secondary hierarchy
				</p>
				<p className="text-label tracking-label text-muted-foreground uppercase">
					Label
				</p>
			</div>
		</ShowcaseSection>
	);
}
