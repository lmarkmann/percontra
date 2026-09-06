import { expect, test } from "@playwright/test";

import { siteName } from "./helpers/site";

const heroHeading = "Migration sign-off";

test.describe("home entry journey", () => {
	test("lands on the migration desk", async ({ page }) => {
		await page.goto("/");

		await expect(
			page.getByRole("heading", { name: heroHeading }),
		).toBeVisible();
		await expect(page.getByRole("link", { name: siteName })).toBeVisible();
		// No API is running behind vite preview, so the desk lands in its failed
		// state. The frame is what this asserts: chrome and hero paint either way.
		await expect(
			page.getByText(/Each posting traces to its source rows/),
		).toBeVisible();
	});

	test("unknown route shows not-found and returns home", async ({ page }) => {
		await page.goto("/does-not-exist");

		await expect(
			page.getByRole("heading", { name: "No entry on this side" }),
		).toBeVisible();
		await expect(page.getByRole("img", { name: siteName })).toBeVisible();

		await page.getByRole("link", { name: /back to the desk/i }).click();
		await expect(page).toHaveURL("/");
		await expect(
			page.getByRole("heading", { name: heroHeading }),
		).toBeVisible();
	});

	// The theme toggle ships on the shared site header, which today only the
	// not-found shell renders; the desk carries its own header instead.
	test("cycles theme without leaving the page", async ({ page }) => {
		await page.goto("/does-not-exist");
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
			page.getByRole("heading", { name: "No entry on this side" }),
		).toBeVisible();
	});
});
