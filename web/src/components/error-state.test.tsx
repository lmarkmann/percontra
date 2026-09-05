import { screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { ErrorState } from "@/components/error-state";
import { renderWithProviders } from "@/test/render";

test("renders three-part error with retry and copy", async () => {
	const onRetry = vi.fn();
	const { user } = renderWithProviders(
		<ErrorState
			title="Could not load"
			message="Check your connection, then try again."
			supportId="supp-01"
			onRetry={onRetry}
			retryTestId="error-retry"
			data-testid="error-panel"
		/>,
	);

	expect(screen.getByTestId("error-panel")).toHaveAttribute("role", "alert");
	expect(screen.getByText("Could not load")).toBeInTheDocument();
	expect(
		screen.getByText("Check your connection, then try again."),
	).toBeInTheDocument();
	expect(screen.getByText("supp-01")).toBeInTheDocument();

	await user.click(screen.getByTestId("error-retry"));
	expect(onRetry).toHaveBeenCalledOnce();
});

test("inline layout omits panel border chrome", () => {
	renderWithProviders(
		<ErrorState
			layout="inline"
			title="Transport failed"
			message="Server rejected the message."
			supportId="x"
			data-testid="inline-error"
		/>,
	);

	const panel = screen.getByTestId("inline-error");
	expect(panel.className).not.toMatch(/border-destructive/);
});
