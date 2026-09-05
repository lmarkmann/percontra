import type { Plugin } from "vite";

const ENTRY_CHUNK = /(?:^|\/)assets\/main-[^/]+\.js$/;

/** Lazy route and optional SDK chunks that must not compete with entry on `/`. */
export const DEFERRED_CHUNK_PREFIXES = [
	"MotionConfig-",
	"_-",
	"_optional-seam_",
	"not-found-",
	"motion-",
	"review-",
	"release-",
	"loader-circle-",
	"copy-button-",
	"dist-",
	"empty-",
	"icon-swap-",
	"input-",
	"routes-",
	"shadowDom-",
	"skeleton-",
	"theme-toggle-lean-",
	"posthog",
	"sonner-",
	"toaster-",
] as const;

function shouldDeferPreload(assetPath: string): boolean {
	return DEFERRED_CHUNK_PREFIXES.some((prefix) =>
		assetPath.startsWith(`assets/${prefix}`),
	);
}

/**
 * Trim Vite's automatic modulepreload list so slow-network home loads do not
 * fetch lazy-route chunks before the entry script finishes.
 */
export function filterModulepreloadPlugin(): Plugin {
	return {
		name: "filter-modulepreload",
		apply: "build",
		transformIndexHtml: {
			order: "post",
			handler(html) {
				return html
					.split("\n")
					.filter((line) => {
						if (!line.includes('rel="modulepreload"')) return true;
						const hrefMatch = line.match(/href="([^"]+)"/);
						if (!hrefMatch) return true;
						const href = hrefMatch[1] ?? "";
						if (ENTRY_CHUNK.test(href)) return true;
						const assetPath = href.replace(/^\//, "");
						return !shouldDeferPreload(assetPath);
					})
					.join("\n");
			},
		},
	};
}
