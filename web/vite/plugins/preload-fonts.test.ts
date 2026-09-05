import { describe, expect, it, test, vi } from "vitest";

import { preloadFontAssets, preloadFontsPlugin } from "./preload-fonts";

type TransformResult =
	| Array<{ tag: string; attrs: Record<string, string>; injectTo: string }>
	| undefined;

function runTransform(bundleKeys: string[] | null): TransformResult {
	const plugin = preloadFontsPlugin() as unknown as {
		transformIndexHtml: (
			html: string,
			ctx: { bundle?: Record<string, unknown> },
		) => TransformResult;
	};
	const ctx =
		bundleKeys === null
			? {}
			: { bundle: Object.fromEntries(bundleKeys.map((key) => [key, {}])) };
	return plugin.transformIndexHtml("", ctx);
}

test("preloadFontAssets excludes the unicode-range-gated latin-ext face", () => {
	expect(
		preloadFontAssets([
			"assets/inter-latin-wght-normal-a.woff2",
			"assets/inter-latin-ext-wght-normal-b.woff2",
			"assets/charter_regular-c.woff2",
		]),
	).toEqual([
		"assets/inter-latin-wght-normal-a.woff2",
		"assets/charter_regular-c.woff2",
	]);
});

describe("preloadFontsPlugin", () => {
	it("emits preload links for Inter latin and Charter regular only", () => {
		expect(
			runTransform([
				"assets/inter-latin-wght-normal-a1b2c3.woff2",
				"assets/charter_regular-d4e5f6.woff2",
				"assets/charter_italic-g7h8i9.woff2",
				"assets/charter_bold-j1k2l3.woff2",
				"assets/main-x1y2z3.js",
			]),
		).toEqual([
			{
				tag: "link",
				attrs: {
					rel: "preload",
					as: "font",
					type: "font/woff2",
					href: "/assets/inter-latin-wght-normal-a1b2c3.woff2",
					crossorigin: "",
				},
				injectTo: "head",
			},
			{
				tag: "link",
				attrs: {
					rel: "preload",
					as: "font",
					type: "font/woff2",
					href: "/assets/charter_regular-d4e5f6.woff2",
					crossorigin: "",
				},
				injectTo: "head",
			},
		]);
	});

	it("no-ops without a bundle (dev and serve)", () => {
		expect(runTransform(null)).toEqual([]);
	});

	it("warns when no critical font matches", () => {
		const warn = vi.fn();
		const plugin = preloadFontsPlugin() as unknown as {
			transformIndexHtml: (
				this: { warn: (message: string) => void },
				html: string,
				ctx: { bundle: Record<string, unknown> },
			) => TransformResult;
		};
		const transformed = plugin.transformIndexHtml.call({ warn }, "", {
			bundle: { "assets/main-x1y2z3.js": {} },
		});

		expect(transformed).toEqual([]);
		expect(warn).toHaveBeenCalledWith(
			"preload-fonts: no first-paint font assets matched the build bundle",
		);
	});
});
