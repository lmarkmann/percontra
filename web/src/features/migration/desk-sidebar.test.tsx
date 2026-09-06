import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { DeskSidebar } from "./desk-sidebar";

function renderRail(available: string[], completed: string[]) {
	return render(
		<SidebarProvider>
			<TooltipProvider>
				<DeskSidebar availableSteps={available} completedSteps={completed} />
			</TooltipProvider>
		</SidebarProvider>,
	);
}

test("a finished step keeps its step icon and gains the filled check", () => {
	renderRail(["step-handover"], ["step-handover"]);
	const button = screen.getByRole("button", {
		name: "Handover",
	});
	expect(button.querySelector("svg.lucide-inbox")).not.toBeNull();
	expect(button.querySelector("svg.lucide-check")).not.toBeNull();
});

test("an available but unfinished step shows neither check nor lock", () => {
	renderRail(["step-review"], []);
	const button = screen.getByRole("button", { name: "Batch review" });
	expect(button.querySelector("svg.lucide-check")).toBeNull();
	expect(button.getAttribute("aria-disabled")).toBe("false");
});

test("an unreachable step is muted and takes no clicks", () => {
	renderRail(["step-handover"], []);
	const button = screen.getByRole("button", {
		name: "Sign-off",
	});
	expect(button.querySelector("svg.lucide-check")).toBeNull();
	expect(button.getAttribute("aria-disabled")).toBe("true");
});
