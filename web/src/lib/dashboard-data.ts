import * as z from "zod/mini";

import {
	type DashboardData,
	dashboardDataSchema,
	dashboardErrorMessage,
} from "@/contract/dashboard";
import { demoDashboardData } from "@/contract/dashboard-fixtures";
import { env } from "@/env";
import { apiGet } from "@/lib/api-client";
import { ApiProblem } from "@/lib/api-problem";
import { createSupportId } from "@/lib/support-id";

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

// Dev-only hold so the ?debug=1 skeleton demos stay visible; tests and production builds resolve immediately.
const demoDelayMs =
	import.meta.env.DEV && import.meta.env.MODE !== "test" ? 400 : 0;

/**
 * When `VITE_API_BASE_URL` is set, GET `{base}/api/dashboard?view=...`.
 *
 * | Condition                         | Result                                      |
 * |-----------------------------------|---------------------------------------------|
 * | No base URL                       | null -> demo matrix                          |
 * | Network throw                     | null -> demo matrix                          |
 * | HTTP non-OK (ApiProblem)          | { status: "error", supportId, message }     |
 * | Remote body fails the contract    | { status: "error", supportId, message }     |
 */
async function fetchRemoteDashboard(
	demoView: string | null,
): Promise<DashboardData | null> {
	const base = env.VITE_API_BASE_URL?.replace(/\/$/, "");
	if (!base) {
		return null;
	}

	try {
		const params = new URLSearchParams();
		if (demoView) {
			params.set("view", demoView);
		}
		const query = params.toString();
		const path = query ? `/api/dashboard?${query}` : "/api/dashboard";
		return await apiGet(path, dashboardDataSchema);
	} catch (error) {
		if (error instanceof ApiProblem) {
			return {
				status: "error",
				supportId: error.requestId,
				message: error.detail || `Dashboard API returned ${error.status}.`,
			};
		}
		if (error instanceof z.core.$ZodError) {
			// A remote body that fails the contract is schema drift, not demo mode:
			// surface the error card instead of silently presenting fixture data as
			// the user's workspace. The message stays generic; nothing from the
			// response leaks into it.
			return {
				status: "error",
				supportId: createSupportId(),
				message: dashboardErrorMessage,
			};
		}
		// TypeError (network) etc. -> demo fallback
		return null;
	}
}

export async function fetchDashboardData(
	demoView: string | null,
): Promise<DashboardData> {
	const remote = await fetchRemoteDashboard(demoView);
	if (remote) {
		return remote;
	}

	if (demoDelayMs > 0) {
		await delay(demoDelayMs);
	}
	return demoDashboardData(demoView, createSupportId());
}
