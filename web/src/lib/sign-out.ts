import type { QueryClient } from "@tanstack/react-query";

import { reset as resetAnalytics } from "@/lib/analytics";
import { clearDemoSession } from "@/lib/session";

type SignOutFn = (opts?: { returnTo?: string }) => void;

let workOsSignOut: SignOutFn | null = null;

/** Called from WorkOsSessionBridge when AuthKit is mounted. */
export function registerWorkOsSignOut(fn: SignOutFn | null): void {
	workOsSignOut = fn;
}

/**
 * End the client session. Clears the demo/live session mirror always and the
 * query cache when given (so cached data never leaks to the next sign-in on a
 * shared tab); when WorkOS AuthKit is live, also ends the hosted session.
 */
export function signOutApp(
	returnTo = "/login",
	queryClient?: QueryClient,
): void {
	clearDemoSession();
	resetAnalytics();
	queryClient?.clear();
	workOsSignOut?.({ returnTo });
}
