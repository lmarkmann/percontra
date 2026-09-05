import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AvatarBadge } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
	AttachmentGroup,
	Marker,
	MarkerContent,
	Message,
	MessageContent,
	MessageHeader,
} from "@/components/ui/chat";

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

	it("Message variant=ghost removes header padding via group selector", () => {
		const { container } = render(
			<Message variant="ghost">
				<MessageHeader>Label</MessageHeader>
			</Message>,
		);
		expect(container.querySelector("[data-variant='ghost']")).toBeTruthy();
		expect(container.querySelector("[data-slot='message-header']")).toHaveClass(
			"group-data-[variant=ghost]/message:px-0",
		);
	});

	it("MessageContent only end-aligns direct transcript slots", () => {
		const { container } = render(
			<Message align="end">
				<MessageContent />
			</Message>,
		);
		expect(
			container.querySelector("[data-slot='message-content']"),
		).toHaveClass("group-data-[align=end]/message:[&>[data-slot]]:self-end");
	});

	it("AttachmentGroup stays within the message column and scrolls horizontally", () => {
		const { container } = render(<AttachmentGroup />);
		const group = container.querySelector("[data-slot='attachment-group']");
		expect(group).toHaveClass("max-w-full");
		expect(group).toHaveClass("shrink-0");
		expect(group).toHaveClass("overflow-x-auto");
	});
});
