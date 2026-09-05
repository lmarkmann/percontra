import { screen } from "@testing-library/react";
import { expect, test } from "vitest";

import {
	FadeIn,
	FadeInGroup,
	FadeInItem,
} from "@/components/motion-primitives";
import { renderWithProviders } from "@/test/render";

test("FadeIn renders children", () => {
	renderWithProviders(
		<FadeIn data-testid="reveal">
			<p>Scroll reveal copy</p>
		</FadeIn>,
	);
	expect(screen.getByText("Scroll reveal copy")).toBeInTheDocument();
});

test("FadeIn disabled renders static content without motion wrapper", () => {
	renderWithProviders(
		<FadeIn disabled className="static-reveal">
			<p>Static copy</p>
		</FadeIn>,
	);
	expect(screen.getByText("Static copy").parentElement).toHaveClass(
		"static-reveal",
	);
});

test("FadeInGroup staggers child items", () => {
	renderWithProviders(
		<FadeInGroup data-testid="group">
			<FadeInItem>
				<h2>Headline</h2>
			</FadeInItem>
			<FadeInItem>
				<p>Subhead</p>
			</FadeInItem>
		</FadeInGroup>,
	);
	expect(screen.getByRole("heading", { name: "Headline" })).toBeInTheDocument();
	expect(screen.getByText("Subhead")).toBeInTheDocument();
});
