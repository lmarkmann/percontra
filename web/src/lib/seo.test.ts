import { expect, test, vi } from "vitest";

// Pin the env surface: these assertions describe behaviour with no public
// origin configured, and a developer's .env must not decide whether they pass.
vi.mock("@/env", () => ({ env: {} }));

import {
	absoluteUrl,
	buildSitemapXml,
	buildWebSiteJsonLd,
	indexableSeoRoutes,
	matchRouteSeo,
	routeSeo,
	seoHead,
} from "@/lib/seo";
import { getSiteOrigin, site } from "@/lib/site";

test("getSiteOrigin strips trailing slash", () => {
	expect(getSiteOrigin("https://example.com/")).toBe("https://example.com");
	expect(getSiteOrigin(undefined)).toBeUndefined();
});

test("absoluteUrl joins origin and path", () => {
	expect(absoluteUrl("/", "https://example.com")).toBe("https://example.com");
	expect(absoluteUrl("/login", "https://example.com")).toBe(
		"https://example.com/login",
	);
	expect(absoluteUrl("/login", undefined)).toBeUndefined();
});

test("home is indexable; the work surfaces are noindex", () => {
	expect(routeSeo.home.robots).toBe("index,follow");
	expect(routeSeo.review.robots).toBe("noindex,nofollow");
	expect(routeSeo.release.robots).toBe("noindex,nofollow");
	expect(routeSeo.notFound.robots).toBe("noindex,nofollow");
	expect(indexableSeoRoutes().map((r) => r.path)).toEqual(["/"]);
});

test("route SEO matching respects path segment boundaries", () => {
	expect(matchRouteSeo("/review")).toBe(routeSeo.review);
	expect(matchRouteSeo("/review/gap-12")).toBe(routeSeo.review);
	expect(matchRouteSeo("/review-queue")).toBe(routeSeo.notFound);
	expect(matchRouteSeo("/releases")).toBe(routeSeo.notFound);
});

test("seoHead includes title, description, robots, and social tags", () => {
	const head = seoHead(routeSeo.home, { origin: undefined });
	const titles = head.meta.filter((m) => "title" in m);
	expect(titles).toEqual([{ title: site.name }]);
	expect(
		head.meta.some(
			(m) => "name" in m && m.name === "robots" && m.content === "index,follow",
		),
	).toBe(true);
	expect(head.links).toBeUndefined();
});

test("seoHead adds canonical and og:url only with origin", () => {
	const head = seoHead(routeSeo.home, {
		origin: "https://example.com",
		includeJsonLd: true,
	});
	expect(head.links).toEqual([
		{ rel: "canonical", href: "https://example.com" },
	]);
	expect(
		head.meta.some(
			(m) =>
				"property" in m &&
				m.property === "og:url" &&
				m.content === "https://example.com",
		),
	).toBe(true);
	expect(head.scripts?.[0]?.type).toBe("application/ld+json");
});

test("noindex routes skip canonical", () => {
	const head = seoHead(routeSeo.review, { origin: "https://example.com" });
	expect(head.links).toBeUndefined();
});

test("buildWebSiteJsonLd is undefined without origin", () => {
	expect(buildWebSiteJsonLd(undefined)).toBeUndefined();
	const graph = buildWebSiteJsonLd("https://example.com");
	expect(graph?.["@graph"]).toBeTruthy();
});

test("buildSitemapXml lists only indexable absolute locs", () => {
	const xml = buildSitemapXml("https://example.com");
	expect(xml).toContain("<loc>https://example.com</loc>");
	expect(xml).not.toContain("/login");
	expect(xml).not.toContain("/showcase");
});
