import { ShowcaseSection } from "@/components/showcase/showcase-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export function OverlaySection() {
	return (
		<ShowcaseSection
			slug="overlays"
			figure="07 / Overlays"
			title="Overlays"
			description="Dialog and tooltip with layered stacking so overlays never fight each other."
		>
			<Card>
				<CardContent className="flex flex-wrap gap-3 pt-(--card-spacing)">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger render={<Button variant="outline" />}>
								Tooltip
							</TooltipTrigger>
							<TooltipContent>Token-aligned elevation</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<Dialog>
						<DialogTrigger render={<Button variant="secondary" />}>
							Open dialog
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Confirm action</DialogTitle>
								<DialogDescription>
									Dialogs consume z-modal and shadow-floating tokens.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button variant="default">Continue</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</CardContent>
			</Card>
		</ShowcaseSection>
	);
}
