import { screen, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";

import { renderRoute } from "@/test/render";

test("moves focus to #main after a client navigation, not on first paint", async () => {
	const { router } = renderRoute("/");
	await screen.findByRole("heading", { level: 1 });
	expect(document.getElementById("main")).not.toHaveFocus();

	await router.navigate({ to: "/login" });
	await screen.findByRole("heading", { name: /log in/i });

	await waitFor(() => {
		expect(document.getElementById("main")).toHaveFocus();
	});
});
