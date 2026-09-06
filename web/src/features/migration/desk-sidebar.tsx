import { BadgeCheck, Check, Inbox, ListChecks, Upload } from "lucide-react";

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
} from "@/components/ui/sidebar";
import { useSidebar } from "@/hooks/use-sidebar";

/** The desk is one page in four steps; each step's section carries this id. */
const STEPS = [
	{ id: "step-handover", label: "Handover", icon: Inbox },
	{ id: "step-review", label: "Batch review", icon: ListChecks },
	{ id: "step-signoff", label: "Sign-off", icon: BadgeCheck },
	{ id: "step-acceptance", label: "Destination", icon: Upload },
] as const;

function scrollToStep(id: string) {
	document
		.getElementById(id)
		?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export type DeskSidebarProps = {
	/** Step ids whose section is on the page right now. */
	availableSteps: readonly string[];
	/** Step ids whose gate has passed; these get the filled check. */
	completedSteps: readonly string[];
};

export function DeskSidebar({
	availableSteps,
	completedSteps,
}: DeskSidebarProps) {
	const { state, isMobile } = useSidebar();
	// The rail collapses to the icon width, so the lockup resolves with it. On
	// mobile the sidebar is a sheet that is only ever open, so it stays a word.
	const isRail = state === "collapsed" && !isMobile;
	const lockupState = isRail ? "mark" : "word";

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="h-18 justify-center px-4 group-data-[collapsible=icon]:px-3">
				<a
					href="/"
					className="block overflow-hidden rounded-sm focus-ring py-1"
				>
					<BrandLockup state={lockupState} />
				</a>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className="overflow-hidden whitespace-nowrap group-data-[collapsible=icon]:invisible group-data-[collapsible=icon]:mt-0">
						Migration review
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{STEPS.map((step) => {
								const present = availableSteps.includes(step.id);
								const done = completedSteps.includes(step.id);
								return (
									<SidebarMenuItem key={step.id}>
										<SidebarMenuButton
											tooltip={step.label}
											aria-disabled={!present}
											onClick={() => {
												if (present) scrollToStep(step.id);
											}}
										>
											<span className="relative shrink-0">
												<step.icon aria-hidden />
												{done && (
													<span className="absolute -top-1 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-success text-success-foreground">
														<Check
															className="size-2.5!"
															strokeWidth={3}
															aria-hidden
														/>
													</span>
												)}
											</span>
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
				<div className="group-data-[collapsible=icon]:hidden">
					<ThemeToggleLean />
				</div>
				<SignedInAs collapsed={isRail} />
			</SidebarFooter>
		</Sidebar>
	);
}
