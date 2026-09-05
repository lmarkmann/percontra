import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThemeToggleLean } from "@/components/theme-toggle-lean";
import { renderWithProviders } from "@/test/render";

describe("ThemeToggleLean", () => {
	it("cycles light  ->  dark  ->  system  ->  light", async () => {
		localStorage.setItem("ui-theme", "light");
		const { user } = renderWithProviders(<ThemeToggleLean />);

		const button = screen.getByTestId("theme-toggle");
		expect(button).toHaveAttribute("aria-label", "Light theme");

		await user.click(button);
		expect(localStorage.getItem("ui-theme")).toBe("dark");
		expect(button).toHaveAttribute("aria-label", "Dark theme");

		await user.click(button);
		expect(localStorage.getItem("ui-theme")).toBe("system");
		expect(button).toHaveAttribute("aria-label", "System theme");

		await user.click(button);
		expect(localStorage.getItem("ui-theme")).toBe("light");
	});
});
