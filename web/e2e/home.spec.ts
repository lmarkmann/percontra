import { expect, test } from "@playwright/test";

import { siteName } from "./helpers/site";

test.describe("home entry journey", () => {
	test("lands with hero, then reaches showcase and login via CTAs", async ({
		page,
	}) => {
		await page.goto("/");

		await expect(
			page.getByRole("heading", {
				name: /Start design.forward\. Stay lean\./,
			}),
		).toBeVisible();
		await expect(page.getByText(siteName)).toBeVisible();

		await page.getByRole("link", { name: /design system showcase/i }).click();
		await expect(page).toHaveURL(/\/showcase/);
		await expect(page.getByRole("heading", { name: siteName })).toBeVisible();

		await page.goto("/");
		await page.getByRole("link", { name: /log in/i }).click();
		await expect(page).toHaveURL(/\/login/);
		await expect(page.getByRole("heading", { name: /log in/i })).toBeVisible();
		await expect(page.getByTestId("login-email")).toBeVisible();
	});

	test("cycles theme without leaving home", async ({ page }) => {
		await page.goto("/");
		await page.evaluate(() => localStorage.setItem("ui-theme", "light"));
		await page.reload();

		const root = page.locator("html");
		await expect(root).not.toHaveClass(/dark/);

		await page.getByTestId("theme-toggle").click();
		const afterToggle = await root.evaluate((el) =>
			el.classList.contains("dark") ? "dark" : "light",
		);
		expect(afterToggle).not.toBe("light");

		await expect(root).toHaveAttribute("lang", "en");
		await expect(
			page.getByRole("heading", {
				name: /Start design.forward\. Stay lean\./,
			}),
		).toBeVisible();
	});

	test("unknown route shows not-found and returns home", async ({ page }) => {
		await page.goto("/does-not-exist");
		await expect(
			page.getByRole("heading", { name: "Page not found" }),
		).toBeVisible();
		await page.getByRole("link", { name: /back home/i }).click();
		await expect(page).toHaveURL("/");
		await expect(
			page.getByRole("heading", {
				name: /Start design.forward\. Stay lean\./,
			}),
		).toBeVisible();
	});
});
