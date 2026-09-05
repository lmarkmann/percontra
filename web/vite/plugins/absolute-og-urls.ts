import type { Plugin } from "vite";

import { loadEnv } from "vite";

/**
 * When `VITE_APP_URL` is set, rewrite relative social image meta to absolute URLs
 * and inject home canonical + og:url for first-paint crawlers that only read
 * index.html. Clones leave the env unset for local preview.
 *
 * Keep home meta content in sync with `src/lib/seo.ts` (`routeSeo.home`).
 */
export function absoluteOgUrlsPlugin(): Plugin {
	let appUrl = "";
	return {
		name: "absolute-og-urls",
		configResolved(config) {
			appUrl = loadEnv(config.mode, config.envDir, "VITE_").VITE_APP_URL ?? "";
		},
		transformIndexHtml(html, ctx) {
			const fromServer: unknown = ctx.server?.config.env.VITE_APP_URL;
			const raw = typeof fromServer === "string" ? fromServer : appUrl;
			if (!raw) {
				return html;
			}
			const origin = raw.replace(/\/$/, "");
			let next = html
				.replaceAll(
					'content="/og-image.svg"',
					`content="${origin}/og-image.svg"`,
				)
				.replaceAll(
					"content='/og-image.svg'",
					`content='${origin}/og-image.svg'`,
				);

			if (!next.includes('property="og:url"')) {
				next = next.replace(
					'<meta property="og:type" content="website" />',
					`<meta property="og:type" content="website" />\n\t\t<meta property="og:url" content="${origin}/" />`,
				);
			}

			if (!next.includes('rel="canonical"')) {
				next = next.replace(
					"<title>",
					`<link rel="canonical" href="${origin}/" />\n\t\t<title>`,
				);
			}

			return next;
		},
	};
}
