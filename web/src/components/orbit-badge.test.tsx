import { screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { OrbitBadge } from "@/components/orbit-badge";
import { renderWithProviders } from "@/test/render";

test("labels the seal once and hides the repeated ring from AT", () => {
	renderWithProviders(<OrbitBadge text="MADE TO LAST" />);

	const badge = screen.getByRole("img", { name: "MADE TO LAST" });
	const svg = badge.querySelector("svg");
	expect(svg?.parentElement).toHaveAttribute("aria-hidden", "true");
	expect(svg?.querySelector("textPath")?.textContent).toBe(
		"MADE TO LAST / MADE TO LAST / MADE TO LAST / MADE TO LAST /",
	);
});

test("renders custom center content instead of the shield", () => {
	renderWithProviders(
		<OrbitBadge text="ORBIT BADGE" repeat={3}>
			<span>EU</span>
		</OrbitBadge>,
	);

	const badge = screen.getByRole("img", { name: "ORBIT BADGE" });
	expect(badge).toHaveTextContent("EU");
	expect(badge.querySelector(".lucide-shield-check")).toBeNull();
});
