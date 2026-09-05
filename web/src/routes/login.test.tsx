import { screen, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";

import { renderRoute } from "@/test/render";

test("shows validation error for invalid email", async () => {
	const { user } = renderRoute("/login");
	const emailInput = await screen.findByTestId("login-email");
	await user.type(emailInput, "not-an-email");
	await user.click(screen.getByTestId("login-submit"));

	expect(
		await screen.findByText("Enter a valid email address."),
	).toBeInTheDocument();
	expect(emailInput).toHaveFocus();
});

test("surfaces sign-in error when demo email contains fail", async () => {
	const { user } = renderRoute("/login");
	await user.type(await screen.findByTestId("login-email"), "fail@example.com");
	await user.click(screen.getByTestId("login-submit"));

	await waitFor(() => {
		expect(screen.getByText("Sign-in failed")).toBeInTheDocument();
	});
	await user.click(screen.getByTestId("login-retry"));

	await waitFor(() => {
		expect(screen.getByTestId("login-email")).toHaveFocus();
	});
});
