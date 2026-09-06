import { createFileRoute } from "@tanstack/react-router";

import { BridgePage } from "@/features/bridge/bridge-page";
import { routeSeo, seoHead } from "@/lib/seo";

/**
 * Live accounting-system bridge. Backed by the Piper API (piper/ at the
 * repository root), a separate process reached at VITE_PIPER_API_URL.
 */
export const Route = createFileRoute("/bridge")({
	head: () => seoHead(routeSeo.bridge),
	component: BridgePage,
});
