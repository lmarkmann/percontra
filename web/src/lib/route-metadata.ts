export type RobotsDirective = "index,follow" | "noindex,nofollow";

export const routeMetadata = {
	home: { path: "/", robots: "index,follow" },
	review: { path: "/review", robots: "noindex,nofollow" },
	release: { path: "/release", robots: "noindex,nofollow" },
	// Internal state review, not part of the product surface.
	states: { path: "/states", robots: "noindex,nofollow" },
	notFound: { path: "/", robots: "noindex,nofollow" },
} as const satisfies Record<string, { path: string; robots: RobotsDirective }>;

export type RouteMetadataKey = keyof typeof routeMetadata;

const routedKeys = ["review", "release", "states"] as const;

export function matchRouteMetadata(pathname: string): RouteMetadataKey {
	if (pathname === "" || pathname === "/") return "home";
	for (const key of routedKeys) {
		const path = routeMetadata[key].path;
		if (pathname === path || pathname.startsWith(`${path}/`)) return key;
	}
	return "notFound";
}

function indexableRoutePaths(): string[] {
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
