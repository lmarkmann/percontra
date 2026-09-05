import { expect, test } from "@playwright/test";

import { demoLogin } from "./helpers/auth";

test.describe("auth session journey", () => {
	test("gates dashboard, validates, fails transport, then signs in and out", async ({
		page,
	}) => {
		// Unauthenticated deep link
		await page.goto("/dashboard");
		await expect(page).toHaveURL(/\/login/);
		await expect(page.getByRole("heading", { name: /log in/i })).toBeVisible();

		// Empty submit triggers field validation
		await page.getByTestId("login-submit").click();
		await expect(page.getByRole("alert")).toBeVisible();
		await expect(page.getByText(/email is required/i)).toBeVisible();

		// Transport failure path
		await page.getByTestId("login-email").fill("fail@example.com");
		await page.getByTestId("login-submit").click();
		await expect(page.getByRole("alert")).toBeVisible({ timeout: 5000 });
		await expect(page.getByText(/sign-in failed/i)).toBeVisible();
		await page.getByTestId("login-retry").click();
		await expect(page.getByTestId("login-email")).toBeVisible();

		// Happy path
		await page.getByTestId("login-email").fill("demo@example.com");
		await page.getByTestId("login-submit").click();
		await expect(
			page.getByRole("heading", { name: /workspace|dashboard/i }),
		).toBeVisible({ timeout: 10_000 });
		await expect(page).toHaveURL(/\/dashboard/);
		await expect(page.getByText("Launch checklist")).toBeVisible({
			timeout: 10_000,
		});
		await expect(page.getByText(/open tasks/i)).toBeVisible();

		// Session persists across hard navigation
		await page.goto("/dashboard");
		await expect(
			page.getByRole("heading", { name: /workspace|dashboard/i }),
		).toBeVisible();

		// Sign out returns to login and re-gates the workspace
		await page.getByTestId("dashboard-sign-out").click();
		await expect(page).toHaveURL(/\/login/);
		await page.goto("/dashboard");
		await expect(page).toHaveURL(/\/login/);
	});

	test("signed-in user can open login and still hold the session", async ({
		page,
	}) => {
		await demoLogin(page);
		await page.goto("/login");
		await expect(page.getByRole("heading", { name: /log in/i })).toBeVisible();
		await page.goto("/dashboard");
		await expect(
			page.getByRole("heading", { name: /workspace|dashboard/i }),
		).toBeVisible();
	});
});
