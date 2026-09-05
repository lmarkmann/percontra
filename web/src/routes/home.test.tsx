import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, test } from "vitest";

import { server } from "@/test/mocks/server";
import { renderRoute } from "@/test/render";

test("renders the migration review desk without vendor credentials", async () => {
	server.use(
		http.get("*/api/overview", () =>
			HttpResponse.json({
				loaded: false,
				batches: [],
				gaps: [],
				source_count: 0,
			}),
		),
		http.get("*/api/submissions", () => HttpResponse.json({ items: [] })),
		http.get("*/api/adapters", () => HttpResponse.json({ adapters: [] })),
	);
	renderRoute("/");
	await screen.findByRole("heading", {
		name: "Know what you are signing off.",
	});
	expect(
		screen.getByRole("button", { name: "Public example" }),
	).toBeInTheDocument();
	expect(
		screen.getByRole("button", { name: "Load dataset 02" }),
	).toBeInTheDocument();
	expect(screen.getByText(/not a fund allocation engine/)).toBeInTheDocument();
});
