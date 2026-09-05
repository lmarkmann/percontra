import { expect, test } from "vitest";

import { buildSitemapXml } from "./emit-sitemap";

test("buildSitemapXml emits the canonical home URL", () => {
	const xml = buildSitemapXml("https://app.example.com/");

	expect(xml).toContain("<loc>https://app.example.com</loc>");
	expect(xml).not.toContain("https://app.example.com//");
});
