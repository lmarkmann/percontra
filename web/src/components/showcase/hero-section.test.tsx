import { screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { HeroSection } from "@/components/showcase/hero-section";
import { renderWithProviders } from "@/test/render";

test("renders staggered hero copy", () => {
	renderWithProviders(<HeroSection />);
	expect(
		screen.getByRole("heading", { level: 1, name: "vite-template" }),
	).toBeInTheDocument();
	expect(screen.getByText(/inter for interface type/i)).toBeInTheDocument();
	expect(screen.getByText("01 / Overview")).toBeInTheDocument();
});
