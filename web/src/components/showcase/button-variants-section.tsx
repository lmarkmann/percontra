import { ShowcaseSection } from "@/components/showcase/showcase-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const buttonSamples = [
	{ variant: "default" as const, label: "Save draft" },
	{ variant: "secondary" as const, label: "Share link" },
	{ variant: "muted" as const, label: "Archive" },
	{ variant: "outline" as const, label: "Cancel" },
	{ variant: "ghost" as const, label: "Skip" },
	{ variant: "destructive" as const, label: "Delete" },
	{ variant: "link" as const, label: "View docs" },
] as const;

export function ButtonVariantsSection() {
	return (
		<ShowcaseSection
			slug="button-variants"
			figure="02 / Actions"
			title="Button variants"
			description="Primary, secondary, muted, outline, ghost, destructive, and link in one row."
		>
			<Card>
				<CardContent className="flex flex-wrap items-center gap-2 pt-(--card-spacing)">
					{buttonSamples.map(({ variant, label }) => (
						<Button key={variant} variant={variant}>
							{label}
						</Button>
					))}
					<Button loading>Saving</Button>
				</CardContent>
			</Card>
		</ShowcaseSection>
	);
}
