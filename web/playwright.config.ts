import { defineConfig, devices } from "@playwright/test";

const port = 4287;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	// CI keeps the HTML report (screenshots of every test, video and trace of
	// failures) and ci.yml uploads playwright-report/ as a run artifact.
	reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
	use: {
		baseURL,
		trace: "on-first-retry",
		screenshot: process.env.CI ? "on" : "off",
		video: process.env.CI ? "retain-on-failure" : "off",
	},
	webServer: {
		// preview serves the last build; rebuild locally so e2e never tests a stale dist (CI builds two steps earlier)
		command: process.env.CI
			? `pnpm exec vite preview --host 127.0.0.1 --port ${port}`
			: `pnpm run build && pnpm exec vite preview --host 127.0.0.1 --port ${port}`,
		url: baseURL,
		reuseExistingServer: false,
		timeout: 240_000,
	},
	projects: [
		{
			name: "chromium",
			testIgnore: /mobile-overflow\.spec\.ts/,
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "mobile-overflow",
			testMatch: /mobile-overflow\.spec\.ts/,
			// iPhone viewport for the overflow check, but on chromium: the spec
			// asserts layout width, not engine behavior, and CI installs only
			// chromium (webkit would add a per-run download for nothing).
			use: { ...devices["iPhone 13"], browserName: "chromium" },
		},
	],
});
