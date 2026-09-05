import type { Plugin } from "vite";

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { preloadFontAssets } from "./preload-fonts";

export function precacheFromBuildHtml(
	html: string,
	assetFiles: string[],
): string[] {
	const htmlAssets = [
		...html.matchAll(/\b(?:href|src)=["'](\/assets\/[^"'?#]+)["']/g),
	]
		.map((match) => match[1])
		.filter((asset): asset is string => Boolean(asset));
	const fontAssets = preloadFontAssets(assetFiles).map(
		(file) => `/assets/${file}`,
	);
	return [...new Set(["/", ...htmlAssets, ...fontAssets])];
}

/**
 * Content-addressed cache identity: a build with a different precache list
 * gets a different cache name, so activate drops the previous build's cache
 * instead of letting stale fingerprinted assets accumulate forever.
 */
export function cacheNameForPrecache(precache: string[]): string {
	const digest = createHash("sha256")
		.update([...precache].toSorted().join("\n"))
		.digest("hex")
		.slice(0, 12);
	return `vite-template-${digest}`;
}

export function renderServiceWorkerScript(
	precache: string[],
	cacheName: string,
): string {
	return `/* Generated at build; precaches home-critical fingerprinted assets. */
const CACHE = ${JSON.stringify(cacheName)};
const PRECACHE = ${JSON.stringify(precache)};

self.addEventListener("install", (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		Promise.all([
			caches.keys().then((keys) =>
				Promise.all(
					keys
						.filter((key) => key.startsWith("vite-template-") && key !== CACHE)
						.map((key) => caches.delete(key)),
				),
			),
			caches.open(CACHE).then((cache) =>
				cache.keys().then((requests) =>
					Promise.all(
						requests
							.filter(
								(request) => !PRECACHE.includes(new URL(request.url).pathname),
							)
							.map((request) => cache.delete(request)),
					),
				),
			),
		]),
	);
	self.clients.claim();
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	if (request.method !== "GET") return;
	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request).catch(async () => {
				const cached = await caches.match("/");
				if (!cached) throw new Error("Cached SPA document is unavailable");
				return new Response(cached.body, {
					status: cached.status,
					statusText: cached.statusText,
					headers: cached.headers,
				});
			}),
		);
		return;
	}
	const url = new URL(request.url);
	if (!url.pathname.startsWith("/assets/")) return;
	event.respondWith(
		caches.match(request).then(
			(cached) =>
				cached ??
				fetch(request).then((response) => {
					if (!response.ok) return response;
					const copy = response.clone();
					caches.open(CACHE).then((cache) => cache.put(request, copy));
					return response;
				}),
		),
	);
});
`;
}

export function emitServiceWorkerPlugin(): Plugin {
	return {
		name: "emit-service-worker",
		apply: "build",
		// sw.js belongs next to index.html in the client output only.
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
				let assetFiles: string[];
				let html: string;
				try {
					assetFiles = readdirSync(assetsDir);
					html = readFileSync(indexHtmlPath, "utf8");
				} catch {
					this.warn(
						`emit-service-worker: build output missing under ${distDir}, skipping sw.js`,
					);
					return;
				}

				const precache = precacheFromBuildHtml(html, assetFiles);
				const sw = renderServiceWorkerScript(
					precache,
					cacheNameForPrecache(precache),
				);

				writeFileSync(path.join(distDir, "sw.js"), sw);
			},
		},
	};
}
