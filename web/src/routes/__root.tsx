import type { RouterContext } from "@/lib/query-client";

import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
} from "@tanstack/react-router";

import { DocumentSeo } from "@/components/document-seo";
import { OfflineBanner } from "@/components/offline-banner";
import { RouteFocus } from "@/components/route-focus";
import { SkipLink } from "@/components/skip-link";

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

function RootLayout() {
	return (
		<>
			{/* Router-managed tags + SPA document upsert for client navigations. */}
			<HeadContent />
			<DocumentSeo />
			<RouteFocus />
			<SkipLink />
			<OfflineBanner />
			<Outlet />
		</>
	);
}
