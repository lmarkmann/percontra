import { expect, test } from "@playwright/test";

test("persists one offline send across reload and flushes it exactly once", async ({
	context,
	page,
}) => {
	await page.goto("/showcase");
	const composer = page.getByTestId("chat-composer");
	await composer.scrollIntoViewIfNeeded();
	await page.evaluate(async () => {
		await navigator.serviceWorker.ready;
		if (!navigator.serviceWorker.controller) {
			await new Promise<void>((resolve) => {
				navigator.serviceWorker.addEventListener(
					"controllerchange",
					() => resolve(),
					{
						once: true,
					},
				);
			});
		}
	});
	await page.reload();
	await composer.scrollIntoViewIfNeeded();

	await context.setOffline(true);
	await expect(page.getByTestId("chat-offline-pill")).toBeVisible();
	await composer.fill("Queued exactly once");
	await page.getByTestId("chat-send").click();
	await expect(page.getByTestId("chat-queued-hint")).toContainText("1 message");

	await page.reload();
	await expect(page.getByTestId("chat-queued-hint")).toContainText("1 message");
	await context.setOffline(false);

	await expect(page.getByTestId("chat-message-assistant")).toHaveCount(1, {
		timeout: 5000,
	});
	await expect(page.getByTestId("chat-queued-hint")).toHaveCount(0);
	await page.waitForTimeout(900);
	await expect(page.getByTestId("chat-message-assistant")).toHaveCount(1);
});
