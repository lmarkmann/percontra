/** @type {import('@lhci/cli').LHCI.ServerCommand.Options} */
/** @type {typeof import("@playwright/test")} */
// oxlint-disable-next-line typescript/no-unsafe-call -- LHCI loads this CommonJS config directly.
const playwright = require("@playwright/test");

module.exports = {
	ci: {
		collect: {
			chromePath: playwright.chromium.executablePath(),
			// NO_COLOR so Vite prints plain "Local:" (ANSI-split "Local" + ":" fails the ready regex).
			startServerCommand:
				"NO_COLOR=1 pnpm exec vite preview --host 127.0.0.1 --port 4288",
			startServerReadyPattern: "Local:",
			startServerReadyTimeout: 120_000,
			url: ["http://127.0.0.1:4288/", "http://127.0.0.1:4288/showcase"],
			numberOfRuns: 3,
			settings: {
				preset: "desktop",
				onlyCategories: ["performance"],
				// Required for headless Chrome on GitHub Actions linux runners.
				// Must be a string: LHCI coerces an array with `+= ' --headless=new'`,
				// comma-joining it into one unknown switch Chrome ignores.
				chromeFlags: "--no-sandbox --disable-dev-shm-usage",
			},
		},
		assert: {
			assertMatrix: [
				{
					matchingUrlPattern: ".*://[^/]+/$",
					assertions: {
						// Composite score is noisy on GHA; LCP/FCP stay the hard regression gates.
						// Calibration history: docs/synthesis/slow-network-performance.md, "Lighthouse budget calibration history".
						"categories:performance": ["error", { minScore: 0.9 }],
						"largest-contentful-paint": ["error", { maxNumericValue: 1700 }],
						"first-contentful-paint": ["error", { maxNumericValue: 1400 }],
					},
				},
				{
					matchingUrlPattern: ".*showcase.*",
					assertions: {
						"categories:performance": ["error", { minScore: 0.8 }],
						"largest-contentful-paint": ["error", { maxNumericValue: 4000 }],
						"first-contentful-paint": ["error", { maxNumericValue: 3000 }],
					},
				},
			],
		},
		upload: {
			target: "filesystem",
			outputDir: ".lighthouseci/reports",
		},
	},
};
