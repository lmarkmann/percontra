import { BadgeCheck, Inbox, ListChecks, Upload } from "lucide-react";

import { BrandLockup } from "@/components/brand-lockup";
import { SignedInAs } from "@/components/signed-in-as";
import { ThemeToggleLean } from "@/components/theme-toggle-lean";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/hooks/use-sidebar";

/** The desk is one page in four steps; each step's section carries this id. */
const STEPS = [
	{ id: "step-handover", label: "Bring in the handover", icon: Inbox },
	{ id: "step-review", label: "Review the batch", icon: ListChecks },
	{ id: "step-signoff", label: "Sign off this version", icon: BadgeCheck },
	{ id: "step-acceptance", label: "Destination acceptance", icon: Upload },
] as const;

function scrollToStep(id: string) {
	document
		.getElementById(id)
		?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export type DeskSidebarProps = {
	/** Step ids whose section is on the page right now. */
	availableSteps: readonly string[];
};

export function DeskSidebar({ availableSteps }: DeskSidebarProps) {
	const { state, isMobile } = useSidebar();
	// The rail collapses to the icon width, so the lockup resolves with it. On
	// mobile the sidebar is a sheet that is only ever open, so it stays a word.
	const lockupState = state === "collapsed" && !isMobile ? "mark" : "word";

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="h-16 justify-center px-4">
				<a href="/" className="block rounded-sm focus-ring py-1">
					<BrandLockup state={lockupState} className="text-lead" />
				</a>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Migration review</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{STEPS.map((step) => {
								const present = availableSteps.includes(step.id);
								return (
									<SidebarMenuItem key={step.id}>
										<SidebarMenuButton
											tooltip={step.label}
											aria-disabled={!present}
											onClick={() => {
												if (present) scrollToStep(step.id);
											}}
										>
											<step.icon aria-hidden />
											<span>{step.label}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="gap-3 group-data-[collapsible=icon]:items-center">
				<div className="px-2 text-caption text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
					<SignedInAs fallback="Local operator" />
				</div>
				<ThemeToggleLean />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
