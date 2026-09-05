import type { QueryClient } from "@tanstack/react-query";

import { redirect } from "@tanstack/react-router";

import { resolveSession, sessionQueryOptions } from "@/lib/session-api";

/**
 * Shared auth gate for TanStack `beforeLoad`. Client-side only; real protection
 * still belongs on the server when a backend exists.
 *
 * Dual-mode: demo localStorage when `VITE_API_BASE_URL` is unset; otherwise
 * GET /api/session with credentials. Pass `queryClient` to cache the session
 * via React Query.
 */
export async function requireAuth(
	queryClient?: QueryClient,
	returnTo = "/dashboard",
): Promise<void> {
	// fetchQuery + staleTime 0: never trust a cached null from an earlier
	// unauthenticated deep link. ensureQueryData would keep that null for the
	// full sessionQueryOptions staleTime (60s) after setDemoSession.
	const session = queryClient
		? await queryClient.fetchQuery({
				...sessionQueryOptions(),
				staleTime: 0,
			})
		: await resolveSession();
	if (!session) {
		throw redirect({ to: "/login", search: { redirect: returnTo } });
	}
}
