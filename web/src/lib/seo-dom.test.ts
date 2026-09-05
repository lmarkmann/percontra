import { afterEach, expect, test } from "vitest";

import { routeSeo, seoHead } from "@/lib/seo";
import { applySeoHead } from "@/lib/seo-dom";

afterEach(() => {
	document.head.innerHTML = "";
	document.title = "";
});

test("applySeoHead sets title, meta, and canonical from seoHead", () => {
	const head = seoHead(routeSeo.home, {
		origin: "https://example.com",
		includeJsonLd: true,
	});
	applySeoHead(head);

	expect(document.title).toBe(routeSeo.home.title);
	expect(
		document.head
			.querySelector('meta[name="description"]')
			?.getAttribute("content"),
	).toBe(routeSeo.home.description);
	expect(
		document.head
			.querySelector('meta[property="og:title"]')
			?.getAttribute("content"),
	).toBe(routeSeo.home.title);
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
		seoHead(routeSeo.home, {
			origin: "https://example.com",
			includeJsonLd: true,
		}),
	);
	// The review queue is noindex: no canonical, no JSON-LD.
	applySeoHead(
		seoHead(routeSeo.review, {
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
	expect(document.title).toBe(routeSeo.review.title);
});
