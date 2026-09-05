import { screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { renderRoute } from "@/test/render";

test("renders the design system preview", async () => {
	renderRoute("/showcase");
	expect(await screen.findByText(/design system preview/i)).toBeInTheDocument();
});
