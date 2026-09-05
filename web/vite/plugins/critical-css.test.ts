import { describe, expect, it } from "vitest";

import { findFullStylesheet, transformCriticalCssHtml } from "./critical-css";

const themeScript = `<script>const STORAGE_KEY = "ui-theme";</script>`;

describe("transformCriticalCssHtml", () => {
	it("selects the main stylesheet even when a lazy stylesheet sorts first", () => {
		expect(findFullStylesheet(["dashboard-aaa.css", "main-bbb.css"])).toBe(
			"/assets/main-bbb.css",
		);
	});

	it("inlines critical CSS after theme boot and defers the full stylesheet", () => {
		const html = [
			"<head>",
			'<link rel="stylesheet" href="/assets/critical-abc.css">',
			themeScript,
			'<link rel="stylesheet" href="/assets/main-def.css">',
			"</head>",
		].join("\n");

		const transformed = transformCriticalCssHtml(
			html,
			".hero{display:grid}",
			"/assets/main-def.css",
		);

		expect(transformed).toContain(
			`${themeScript}\n    <style id="critical">.hero{display:grid}</style>`,
		);
		expect(transformed).not.toContain(
			'rel="stylesheet" href="/assets/critical',
		);
		expect(transformed).toContain(
			'<link rel="stylesheet" href="/assets/main-def.css" media="print"',
		);
		expect(transformed).toContain(
			'<noscript><link rel="stylesheet" href="/assets/main-def.css" /></noscript>',
		);
	});

	it("refuses to transform HTML without a complete theme boot script", () => {
		expect(
			transformCriticalCssHtml("<head></head>", ".hero{}", "/assets/main.css"),
		).toBeNull();
		expect(
			transformCriticalCssHtml(
				'<script>const STORAGE_KEY = "ui-theme";',
				".hero{}",
				"/assets/main.css",
			),
		).toBeNull();
	});
});
