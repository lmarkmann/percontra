import * as z from "zod/mini";

export type DashboardProject = {
	id: string;
	name: string;
	status: "active" | "draft";
	updatedAt: string;
	owner: string;
};

export type DashboardActivityItem = {
	id: string;
	summary: string;
	actor: string;
	occurredAt: string;
};

export type DashboardMetrics = {
	openTasks: number;
	activeProjects: number;
	lastSyncAt: string;
};

/**
 * Concrete resource result for the dashboard loader.
 * Status tags match `ResourceResult` / the view-state lattice, plus production
 * matrix extras (forbidden, filtered) used as demo query switches.
 */
export type DashboardData =
	| { status: "empty" }
	| {
			status: "ready";
			projects: DashboardProject[];
			metrics: DashboardMetrics;
			activity: DashboardActivityItem[];
	  }
	| {
			status: "partial";
			projects: DashboardProject[];
			failedSlice: string;
	  }
	| { status: "error"; supportId: string; message: string }
	| { status: "forbidden"; resource: string }
	| { status: "filtered"; filterLabel: string }
	| {
			status: "conflict";
			yours: string;
			theirs: string;
	  };

export const dashboardViews = [
	"ready",
	"empty",
	"partial",
	"error",
	"forbidden",
	"filtered",
	"conflict",
] as const;

export type DashboardView = (typeof dashboardViews)[number];

/** Shared 500 detail; server, fixtures, and MSW handlers emit the same string. */
export const dashboardErrorMessage =
	"Workspace API returned an unexpected response.";

/** Unknown values behave as no view, matching the client's parseDashboardSearch leniency. */
export function parseDashboardView(
	raw: string | null | undefined,
): DashboardView | null {
	return dashboardViews.find((view) => view === raw) ?? null;
}

const projectSchema = z.object({
	id: z.string(),
	name: z.string(),
	status: z.enum(["active", "draft"]),
	updatedAt: z.iso.datetime(),
	owner: z.string(),
});

const activitySchema = z.object({
	id: z.string(),
	summary: z.string(),
	actor: z.string(),
	occurredAt: z.iso.datetime(),
});

const metricsSchema = z.object({
	openTasks: z.number(),
	activeProjects: z.number(),
	lastSyncAt: z.iso.datetime(),
});

/** Wire contract for GET /api/dashboard (and demo matrix). */
export const dashboardDataSchema: z.ZodMiniType<DashboardData> =
	z.discriminatedUnion("status", [
		z.object({ status: z.literal("empty") }),
		z.object({
			status: z.literal("ready"),
			projects: z.array(projectSchema),
			metrics: metricsSchema,
			activity: z.array(activitySchema),
		}),
		z.object({
			status: z.literal("partial"),
			projects: z.array(projectSchema),
			failedSlice: z.string(),
		}),
		z.object({
			status: z.literal("error"),
			supportId: z.string(),
			message: z.string(),
		}),
		z.object({
			status: z.literal("forbidden"),
			resource: z.string(),
		}),
		z.object({
			status: z.literal("filtered"),
			filterLabel: z.string(),
		}),
		z.object({
			status: z.literal("conflict"),
			yours: z.string(),
			theirs: z.string(),
		}),
	]);
