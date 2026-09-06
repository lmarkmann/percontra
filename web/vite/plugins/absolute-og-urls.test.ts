import { afterEach, describe, expect, it, vi } from "vitest";

import { absoluteOgUrlsPlugin } from "./absolute-og-urls";

type TransformIndexHtml = (
	html: string,
	ctx: { server?: { config: { env: Record<string, string> } } },
) => string;

type ConfigResolved = (config: { mode: string; envDir: string }) => void;

function transform(html: string, appUrl?: string): string {
	const plugin = absoluteOgUrlsPlugin() as unknown as {
		transformIndexHtml: TransformIndexHtml;
	};
	const ctx = appUrl
		? { server: { config: { env: { VITE_APP_URL: appUrl } } } }
		: {};
	return plugin.transformIndexHtml(html, ctx);
}

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("absoluteOgUrlsPlugin", () => {
	it("absolutizes social images and adds home URL metadata", () => {
		const html = [
			'<meta property="og:type" content="website" />',
			'<meta property="og:image" content="/og-image.png" />',
			'<meta name="twitter:image" content="/og-image.png" />',
			"<title>App</title>",
		].join("\n");

		const transformed = transform(html, "https://app.example.com/");

		expect(transformed).toContain(
			'property="og:image" content="https://app.example.com/og-image.png"',
		);
		expect(transformed).toContain(
			'property="og:url" content="https://app.example.com/"',
		);
		expect(transformed).toContain(
			'rel="canonical" href="https://app.example.com/"',
		);
	});

	it("leaves HTML unchanged without an app origin", () => {
		vi.stubEnv("VITE_APP_URL", "");
		expect(transform("<title>App</title>")).toBe("<title>App</title>");
	});

	it("loads the app origin from the build mode environment", () => {
		vi.stubEnv("VITE_APP_URL", "https://production.example.com");
		const plugin = absoluteOgUrlsPlugin() as unknown as {
			configResolved: ConfigResolved;
			transformIndexHtml: TransformIndexHtml;
		};
		plugin.configResolved({ mode: "production", envDir: process.cwd() });

		expect(
			plugin.transformIndexHtml(
				'<meta property="og:image" content="/og-image.png" />',
				{},
			),
		).toContain("https://production.example.com/og-image.png");
	});
});
