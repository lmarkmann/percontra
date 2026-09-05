import { queryOptions } from "@tanstack/react-query";

import { sessionSchema, type Session } from "@/contract/session";
import { env } from "@/env";
import { apiGet } from "@/lib/api-client";
import { ApiProblem } from "@/lib/api-problem";
import { getSession } from "@/lib/session";

/**
 * GET /api/session with cookie credentials.
 * 401 or a missing session returns null (not an app crash).
 * 501 (auth not configured on the server) falls back to a demo session.
 */
export async function fetchRemoteSession(): Promise<Session | null> {
	try {
		return await apiGet("/api/session", sessionSchema);
	} catch (error) {
		if (
			error instanceof ApiProblem &&
			(error.status === 401 || error.status === 403)
		) {
			return null;
		}
		if (error instanceof ApiProblem && error.status === 404) {
			return null;
		}
		if (error instanceof ApiProblem && error.status === 501) {
			// Auth not configured server-side (WORKOS_CLIENT_ID unset): fall back to
			// the demo session so a fork that sets VITE_API_BASE_URL for real
			// dashboard data keeps a working demo login instead of a redirect loop.
			return getSession();
		}
		throw error;
	}
}

/**
 * Dual-mode session read for loaders / beforeLoad.
 * Remote when VITE_API_BASE_URL is set; demo localStorage otherwise.
 */
export async function resolveSession(): Promise<Session | null> {
	if (env.VITE_API_BASE_URL) {
		return fetchRemoteSession();
	}
	return getSession();
}

function sessionQueryKey() {
	return ["session"] as const;
}

// The 501-fallback demo session is cached under ["session"] like a real one.
// requireAuth forces staleTime 0 on every gate, so no stale demo session is
// served today; future consumers must not rely on the default staleTime here
// for auth decisions.
export function sessionQueryOptions() {
	return queryOptions({
		queryKey: sessionQueryKey(),
		queryFn: resolveSession,
		staleTime: 60_000,
	});
}
