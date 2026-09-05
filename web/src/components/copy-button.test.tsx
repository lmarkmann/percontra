import { screen, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";

import { CopyButton } from "@/components/copy-button";
import { renderWithProviders } from "@/test/render";

test("swaps to a check icon after copying", async () => {
	const { user } = renderWithProviders(
		<CopyButton value="err-123" label="Copy error ID">
			Copy error ID
		</CopyButton>,
	);

	const button = screen.getByRole("button", { name: "Copy error ID" });
	expect(
		button.querySelector(".lucide-copy")?.closest("[data-icon-active]"),
	).toHaveAttribute("data-icon-active", "true");

	await user.click(button);

	await waitFor(() => {
		expect(
			button.querySelector(".lucide-check")?.closest("[data-icon-active]"),
		).toHaveAttribute("data-icon-active", "true");
	});
});

test("exposes polite live region while copied", async () => {
	const { user } = renderWithProviders(
		<CopyButton
			value="err-456"
			label="Copy error ID"
			announceCopied="Copied"
		/>,
	);

	await user.click(screen.getByRole("button", { name: "Copy error ID" }));
	expect(screen.getByText("Copied")).toHaveAttribute("aria-live", "polite");
});

test("icon-only copy button renders without children", () => {
	renderWithProviders(<CopyButton value="token" label="Copy invite link" />);
	expect(
		screen.getByRole("button", { name: "Copy invite link" }),
	).toBeInTheDocument();
});
