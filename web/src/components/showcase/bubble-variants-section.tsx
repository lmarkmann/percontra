import { ShowcaseSection } from "@/components/showcase/showcase-section";
import { Card, CardContent } from "@/components/ui/card";
import { Bubble, BubbleContent } from "@/components/ui/chat";

const bubbleSamples = [
	{ variant: "default" as const, label: "Send when you are ready." },
	{ variant: "secondary" as const, label: "Queued for review." },
	{ variant: "muted" as const, label: "Assistant is drafting a reply." },
	{ variant: "tinted" as const, label: "Mentioned you in Design review." },
	{ variant: "outline" as const, label: "System note: session restored." },
	{ variant: "ghost" as const, label: "Edited 2 minutes ago" },
	{ variant: "destructive" as const, label: "Message failed to send." },
] as const;

export function BubbleVariantsSection() {
	return (
		<ShowcaseSection
			slug="bubble-variants"
			figure="03 / Chat"
			title="Bubble variants"
			description="Chat bubble surfaces, including a primary-tinted bubble for emphasis."
		>
			<Card>
				<CardContent className="flex flex-col gap-3 pt-(--card-spacing)">
					{bubbleSamples.map(({ variant, label }) => (
						<Bubble key={variant} variant={variant}>
							<BubbleContent>{label}</BubbleContent>
						</Bubble>
					))}
				</CardContent>
			</Card>
		</ShowcaseSection>
	);
}
