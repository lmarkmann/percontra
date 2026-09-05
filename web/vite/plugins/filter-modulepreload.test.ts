import { describe, expect, it } from "vitest";

import { filterModulepreloadPlugin } from "./filter-modulepreload";

function runTransform(html: string): string {
	const plugin = filterModulepreloadPlugin() as unknown as {
		transformIndexHtml: {
			handler: (html: string) => string;
		};
	};
	return plugin.transformIndexHtml.handler(html);
}

describe("filterModulepreloadPlugin", () => {
	it("keeps entry modulepreload and drops lazy-route preloads", () => {
		const html = [
			'<link rel="modulepreload" crossorigin href="/assets/main-abc123.js">',
			'<link rel="modulepreload" crossorigin href="/assets/review-def456.js">',
			'<link rel="modulepreload" crossorigin href="/assets/loader-circle-ghi789.js">',
		].join("\n");

		expect(runTransform(html)).toBe(
			'<link rel="modulepreload" crossorigin href="/assets/main-abc123.js">',
		);
	});
});
