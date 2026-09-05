import { FileText, ImageIcon } from "lucide-react";

import { ShowcaseSection } from "@/components/showcase/showcase-section";
import { Card, CardContent } from "@/components/ui/card";
import {
	Attachment,
	AttachmentContent,
	AttachmentDescription,
	AttachmentMedia,
	AttachmentTitle,
} from "@/components/ui/chat";
import { Spinner } from "@/components/ui/spinner";

const states = [
	{
		state: "idle" as const,
		title: "Drop file",
		description: "Release to attach",
	},
	{
		state: "uploading" as const,
		title: "uploading.pdf",
		description: "Uploading...",
	},
	{
		state: "processing" as const,
		title: "scan.png",
		description: "Processing...",
	},
	{
		state: "error" as const,
		title: "report.pdf",
		description: "Upload failed",
	},
	{ state: "done" as const, title: "brief.md", description: "12 KB" },
];

export function AttachmentStatesSection() {
	return (
		<ShowcaseSection
			slug="attachment-states"
			figure="04 / Attachments"
			title="Attachment states"
			description="Uploading, ready, failed, and other file attachment states."
		>
			<Card>
				<CardContent className="flex flex-wrap gap-3 pt-(--card-spacing)">
					{states.map(({ state, title, description }) => (
						<Attachment key={state} state={state}>
							<AttachmentMedia type={state === "done" ? "image" : "icon"}>
								{state === "uploading" || state === "processing" ? (
									<Spinner size="sm" />
								) : state === "done" ? (
									<ImageIcon />
								) : (
									<FileText />
								)}
							</AttachmentMedia>
							<AttachmentContent>
								<AttachmentTitle>{title}</AttachmentTitle>
								<AttachmentDescription>{description}</AttachmentDescription>
							</AttachmentContent>
						</Attachment>
					))}
				</CardContent>
			</Card>
		</ShowcaseSection>
	);
}
