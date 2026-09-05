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

// Build-output plugins are off under Vitest: they write dist artifacts the
// happy-dom unit suite neither needs nor can serve.
const underVitest = Boolean(process.env.VITEST);

// The API and the built SPA are served same-origin by Django in production
// (WhiteNoise over web/dist/client). The proxy reproduces that in dev so
// relative /api paths work identically in both.
const apiOrigin = process.env.PERCONTRA_API_ORIGIN ?? "http://127.0.0.1:8080";
// Bundle analysis is opt-in (ANALYZE=1 pnpm build): gating it keeps visualizer out of CI's build step and stops dist/stats.html from shipping as a deployed asset. Nothing runs it on the normal build or deploy path.
const analyze = Boolean(process.env.ANALYZE);

// https://vite.dev/config/
export default defineConfig(() => {
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
			analyze &&
				visualizer({
					open: true,
					brotliSize: true,
					filename: "dist/stats.html",
				}),
		],
		build: {
			outDir: "dist/client",
			rollupOptions: {
				input: {
					main: path.resolve(__dirname, "index.html"),
					// Second entry so the critical above-fold bundle is emitted
					// fingerprinted for critical-css to inline.
					critical: path.resolve(__dirname, "src/critical.css"),
				},
			},
		},
		server: {
			proxy: { "/api": { target: apiOrigin, changeOrigin: true } },
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
				include: ["src/lib/**", "src/hooks/**", "vite/plugins/**"],
				// Optional seams / knip-ignored dead code: out of the gate until they ship.
				exclude: ["src/lib/auth-provider.tsx"],
				thresholds: {
					"src/lib/**": { lines: 80, functions: 80 },
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
