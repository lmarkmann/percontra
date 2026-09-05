import type { Plugin } from "vite";

// Faces on the first-paint path: Inter latin (UI) and Charter regular (prose).
// Both use font-display: optional, which loses the cold-visit race without a
// preload. Charter italic and bold stay lazy.
const PRELOAD_FONTS = [
	/inter-latin-wght-normal.*\.woff2$/,
	/charter_regular.*\.woff2$/,
];

export function preloadFontAssets(files: string[]): string[] {
	return files.filter((file) =>
		PRELOAD_FONTS.some((pattern) => pattern.test(file)),
	);
}

export function preloadFontsPlugin(): Plugin {
	return {
		name: "preload-fonts",
		apply: "build",
		transformIndexHtml(_html, ctx) {
			if (!ctx.bundle) return [];
			const fontAssets = preloadFontAssets(Object.keys(ctx.bundle));
			if (fontAssets.length === 0) {
				this.warn(
					"preload-fonts: no first-paint font assets matched the build bundle",
				);
			}
			return fontAssets.map((file) => ({
				tag: "link",
				attrs: {
					rel: "preload",
					as: "font",
					type: "font/woff2",
					href: `/${file}`,
					crossorigin: "",
				},
				injectTo: "head" as const,
			}));
		},
	};
}
