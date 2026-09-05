import { expect, test } from "@playwright/test";

import { gotoDashboard, primeDemoSession } from "./helpers/session";

test.describe("dashboard workspace journey", () => {
	test.beforeEach(async ({ page }) => {
		await primeDemoSession(page);
		await gotoDashboard(page);
	});

	test("walks demo view states from ready through recovery", async ({
		page,
	}) => {
		// Default loader is ready (filled demo workspace)
		await expect(page.getByText("Launch checklist")).toBeVisible({
			timeout: 10_000,
		});
		await expect(page.getByText("Design review")).toBeVisible();
		await expect(page.getByText(/open tasks/i)).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /recent activity/i }),
		).toBeVisible();

		// Debug chrome + empty state still reachable
		await page.goto("/dashboard?view=empty&debug=1");
		await expect(page.getByTestId("dashboard-demo-states")).toBeVisible();
		await expect(page.getByText(/no projects yet/i)).toBeVisible({
			timeout: 10_000,
		});
		await expect(page.getByTestId("dashboard-create")).toBeVisible();
		await page.getByTestId("dashboard-create").click();
		await expect(page.getByText("Launch checklist")).toBeVisible({
			timeout: 10_000,
		});

		// Ready: projects + activity + debug chrome
		await page.goto("/dashboard?view=ready&debug=1");
		await expect(page.getByTestId("dashboard-demo-states")).toBeVisible();
		await expect(page.getByText("Launch checklist")).toBeVisible();

		// Partial: projects + failed slice (client nav via demo link)
		await page.getByRole("link", { name: /^partial$/i }).click();
		await expect(page).toHaveURL(/view=partial/);
		await expect(page.getByText(/partial dashboard/i)).toBeVisible({
			timeout: 10_000,
		});
		await expect(page.getByText(/activity feed unavailable/i)).toBeVisible();

		// Error state, then retry restores ready
		await page.getByRole("link", { name: /^error$/i }).click();
		await expect(page).toHaveURL(/view=error/);
		await expect(page.getByText(/couldn’t load dashboard/i)).toBeVisible({
			timeout: 10_000,
		});
		await page.getByRole("button", { name: /retry/i }).click();
		await expect(page.getByText("Launch checklist")).toBeVisible({
			timeout: 10_000,
		});

		// Forbidden
		await page.goto("/dashboard?view=forbidden&debug=1");
		await expect(page.getByTestId("permission-denied")).toBeVisible();
		await expect(page.getByText(/you don’t have access/i)).toBeVisible();

		// Filtered, then clear filters
		await page.goto("/dashboard?view=filtered&debug=1");
		await expect(page.getByTestId("dashboard-filtered")).toBeVisible();
		await page.getByTestId("dashboard-clear-filters").click();
		await expect(page.getByText("Launch checklist")).toBeVisible({
			timeout: 10_000,
		});

		// Conflict, then keep yours returns to ready
		await page.goto("/dashboard?view=conflict&debug=1");
		await expect(page.getByTestId("dashboard-conflict")).toBeVisible();
		await page.getByRole("button", { name: /keep yours/i }).click();
		await expect(page.getByText("Launch checklist")).toBeVisible({
			timeout: 10_000,
		});
	});
});
