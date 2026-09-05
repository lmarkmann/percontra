import { expect, test } from "vitest";

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

test("home is indexable; demos and auth are noindex", () => {
	expect(routeSeo.home.robots).toBe("index,follow");
	expect(routeSeo.showcase.robots).toBe("noindex,nofollow");
	expect(routeSeo.login.robots).toBe("noindex,nofollow");
	expect(routeSeo.dashboard.robots).toBe("noindex,nofollow");
	expect(routeSeo.notFound.robots).toBe("noindex,nofollow");
	expect(indexableSeoRoutes().map((r) => r.path)).toEqual(["/"]);
});

test("route SEO matching respects path segment boundaries", () => {
	expect(matchRouteSeo("/login")).toBe(routeSeo.login);
	expect(matchRouteSeo("/login/help")).toBe(routeSeo.login);
	expect(matchRouteSeo("/login-help")).toBe(routeSeo.notFound);
	expect(matchRouteSeo("/dashboards")).toBe(routeSeo.notFound);
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
	const head = seoHead(routeSeo.login, { origin: "https://example.com" });
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
