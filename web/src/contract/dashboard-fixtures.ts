import {
	type DashboardActivityItem,
	type DashboardData,
	dashboardErrorMessage,
	type DashboardMetrics,
	type DashboardProject,
} from "@/contract/dashboard";

function timestampBefore(now: number, milliseconds: number): string {
	return new Date(now - milliseconds).toISOString();
}

function demoProjects(now: number): DashboardProject[] {
	return [
		{
			id: "alpha",
			name: "Launch checklist",
			status: "active",
			updatedAt: timestampBefore(now, 2 * 60 * 60 * 1000),
			owner: "You",
		},
		{
			id: "beta",
			name: "Design review",
			status: "draft",
			updatedAt: timestampBefore(now, 24 * 60 * 60 * 1000),
			owner: "Alex",
		},
	];
}

function demoActivity(now: number): DashboardActivityItem[] {
	return [
		{
			id: "a1",
			summary: "Checklist item closed",
			actor: "You",
			occurredAt: timestampBefore(now, 12 * 60 * 1000),
		},
		{
			id: "a2",
			summary: "Review comment left",
			actor: "Alex",
			occurredAt: timestampBefore(now, 60 * 60 * 1000),
		},
		{
			id: "a3",
			summary: "Draft shared with team",
			actor: "You",
			occurredAt: timestampBefore(now, 3 * 60 * 60 * 1000),
		},
	];
}

function demoMetrics(now: number): DashboardMetrics {
	return {
		openTasks: 7,
		activeProjects: 1,
		lastSyncAt: new Date(now).toISOString(),
	};
}

function readyData(now: number): Extract<DashboardData, { status: "ready" }> {
	return {
		status: "ready",
		projects: demoProjects(now),
		metrics: demoMetrics(now),
		activity: demoActivity(now),
	};
}

export function demoDashboardData(
	demoView: string | null,
	supportId: string,
): DashboardData {
	const now = Date.now();
	switch (demoView) {
		case "error":
			return {
				status: "error",
				supportId,
				message: dashboardErrorMessage,
			};
		case "partial":
			return {
				status: "partial",
				projects: demoProjects(now),
				failedSlice: "activity-feed",
			};
		case "empty":
			return { status: "empty" };
		case "forbidden":
			return { status: "forbidden", resource: "billing settings" };
		case "filtered":
			return { status: "filtered", filterLabel: "status:archived" };
		case "conflict":
			return {
				status: "conflict",
				yours: "Ship the offline queue first.",
				theirs: "Ship partial metrics first.",
			};
		case "ready":
		default:
			// Default demo is a filled workspace; empty only via ?view=empty.
			return readyData(now);
	}
}
