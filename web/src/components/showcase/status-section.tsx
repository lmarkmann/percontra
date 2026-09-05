import { ShowcaseSection } from "@/components/showcase/showcase-section";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";

const statuses = [
	{ status: "success" as const, label: "Connected" },
	{ status: "warning" as const, label: "Degraded" },
	{ status: "error" as const, label: "Offline" },
	{ status: "info" as const, label: "Syncing" },
	{ status: "neutral" as const, label: "Draft" },
];

export function StatusSection() {
	return (
		<ShowcaseSection
			slug="status-semantics"
			figure="08 / Status"
			title="Status semantics"
			description="Status pills use semantic dots; keep primary color for actions only."
		>
			<Card>
				<CardContent className="flex flex-wrap gap-2 pt-(--card-spacing)">
					{statuses.map(({ status, label }) => (
						<StatusPill key={status} status={status}>
							{label}
						</StatusPill>
					))}
				</CardContent>
			</Card>
		</ShowcaseSection>
	);
}
