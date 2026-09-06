import { expect, test, vi } from "vitest";

// Pin the env surface: these assertions describe behaviour with no public
// origin configured, and a developer's .env must not decide whether they pass.
vi.mock("@/env", () => ({ env: {} }));

import type { RouteSeo } from "@/lib/seo";

import {
	absoluteUrl,
	buildSitemapXml,
	buildWebSiteJsonLd,
	indexableSeoRoutes,
	matchRouteSeo,
	routeSeo,
	seoHead,
} from "@/lib/seo";
import { getSiteOrigin } from "@/lib/site";

test("getSiteOrigin strips trailing slash", () => {
	expect(getSiteOrigin("https://example.com/")).toBe("https://example.com");
	expect(getSiteOrigin(undefined)).toBeUndefined();
});

test("absoluteUrl joins origin and path", () => {
	expect(absoluteUrl("/", "https://example.com")).toBe("https://example.com");
	expect(absoluteUrl("/states", "https://example.com")).toBe(
		"https://example.com/states",
	);
	expect(absoluteUrl("/states", undefined)).toBeUndefined();
});

// Nothing routed is indexable, so the canonical and JSON-LD branches of
// `seoHead` have no route to exercise them. They stay live code for a fork that
// opens a public surface, so the tests below feed them this literal instead.
const indexableRoute: RouteSeo = {
	path: "/",
	title: "Indexable",
	description: "A route a fork made public.",
	robots: "index,follow",
};

test("every route is noindex behind the Access gate", () => {
	expect(routeSeo.home.robots).toBe("noindex,nofollow");
	expect(routeSeo.states.robots).toBe("noindex,nofollow");
	expect(routeSeo.notFound.robots).toBe("noindex,nofollow");
	expect(indexableSeoRoutes()).toEqual([]);
});

test("route SEO matching respects path segment boundaries", () => {
	expect(matchRouteSeo("/states")).toBe(routeSeo.states);
	expect(matchRouteSeo("/states/blocked")).toBe(routeSeo.states);
	expect(matchRouteSeo("/states-old")).toBe(routeSeo.notFound);
	expect(matchRouteSeo("/state")).toBe(routeSeo.notFound);
});

test("seoHead includes title, description, robots, and social tags", () => {
	const head = seoHead(routeSeo.home, { origin: undefined });
	const titles = head.meta.filter((m) => "title" in m);
	expect(titles).toEqual([{ title: routeSeo.home.title }]);
	expect(
		head.meta.some(
			(m) =>
				"name" in m && m.name === "robots" && m.content === "noindex,nofollow",
		),
	).toBe(true);
	expect(head.links).toBeUndefined();
});

test("seoHead adds canonical and og:url only with origin", () => {
	const head = seoHead(indexableRoute, {
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
	const head = seoHead(routeSeo.states, { origin: "https://example.com" });
	expect(head.links).toBeUndefined();
});

test("buildWebSiteJsonLd is undefined without origin", () => {
	expect(buildWebSiteJsonLd(undefined)).toBeUndefined();
	const graph = buildWebSiteJsonLd("https://example.com");
	expect(graph?.["@graph"]).toBeTruthy();
});

test("buildSitemapXml lists only the paths it is given", () => {
	const xml = buildSitemapXml("https://example.com", ["/"]);
	expect(xml).toContain("<loc>https://example.com</loc>");
	expect(xml).not.toContain("/states");
});

test("buildSitemapXml defaults to nothing while no route is indexable", () => {
	expect(buildSitemapXml("https://example.com")).not.toContain("<loc>");
});
