import { describe, expect, it } from "vitest";

import {
	cacheNameForPrecache,
	precacheFromBuildHtml,
	renderServiceWorkerScript,
} from "./emit-service-worker";

describe("precacheFromBuildHtml", () => {
	it("includes the built home graph and critical font faces", () => {
		const html = [
			'<script type="module" src="/assets/main-abc123.js"></script>',
			'<link rel="modulepreload" href="/assets/react-def456.js">',
			'<link rel="stylesheet" href="/assets/main-ghi789.css">',
		].join("\n");

		expect(
			precacheFromBuildHtml(html, [
				"main-abc123.js",
				"react-def456.js",
				"main-ghi789.css",
				"inter-latin-wght-normal-font.woff2",
				"inter-latin-ext-wght-normal-font.woff2",
				"charter_regular-font.woff2",
			]),
		).toEqual([
			"/",
			"/assets/main-abc123.js",
			"/assets/react-def456.js",
			"/assets/main-ghi789.css",
			"/assets/inter-latin-wght-normal-font.woff2",
			"/assets/charter_regular-font.woff2",
		]);
	});

	it("keeps the SPA document in an otherwise empty precache", () => {
		expect(precacheFromBuildHtml("", [])).toEqual(["/"]);
	});
});

describe("cacheNameForPrecache", () => {
	it("gives identical lists identical names, regardless of order", () => {
		const name = cacheNameForPrecache(["/assets/a.js", "/assets/b.css"]);
		expect(cacheNameForPrecache(["/assets/b.css", "/assets/a.js"])).toBe(name);
		expect(name).toMatch(/^vite-template-[0-9a-f]{12}$/);
	});

	it("gives different lists different names", () => {
		expect(cacheNameForPrecache(["/assets/main-abc.js"])).not.toBe(
			cacheNameForPrecache(["/assets/main-def.js"]),
		);
	});
});

describe("renderServiceWorkerScript", () => {
	const precache = ["/assets/main-abc.js", "/assets/critical-def.css"];
	const cacheName = cacheNameForPrecache(precache);
	const script = renderServiceWorkerScript(precache, cacheName);

	it("names the cache after the precache content", () => {
		expect(script).toContain(`const CACHE = ${JSON.stringify(cacheName)};`);
	});

	it("embeds the precache list for install", () => {
		expect(script).toContain(JSON.stringify(precache));
		expect(script).toContain("cache.addAll(PRECACHE)");
	});

	it("prunes active-cache entries outside the precache allowlist", () => {
		expect(script).toContain(
			"!PRECACHE.includes(new URL(request.url).pathname)",
		);
		expect(script).toContain("cache.delete(request)");
	});

	it("gates the runtime cache to GET requests under /assets/", () => {
		expect(script).toContain('if (request.method !== "GET") return;');
		expect(script).toContain('url.pathname.startsWith("/assets/")');
	});

	it("uses the cached SPA document only when a navigation request fails", () => {
		expect(script).toContain('if (request.mode === "navigate")');
		expect(script).toContain('const cached = await caches.match("/")');
		expect(script).toContain("return new Response(cached.body");
	});

	it("keeps the update lifecycle calls", () => {
		expect(script).toContain("self.skipWaiting()");
		expect(script).toContain("self.clients.claim()");
	});
});
