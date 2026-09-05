import { screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { SkipLink } from "@/components/skip-link";
import { renderWithProviders } from "@/test/render";

test("links to the main landmark", () => {
	renderWithProviders(<SkipLink />);
	const link = screen.getByRole("link", { name: "Skip to content" });
	expect(link).toHaveAttribute("href", "#main");
});

test("is visually hidden until focused", () => {
	renderWithProviders(<SkipLink />);
	expect(screen.getByRole("link", { name: "Skip to content" })).toHaveClass(
		"sr-only",
	);
});
