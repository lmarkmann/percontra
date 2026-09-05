import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { ToasterGate } from "@/components/toaster-gate";
import { initAnalytics } from "@/lib/analytics";
import { AuthProvider, ensureAuthProviderReady } from "@/lib/auth-provider";
import { initErrorReporting } from "@/lib/error-reporting";
import { queryClient } from "@/lib/query-client";
import { registerServiceWorker } from "@/lib/register-service-worker";

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

registerServiceWorker();

// The static shell remains in place until optional AuthKit is ready. A chunk
// failure leaves the navigable shell intact instead of replacing it with a
// blank fallback.
void ensureAuthProviderReady()
	.then(() => {
		// non-null: #root is in index.html
		createRoot(document.getElementById("root")!).render(
			<StrictMode>
				<ErrorBoundary>
					<ThemeProvider>
						<QueryClientProvider client={queryClient}>
							<AuthProvider>
								<RouterProvider router={router} />
								<ToasterGate />
							</AuthProvider>
						</QueryClientProvider>
					</ThemeProvider>
				</ErrorBoundary>
			</StrictMode>,
		);
	})
	.catch((error: unknown) => {
		console.error("AuthKit bootstrap failed, keeping the static shell", error);
	});
