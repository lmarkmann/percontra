import type { Plugin } from "vite";

import { writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";

import { buildSitemapXml } from "../../src/lib/route-metadata";

export { buildSitemapXml };

/**
 * When `VITE_APP_URL` is set, write `sitemap.xml` into the client out dir
 * (`dist/client/` under the Cloudflare plugin). Skipped without origin so we
 * never ship example.com locs.
 */
export function emitSitemapPlugin(): Plugin {
	let appUrl = "";
	return {
		name: "emit-sitemap",
		apply: "build",
		applyToEnvironment: (environment) => environment.name === "client",
		configResolved(config) {
			appUrl = loadEnv(config.mode, config.envDir, "VITE_").VITE_APP_URL ?? "";
		},
		closeBundle() {
			if (!appUrl) return;
			const origin = appUrl.replace(/\/$/, "");
			const target = path.resolve(
				this.environment.config.root,
				this.environment.config.build.outDir,
				"sitemap.xml",
			);
			writeFileSync(target, buildSitemapXml(origin), "utf8");
		},
	};
}
