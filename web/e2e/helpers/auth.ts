import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

/** Demo sign-in through the public login form; lands on the workspace. */
export async function demoLogin(
	page: Page,
	email = "demo@example.com",
): Promise<void> {
	await page.goto("/login");
	await page.getByTestId("login-email").fill(email);
	await page.getByTestId("login-submit").click();
	await expect(
		page.getByRole("heading", { name: /workspace|dashboard/i }),
	).toBeVisible({ timeout: 10_000 });
	await expect(page).toHaveURL(/\/dashboard/);
}
