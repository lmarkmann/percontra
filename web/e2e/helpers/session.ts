// Fixture philosophy from epicweb-dev/epic-stack tests/playwright-utils.ts (MIT, faaa217, checked 2026-07-10): only the spec that tests login drives the login UI; everything else gets a session programmatically. Adapted: localStorage demo seed instead of a DB insert plus signed cookie.
import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

/** Seed the demo session before first load; matches what the login form stores. */
export async function primeDemoSession(
	page: Page,
	email = "demo@example.com",
): Promise<void> {
	await page.addInitScript(
		(session) => {
			window.localStorage.setItem("demo-session", JSON.stringify(session));
		},
		{ userId: email, email },
	);
}

export async function gotoDashboard(page: Page): Promise<void> {
	await page.goto("/dashboard");
	await expect(
		page.getByRole("heading", { name: /workspace|dashboard/i }),
	).toBeVisible({ timeout: 10_000 });
}
