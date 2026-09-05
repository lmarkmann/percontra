import type { Plugin } from "vite";

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const THEME_SCRIPT_MARKER = 'const STORAGE_KEY = "ui-theme"';

function findCriticalStylesheet(assetsDir: string): string | null {
	const files = readdirSync(assetsDir);
	const match = files.find(
		(file) => file.startsWith("critical-") && file.endsWith(".css"),
	);
	return match ? `/assets/${match}` : null;
}

export function findFullStylesheet(files: string[]): string | null {
	const match = files.find(
		(file) => file.startsWith("main-") && file.endsWith(".css"),
	);
	return match ? `/assets/${match}` : null;
}

function asyncStylesheet(href: string): string {
	return [
		`<link rel="preload" href="${href}" as="style" />`,
		`<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'" />`,
		`<noscript><link rel="stylesheet" href="${href}" /></noscript>`,
	].join("\n    ");
}

export function transformCriticalCssHtml(
	html: string,
	criticalCss: string,
	fullHref: string,
): string | null {
	const themeScriptStart = html.indexOf(THEME_SCRIPT_MARKER);
	if (themeScriptStart === -1) return null;
	const themeScriptEnd = html.indexOf("</script>", themeScriptStart);
	if (themeScriptEnd === -1) return null;

	const withoutStylesheets = html.replace(
		/\s*<link rel="stylesheet"[^>]*href="[^"]+\.css"[^>]*>\n?/g,
		"",
	);
	const inlineCritical = `<style id="critical">${criticalCss}</style>`;
	const injection = `\n    ${inlineCritical}\n    ${asyncStylesheet(fullHref)}`;
	const strippedScriptStart = withoutStylesheets.indexOf(THEME_SCRIPT_MARKER);
	const strippedScriptEnd = withoutStylesheets.indexOf(
		"</script>",
		strippedScriptStart,
	);
	const injectionPoint = strippedScriptEnd + "</script>".length;
	return (
		withoutStylesheets.slice(0, injectionPoint) +
		injection +
		withoutStylesheets.slice(injectionPoint)
	);
}

export function criticalCssPlugin(): Plugin {
	return {
		name: "critical-css",
		apply: "build",
		// The Cloudflare plugin adds a Worker environment whose closeBundle would
		// fire too; only the client output has index.html and the CSS assets.
		applyToEnvironment: (environment) => environment.name === "client",
		closeBundle: {
			order: "post",
			handler() {
				const distDir = path.resolve(
					this.environment.config.root,
					this.environment.config.build.outDir,
				);
				const assetsDir = path.join(distDir, "assets");
				const indexHtmlPath = path.join(distDir, "index.html");
				try {
					readdirSync(assetsDir);
				} catch {
					this.warn(
						`critical-css: ${assetsDir} not found, skipping critical CSS inlining`,
					);
					return;
				}

				const criticalHref = findCriticalStylesheet(assetsDir);
				const fullHref = findFullStylesheet(readdirSync(assetsDir));
				if (!criticalHref || !fullHref) {
					this.warn(
						`critical-css: could not locate ${criticalHref ? "the full" : "a critical"} stylesheet in ${assetsDir}, skipping inlining`,
					);
					return;
				}

				const criticalPath = path.join(
					distDir,
					criticalHref.replace(/^\//, ""),
				);
				const criticalCss = readFileSync(criticalPath, "utf8");
				const html = readFileSync(indexHtmlPath, "utf8");
				const transformed = transformCriticalCssHtml(
					html,
					criticalCss,
					fullHref,
				);
				if (transformed === null && !html.includes(THEME_SCRIPT_MARKER)) {
					this.warn(
						"critical-css: theme boot script marker not found in index.html, skipping inlining",
					);
					return;
				}
				if (transformed === null) {
					this.warn(
						"critical-css: unterminated theme boot <script> in index.html, skipping inlining",
					);
					return;
				}

				writeFileSync(indexHtmlPath, transformed);
				// Do not delete the hashed critical CSS URL: route chunks still preload
				// it, and a 404 (SPA HTML) throws "Unable to preload CSS" into
				// ErrorBoundary on lazy routes. Replace with a stub so size-limit
				// does not double-count the inlined critical bytes.
				writeFileSync(
					criticalPath,
					"/* critical CSS inlined into index.html */\n",
				);
			},
		},
	};
}
