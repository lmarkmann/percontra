// Structure adapted from alan2207/bulletproof-react src/testing/mocks/handlers (MIT); see README.md#credits. Handlers mirror the real Worker routes in server/index.ts, built from the shared contract.
import { http, HttpResponse } from "msw";

import {
	dashboardErrorMessage,
	parseDashboardView,
} from "@/contract/dashboard";
import { demoDashboardData } from "@/contract/dashboard-fixtures";
import { problemResponse } from "@/contract/problem";

/** Fixed request id so tests can assert it surfaces as supportId. */
export const MSW_REQUEST_ID = "msw-test-id";

// Wildcard host: the client builds absolute URLs from VITE_API_BASE_URL.
export const handlers = [
	http.get("*/api/dashboard", ({ request }) => {
		const view = parseDashboardView(
			new URL(request.url).searchParams.get("view"),
		);
		if (view === "error") {
			return problemResponse({
				status: 500,
				title: "Internal Server Error",
				detail: dashboardErrorMessage,
				requestId: MSW_REQUEST_ID,
			});
		}
		return HttpResponse.json(demoDashboardData(view, MSW_REQUEST_ID));
	}),
	// Signed-out by default; tests override with server.use() for a 200 Session or the 501 auth-not-configured branch.
	http.get("*/api/session", () =>
		problemResponse({
			status: 401,
			title: "Unauthorized",
			requestId: MSW_REQUEST_ID,
		}),
	),
];
