export type RobotsDirective = "index,follow" | "noindex,nofollow";

export type RouteMetadataKey = "home" | "states" | "notFound";

type RouteMetadataEntry = { path: string; robots: RobotsDirective };

// Nothing is indexable: the origin sits behind Cloudflare Access, so a crawler
// never reaches a route. Home carries the same directive its own route head
// emits, so the two writers into <head> cannot disagree.
//
// The annotation is a Record over the key union rather than `as const satisfies`
// because either of those narrows `robots` to the one literal in use, which
// makes the indexable filter below a provably-false comparison. Adding an entry
// without widening the union is an excess-property error, so the two cannot
// drift apart.
export const routeMetadata: Record<RouteMetadataKey, RouteMetadataEntry> = {
	home: { path: "/", robots: "noindex,nofollow" },
	// Internal state review, not part of the product surface.
	states: { path: "/states", robots: "noindex,nofollow" },
	notFound: { path: "/", robots: "noindex,nofollow" },
};

const routedKeys = ["states"] as const;

export function matchRouteMetadata(pathname: string): RouteMetadataKey {
	if (pathname === "" || pathname === "/") return "home";
	for (const key of routedKeys) {
		const path = routeMetadata[key].path;
		if (pathname === path || pathname.startsWith(`${path}/`)) return key;
	}
	return "notFound";
}

export function indexableRoutePaths(): string[] {
	return Object.values(routeMetadata)
		.filter((route) => route.robots === "index,follow")
		.map((route) => route.path);
}

export function buildSitemapXml(
	origin: string,
	paths: readonly string[] = indexableRoutePaths(),
): string {
	const base = origin.replace(/\/$/, "");
	const urls = paths
		.map((routePath) => {
			const loc = routePath === "/" ? base : `${base}${routePath}`;
			return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n  </url>`;
		})
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function escapeXml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}
