import type { DashboardData } from "@/contract/dashboard";
import type { DashboardSearch } from "@/routes/_authenticated/dashboard";
import type { QueryClient } from "@tanstack/react-query";

import { expect, test, vi } from "vitest";

import { dashboardQueryKey } from "@/lib/dashboard-api";
import { createAppQueryClient } from "@/lib/query-client";
import { Route } from "@/routes/_authenticated/dashboard";

function runLoader(queryClient: QueryClient): Promise<DashboardData> {
	const { loader } = Route.options;
	if (typeof loader !== "function") {
		throw new TypeError("dashboard loader is not a function");
	}
	const deps: DashboardSearch = {};
	return loader({
		deps,
		context: { queryClient },
	} as Parameters<typeof loader>[0]) as Promise<DashboardData>;
}

const seed: DashboardData = { status: "empty" };

test("loader returns cached data and revalidates it when stale", async () => {
	const queryClient = createAppQueryClient();
	const seededAt = Date.now() - 60_000; // past the 30s default staleTime
	queryClient.setQueryData(dashboardQueryKey(null), seed, {
		updatedAt: seededAt,
	});

	await expect(runLoader(queryClient)).resolves.toBe(seed);

	await vi.waitFor(() => {
		const state = queryClient.getQueryState(dashboardQueryKey(null));
		expect(state?.dataUpdatedAt).toBeGreaterThan(seededAt);
	});
});

test("loader serves fresh cached data without refetching", async () => {
	const queryClient = createAppQueryClient();
	queryClient.setQueryData(dashboardQueryKey(null), seed);
	const seededAt = queryClient.getQueryState(
		dashboardQueryKey(null),
	)?.dataUpdatedAt;

	await expect(runLoader(queryClient)).resolves.toBe(seed);
	expect(queryClient.getQueryState(dashboardQueryKey(null))?.fetchStatus).toBe(
		"idle",
	);
	expect(
		queryClient.getQueryState(dashboardQueryKey(null))?.dataUpdatedAt,
	).toBe(seededAt);
});
