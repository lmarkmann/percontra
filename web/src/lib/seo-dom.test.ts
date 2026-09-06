import type { RouteSeo } from "@/lib/seo";

import { afterEach, expect, test } from "vitest";

import { routeSeo, seoHead } from "@/lib/seo";
import { applySeoHead } from "@/lib/seo-dom";

// No routed page is indexable behind the Access gate, so the canonical and
// JSON-LD paths need a literal to exercise them. See seo.test.ts.
const indexableRoute: RouteSeo = {
	path: "/",
	title: "Indexable",
	description: "A route a fork made public.",
	robots: "index,follow",
};

afterEach(() => {
	document.head.innerHTML = "";
	document.title = "";
});

test("applySeoHead sets title, meta, and canonical from seoHead", () => {
	const head = seoHead(indexableRoute, {
		origin: "https://example.com",
		includeJsonLd: true,
	});
	applySeoHead(head);

	expect(document.title).toBe(indexableRoute.title);
	expect(
		document.head
			.querySelector('meta[name="description"]')
			?.getAttribute("content"),
	).toBe(indexableRoute.description);
	expect(
		document.head
			.querySelector('meta[property="og:title"]')
			?.getAttribute("content"),
	).toBe(indexableRoute.title);
	expect(
		document.head
			.querySelector('link[rel="canonical"][data-seo="route"]')
			?.getAttribute("href"),
	).toBe("https://example.com");
	expect(
		document.head.querySelector(
			'script[type="application/ld+json"][data-seo="route"]',
		)?.textContent,
	).toBeTruthy();
});

test("applySeoHead drops prior route SEO links and JSON-LD on noindex routes", () => {
	applySeoHead(
		seoHead(indexableRoute, {
			origin: "https://example.com",
			includeJsonLd: true,
		}),
	);
	// The states review is noindex: no canonical, no JSON-LD.
	applySeoHead(
		seoHead(routeSeo.states, {
			origin: "https://example.com",
		}),
	);

	expect(document.head.querySelectorAll('link[data-seo="route"]')).toHaveLength(
		0,
	);
	expect(
		document.head.querySelector(
			'script[type="application/ld+json"][data-seo="route"]',
		),
	).toBeNull();
	expect(document.title).toBe(routeSeo.states.title);
});
