import { expect, test } from "@playwright/test";

import { siteName } from "./helpers/site";

function statesPanel(page: import("@playwright/test").Page) {
	return page.locator(
		'[role="tablist"][aria-label="Preview data view state"] + [role="tabpanel"]',
	);
}

test.describe("showcase preview journey", () => {
	test("loads hero, walks data states, then completes a chat round-trip", async ({
		page,
	}) => {
		await page.goto("/showcase");

		await expect(page.getByRole("heading", { name: siteName })).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Motion character" }),
		).toBeVisible();

		const panel = statesPanel(page);

		await page.getByTestId("state-tab-empty").click();
		await expect(panel.getByText("No messages yet")).toBeVisible();

		await page.getByTestId("state-tab-error").click();
		await expect(
			panel.getByText("Could not load messages. Check your connection"),
		).toBeVisible();
		await page.getByTestId("state-retry").click();
		await expect(page.getByText("Still offline")).toBeVisible();

		// Keyboard roving uses the selected tab index, so select ready first.
		await page.getByTestId("state-tab-ready").click();
		await page.getByTestId("state-tab-ready").focus();
		await page.keyboard.press("ArrowRight");
		await expect(page.getByTestId("state-tab-loading")).toHaveAttribute(
			"aria-selected",
			"true",
		);

		// Chat feature: happy path
		const composer = page.getByTestId("chat-composer");
		await composer.scrollIntoViewIfNeeded();
		await composer.fill("Hello from Playwright");
		await page.getByTestId("chat-send").click();
		await expect(page.getByTestId("chat-thinking")).toBeVisible();
		await expect(page.getByTestId("chat-message-user")).toContainText(
			"Hello from Playwright",
		);
		await expect(page.getByTestId("chat-message-assistant")).toBeVisible({
			timeout: 5000,
		});
		await expect(page.getByText("Reply received")).toBeVisible();
	});

	test("attaches a file, then recovers from a transport failure", async ({
		page,
	}) => {
		await page.goto("/showcase");
		const composer = page.getByTestId("chat-composer");
		await composer.scrollIntoViewIfNeeded();

		await page.getByTestId("chat-attach").click();
		await expect(page.getByTestId("chat-pending-attachment")).toBeVisible();
		await expect(page.getByText("Attachment ready")).toBeVisible();
		await composer.fill("See attached notes");
		await page.getByTestId("chat-send").click();
		await expect(page.getByTestId("chat-attachment")).toBeVisible({
			timeout: 5000,
		});

		await composer.fill("please fail");
		await page.getByTestId("chat-send").click();
		await expect(page.getByTestId("chat-transport-error")).toBeVisible({
			timeout: 5000,
		});
		await expect(page.getByTestId("chat-retry")).toBeVisible();
	});
});
