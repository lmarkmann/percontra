import { queryOptions } from "@tanstack/react-query";

import { fetchDashboardData } from "@/lib/dashboard-data";

export function dashboardQueryKey(view: string | null) {
	return ["dashboard", view] as const;
}

/** Loader / invalidation entry: demo matrix or remote, with React Query cache. */
export function dashboardQueryOptions(view: string | null) {
	return queryOptions({
		queryKey: dashboardQueryKey(view),
		queryFn: () => fetchDashboardData(view),
	});
}
