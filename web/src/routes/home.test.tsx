import { screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { renderRoute } from "@/test/render";

test("renders the product home with showcase and login links", async () => {
	renderRoute("/");
	await screen.findByRole("heading", {
		name: /Start design.forward\. Stay lean\./,
	});
	expect(screen.getByText("vite-template")).toBeInTheDocument();
	expect(
		screen.getByRole("link", { name: /design system showcase/i }),
	).toHaveAttribute("href", "/showcase");
	expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
		"href",
		"/login",
	);
});
