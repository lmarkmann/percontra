import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AvatarBadge } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Marker, MarkerContent } from "@/components/ui/marker";

describe("design system contracts", () => {
	it("button muted variant includes muted surface classes", () => {
		expect(buttonVariants({ variant: "muted" })).toContain("bg-muted");
		expect(buttonVariants({ variant: "muted" })).toContain(
			"hover:bg-muted-hover",
		);
	});

	it("gives avatar status badges explicit image semantics", () => {
		const { rerender } = render(<AvatarBadge aria-label="Online" />);
		expect(screen.getByRole("img", { name: "Online" })).toBeInTheDocument();

		rerender(<AvatarBadge data-testid="decorative-avatar-badge" />);
		expect(screen.getByTestId("decorative-avatar-badge")).toHaveAttribute(
			"aria-hidden",
			"true",
		);
	});

	it("Marker layout=separator sets data-layout", () => {
		render(
			<Marker layout="separator">
				<MarkerContent>Today</MarkerContent>
			</Marker>,
		);
		expect(screen.getByText("Today").closest("[data-layout]")).toHaveAttribute(
			"data-layout",
			"separator",
		);
	});
});
