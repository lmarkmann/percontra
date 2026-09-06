import { expect, test } from "vitest";

import { buildSitemapXml } from "./emit-sitemap";

test("buildSitemapXml emits the canonical home URL", () => {
	const xml = buildSitemapXml("https://app.example.com/", ["/"]);

	expect(xml).toContain("<loc>https://app.example.com</loc>");
	expect(xml).not.toContain("https://app.example.com//");
});

test("buildSitemapXml emits no locs while nothing is indexable", () => {
	// The plugin bails before writing in this case, so the build ships no
	// sitemap.xml rather than an empty urlset.
	expect(buildSitemapXml("https://app.example.com")).not.toContain("<loc>");
});
