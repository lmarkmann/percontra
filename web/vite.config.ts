import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";

import { absoluteOgUrlsPlugin } from "./vite/plugins/absolute-og-urls";
import { criticalCssPlugin } from "./vite/plugins/critical-css";
import { emitServiceWorkerPlugin } from "./vite/plugins/emit-service-worker";
import { emitSitemapPlugin } from "./vite/plugins/emit-sitemap";
import { filterModulepreloadPlugin } from "./vite/plugins/filter-modulepreload";
import { optionalSeamsPlugin } from "./vite/plugins/optional-seams";
import { preloadFontsPlugin } from "./vite/plugins/preload-fonts";

// Cloudflare plugin: workerd parity for dev/preview/build; off under Vitest or it boots workerd
// beneath the happy-dom unit suite. Rationale and output layout: docs/reference/architecture.md, "Vitest guard".
const underVitest = Boolean(process.env.VITEST);
// Bundle analysis is opt-in (ANALYZE=1 pnpm build): gating it keeps visualizer out of CI's build step and stops dist/stats.html from shipping as a deployed asset. Nothing runs it on the normal build or deploy path.
const analyze = Boolean(process.env.ANALYZE);

// https://vite.dev/config/
export default defineConfig(async () => {
	const cloudflarePlugin = underVitest
		? null
		: (await import("@cloudflare/vite-plugin")).cloudflare;

	return {
		plugins: [
			optionalSeamsPlugin(),
			absoluteOgUrlsPlugin(),
			// Route knobs live in tsr.config.json (single source; CLI + plugin both load it). Must run before react() so route tree generation sees source files first.
			tanstackRouter(),
			react(),
			tailwindcss(),
			preloadFontsPlugin(),
			!underVitest && filterModulepreloadPlugin(),
			!underVitest && emitServiceWorkerPlugin(),
			!underVitest && emitSitemapPlugin(),
			!underVitest && criticalCssPlugin(),
			cloudflarePlugin?.(),
			analyze &&
				visualizer({
					open: true,
					brotliSize: true,
					filename: "dist/stats.html",
				}),
		],
		// Scoped to the client environment: the Cloudflare plugin's Worker
		// environment brings its own entry (server/index.ts) and must not inherit
		// the HTML + critical CSS inputs.
		environments: {
			client: {
				build: {
					rollupOptions: {
						input: {
							main: path.resolve(__dirname, "index.html"),
							critical: path.resolve(__dirname, "src/critical.css"),
						},
					},
				},
			},
		},
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
			// Prefer browser conditions when Vitest loads deps in happy-dom.
			...(underVitest ? { conditions: ["browser", "module", "import"] } : {}),
		},
		test: {
			// Keep vite/plugins unit tests; drop Playwright, Vitest defaults, and
			// any agent worktrees parked under .claude/.
			exclude: [...configDefaults.exclude, "e2e/**", "**/.claude/**"],
			environment: "happy-dom" as const,
			// Avoid happy-dom teardown races when routeTree pulls large UI graphs.
			pool: "forks" as const,
			clearMocks: true,
			restoreMocks: true,
			setupFiles: ["./src/test/setup.ts"],
			coverage: {
				provider: "v8" as const,
				include: ["src/lib/**", "src/hooks/**", "server/**", "vite/plugins/**"],
				// Optional seams / knip-ignored dead code: out of the gate until they ship.
				exclude: ["src/lib/auth-provider.tsx"],
				thresholds: {
					"src/lib/**": { lines: 80, functions: 80 },
					"server/**": { lines: 97, statements: 97, functions: 99 },
					"vite/plugins/**": {
						lines: 59,
						statements: 60,
						functions: 67,
					},
					// Hooks are pure logic; hold them to a higher bar than lib seams.
					"src/hooks/**": {
						lines: 90,
						functions: 90,
						statements: 90,
					},
				},
			},
		},
	};
});
