import { expect, test } from "@playwright/test";

test("showcase contains horizontal overflow inside its owning scrollers", async ({
	page,
}) => {
	await page.goto("/showcase");
	await expect(
		page.getByRole("heading", { name: "vite-template" }),
	).toBeVisible();

	const pageWidth = await page.evaluate(() => ({
		client: document.documentElement.clientWidth,
		scroll: document.documentElement.scrollWidth,
	}));
	expect(pageWidth.scroll).toBeLessThanOrEqual(pageWidth.client);
});
