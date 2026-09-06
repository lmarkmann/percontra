import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { ToasterGate } from "@/components/toaster-gate";
import { initAnalytics } from "@/lib/analytics";
import { initErrorReporting } from "@/lib/error-reporting";
import { queryClient } from "@/lib/query-client";

import { router } from "./router.tsx";

// Cookieless PostHog and Sentry error reporting; both no-op until their env vars are set. Idle defer keeps the SDKs off the critical path for slow-network first visits.
const scheduleOptionalSdks = () => {
	void initAnalytics();
	void initErrorReporting();
};
if ("requestIdleCallback" in window) {
	requestIdleCallback(scheduleOptionalSdks);
} else {
	setTimeout(scheduleOptionalSdks, 1);
}

// No service worker while the demo sits behind Cloudflare Access at the edge.
// The worker answers navigations with respondWith(fetch(request)), which
// swallows the login redirect: the page goes blank and can never send anyone to
// the sign-in page. edge/proxy.ts serves a kill switch at /sw.js to retire the
// registrations that already shipped. Restore this when the gate comes off, not
// before.

// non-null: #root is in index.html
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ErrorBoundary>
			<ThemeProvider>
				<QueryClientProvider client={queryClient}>
					<RouterProvider router={router} />
					<ToasterGate />
				</QueryClientProvider>
			</ThemeProvider>
		</ErrorBoundary>
	</StrictMode>,
);
