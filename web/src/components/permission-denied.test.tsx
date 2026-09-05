import { screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { PermissionDenied } from "@/components/permission-denied";
import { Button } from "@/components/ui/button";
import { renderWithProviders } from "@/test/render";

test("renders lock empty with title, description, and resource", () => {
	renderWithProviders(
		<PermissionDenied
			title="You don’t have access"
			description="Your role cannot open this resource."
			resource="billing settings"
		/>,
	);

	expect(screen.getByTestId("permission-denied")).toBeInTheDocument();
	expect(
		screen.getByRole("heading", { name: "You don’t have access" }),
	).toBeInTheDocument();
	expect(
		screen.getByText(/Your role cannot open this resource/),
	).toBeInTheDocument();
	expect(screen.getByText(/billing settings/)).toBeInTheDocument();
});

test("renders primary action slot without a retry-of-same-resource assumption", () => {
	renderWithProviders(
		<PermissionDenied
			title="Forbidden"
			description="Not allowed."
			primaryAction={<Button data-testid="go-home">Back home</Button>}
		/>,
	);

	expect(screen.getByTestId("go-home")).toHaveTextContent("Back home");
});
