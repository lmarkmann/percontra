import {
	buildSitemapXml,
	matchRouteMetadata,
	routeMetadata,
	type RobotsDirective,
} from "@/lib/route-metadata";
/**
 * Route SEO map and head builders.
 *
 * Single source of truth for title, description, robots, canonical/og paths.
 * Home first-paint values in `index.html` must stay aligned with `routeSeo.home`
 * (comment there when you change either).
 *
 * Absolute social/canonical/JSON-LD/sitemap require `VITE_APP_URL`.
 */
import { getSiteOrigin, site } from "@/lib/site";

export { buildSitemapXml };

/** @public */
export type RouteSeo = {
	title: string;
	description: string;
	/** Path for canonical / og:url (leading slash). */
	path: string;
	robots?: RobotsDirective;
	ogImage?: string;
};

export const routeSeo = {
	home: {
		...routeMetadata.home,
		title: `${site.name} | Migration review`,
		description: site.description,
		ogImage: site.defaultOgImage,
	},
	states: {
		...routeMetadata.states,
		title: `${site.name} | States review`,
		description:
			"Every non-happy state the workbench can reach, rendered without a server.",
		ogImage: site.defaultOgImage,
	},
	bridge: {
		...routeMetadata.bridge,
		title: `${site.name} | Bridge`,
		description:
			"Connect two accounting systems and move contacts, items and invoices between them.",
		ogImage: site.defaultOgImage,
	},
	notFound: {
		...routeMetadata.notFound,
		title: `${site.name} | Not found`,
		description: "That page does not exist.",
		ogImage: site.defaultOgImage,
	},
} as const satisfies Record<string, RouteSeo>;

/** Absolute URL for a path when origin is configured. */
/** @public */
export function absoluteUrl(
	path: string,
	origin: string | undefined = getSiteOrigin(),
): string | undefined {
	if (!origin) return undefined;
	const normalized = path.startsWith("/") ? path : `/${path}`;
	if (normalized === "/") return origin;
	return `${origin}${normalized}`;
}

type MetaDescriptor =
	| { title: string }
	| { name: string; content: string }
	| { property: string; content: string };

type LinkDescriptor = { rel: string; href: string };

type ScriptDescriptor = {
	type: string;
	children: string;
};

/** TanStack `head()` payload for a route. */
export type SeoHeadResult = {
	meta: MetaDescriptor[];
	links?: LinkDescriptor[];
	scripts?: ScriptDescriptor[];
};

/**
 * Build head tags for a route. Canonical and og:url only when origin is set.
 * Optional WebSite JSON-LD on home when `includeJsonLd` and origin are set.
 */
export function seoHead(
	seo: RouteSeo,
	options?: {
		includeJsonLd?: boolean;
		origin?: string | undefined;
	},
): SeoHeadResult {
	const origin = options?.origin ?? getSiteOrigin();
	const robots = seo.robots ?? "index,follow";
	const ogImage = seo.ogImage ?? site.defaultOgImage;
	const absoluteImage = absoluteUrl(ogImage, origin) ?? ogImage;
	const canonical = absoluteUrl(seo.path, origin);
	const ogUrl = canonical;

	const meta: MetaDescriptor[] = [
		{ title: seo.title },
		{ name: "description", content: seo.description },
		{ name: "robots", content: robots },
		{ property: "og:type", content: "website" },
		{ property: "og:title", content: seo.title },
		{ property: "og:description", content: seo.description },
		{ property: "og:image", content: absoluteImage },
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: seo.title },
		{ name: "twitter:description", content: seo.description },
		{ name: "twitter:image", content: absoluteImage },
	];

	if (ogUrl) {
		meta.push({ property: "og:url", content: ogUrl });
	}

	const links: LinkDescriptor[] = [];
	if (canonical && robots === "index,follow") {
		links.push({ rel: "canonical", href: canonical });
	}

	const scripts: ScriptDescriptor[] = [];
	if (options?.includeJsonLd) {
		const jsonLd = buildWebSiteJsonLd(origin);
		if (jsonLd) {
			scripts.push({
				type: "application/ld+json",
				children: JSON.stringify(jsonLd),
			});
		}
	}

	return {
		meta,
		...(links.length > 0 ? { links } : {}),
		...(scripts.length > 0 ? { scripts } : {}),
	};
}

/** Indexable paths for sitemap generation (absolute locs need origin). */
/** @public */
export function indexableSeoRoutes(): RouteSeo[] {
	return Object.values(routeSeo).filter(
		(entry) => (entry.robots ?? "index,follow") === "index,follow",
	);
}

export function matchRouteSeo(pathname: string): RouteSeo {
	return routeSeo[matchRouteMetadata(pathname)];
}

/**
 * WebSite (+ Organization) JSON-LD. Undefined without a public origin so we
 * never emit example.com placeholders.
 */
/** @public */
export function buildWebSiteJsonLd(
	origin: string | undefined = getSiteOrigin(),
): Record<string, unknown> | undefined {
	if (!origin) return undefined;
	const logo = absoluteUrl(site.logoPath, origin);
	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "WebSite",
				name: site.name,
				description: site.description,
				url: origin,
			},
			{
				"@type": "Organization",
				name: site.name,
				url: origin,
				...(logo ? { logo } : {}),
			},
		],
	};
}
