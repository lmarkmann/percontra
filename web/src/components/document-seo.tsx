import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { matchRouteSeo, routeSeo, seoHead } from "@/lib/seo";
import { applySeoHead } from "@/lib/seo-dom";

/**
 * Applies route SEO on navigation. Maps pathname prefixes to `routeSeo` entries.
 * Keep in sync with public routes under `src/routes/`.
 */
export function DocumentSeo() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	useEffect(() => {
		const seo = matchRouteSeo(pathname);
		const includeJsonLd = seo === routeSeo.home;
		applySeoHead(seoHead(seo, { includeJsonLd }));
	}, [pathname]);

	return null;
}
