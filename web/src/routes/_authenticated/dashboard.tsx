import { useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
	useRouterState,
} from "@tanstack/react-router";
import { FolderPlus, ListFilter, RefreshCw } from "lucide-react";
import { lazy, Suspense } from "react";
import * as z from "zod/mini";

import { ContentSlot } from "@/components/content-slot";
import { ErrorState } from "@/components/error-state";
import { LoadingSurface } from "@/components/loading-surface";
import { MetricValue } from "@/components/metric-value";
import { PermissionDenied } from "@/components/permission-denied";
import { SiteHeader } from "@/components/site-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Marker, MarkerContent } from "@/components/ui/chat";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import {
	type DashboardActivityItem,
	type DashboardData,
	type DashboardMetrics,
	type DashboardProject,
	type DashboardView,
	dashboardViews,
} from "@/contract/dashboard";
import { useLoadingEscalation } from "@/hooks/use-loading-escalation";
import { actionClass } from "@/lib/action-class";
import { dashboardQueryKey, dashboardQueryOptions } from "@/lib/dashboard-api";
import { formatRelativeTime } from "@/lib/relative-time";
import { routeSeo, seoHead } from "@/lib/seo";
import { signOutApp } from "@/lib/sign-out";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const MotionShell = lazy(() =>
	import("@/components/motion-shell").then((m) => ({ default: m.MotionShell })),
);

const dashboardSearchSchema = z.object({
	view: z.optional(z.enum(dashboardViews)),
	// TanStack's default search parser JSON-coerces `?debug=1` to number 1.
	debug: z.optional(z.union([z.literal("1"), z.literal(1)])),
});

export type DashboardSearch = {
	view?: DashboardView;
	debug?: "1";
};

function parseDashboardSearch(search: unknown): DashboardSearch {
	const parsed = dashboardSearchSchema.safeParse(search);
	if (!parsed.success) {
		return {};
	}
	return {
		view: parsed.data.view,
		debug: parsed.data.debug === undefined ? undefined : "1",
	};
}

// The _authenticated layout route owns the requireAuth gate.
export const Route = createFileRoute("/_authenticated/dashboard")({
	head: () => seoHead(routeSeo.dashboard),
	validateSearch: (search: Record<string, unknown>): DashboardSearch =>
		parseDashboardSearch(search),
	loaderDeps: ({ search }) => ({
		view: search.view,
		debug: search.debug,
	}),
	loader: async ({ deps, context }) => {
		const view = deps.view ?? null;
		// Without revalidateIfStale, ensureQueryData returns cached data without
		// ever refetching; the queryClient's 30s staleTime would be dead config.
		return context.queryClient.ensureQueryData({
			...dashboardQueryOptions(view),
			revalidateIfStale: true,
		});
	},
	component: DashboardRoute,
});

function projectStatusPill(status: "active" | "draft"): "success" | "neutral" {
	return status === "active" ? "success" : "neutral";
}

function projectStatusLabel(status: "active" | "draft"): string {
	return status === "active" ? "Active" : "Draft";
}

function projectTitle(id: string, name: string): string {
	if (id === "alpha") return "Launch checklist";
	if (id === "beta") return "Design review";
	return name;
}

function ProjectTile({
	title,
	statusLabel,
	status,
	updatedAt,
	owner,
	primary = false,
}: {
	title: string;
	statusLabel: string;
	status: "active" | "draft";
	updatedAt: string;
	owner: string;
	primary?: boolean;
}) {
	return (
		<Card
			size="sm"
			className={cn(primary && "bg-surface-tinted shadow-border-hover")}
		>
			<CardHeader className="gap-2">
				<div className="flex items-start justify-between gap-2">
					<CardTitle className={cn(primary && "text-body")}>{title}</CardTitle>
					<StatusPill status={projectStatusPill(status)}>
						{statusLabel}
					</StatusPill>
				</div>
				<p className="text-label text-muted-foreground">
					{owner}, {formatRelativeTime(updatedAt)}
				</p>
			</CardHeader>
		</Card>
	);
}

function MetricsRow({
	metrics,
	labels,
	sectionLabel,
}: {
	metrics: DashboardMetrics;
	labels: { openTasks: string; activeProjects: string; lastSync: string };
	sectionLabel: string;
}) {
	return (
		<section className="grid gap-3 sm:grid-cols-3" aria-label={sectionLabel}>
			{[
				{
					label: labels.openTasks,
					value: metrics.openTasks,
					key: "open",
				},
				{
					label: labels.activeProjects,
					value: metrics.activeProjects,
					key: "active",
				},
				{
					label: labels.lastSync,
					value: formatRelativeTime(metrics.lastSyncAt),
					key: "sync",
				},
			].map((metric) => (
				<div
					key={metric.key}
					className="flex flex-col gap-1 rounded-xl px-4 py-3 shadow-border dark:bg-card"
				>
					<p className="text-label text-muted-foreground">{metric.label}</p>
					{/* Figures earn the display scale; textual values (relative time) stay at body weight so visual emphasis tracks information weight. */}
					<p
						className={
							typeof metric.value === "number"
								? "text-title font-medium tracking-title"
								: "text-body font-medium"
						}
					>
						<MetricValue value={metric.value} />
					</p>
				</div>
			))}
		</section>
	);
}

function ActivityList({
	title,
	items,
}: {
	title: string;
	items: readonly DashboardActivityItem[];
}) {
	return (
		<section
			className="flex flex-col gap-3"
			aria-labelledby="dashboard-activity"
		>
			<h2 id="dashboard-activity" className="text-caption font-medium">
				{title}
			</h2>
			<ul className="divide-y divide-border overflow-hidden rounded-xl shadow-border dark:bg-card">
				{items.map((item) => (
					<li
						key={item.id}
						className="duration-fast flex items-baseline justify-between gap-3 px-4 py-3 transition-[background-color] ease-out hover-fine:hover:bg-muted/50"
					>
						<div className="flex min-w-0 flex-col gap-0.5">
							<span className="text-caption text-foreground">
								{item.summary}
							</span>
							<span className="text-label text-muted-foreground">
								{item.actor}
							</span>
						</div>
						<span className="shrink-0 text-label text-muted-foreground tabular-nums">
							{formatRelativeTime(item.occurredAt)}
						</span>
					</li>
				))}
			</ul>
		</section>
	);
}

function DemoStateLink({
	search,
	children,
}: {
	search: DashboardSearch;
	children: React.ReactNode;
}) {
	return (
		<Link
			to="/dashboard"
			search={search}
			className="text-primary underline underline-offset-4"
		>
			{children}
		</Link>
	);
}

/** Skeleton matches ready layout: metrics + two tiles + activity. No `early`
 * slot: route loads usually resolve under the delay, and a 0ms status line
 * reintroduces the flash the delay exists to kill. */
function DashboardBodySkeleton({
	active,
	slowLabel,
}: {
	active: boolean;
	slowLabel: string;
}) {
	return (
		<LoadingSurface
			active={active}
			className="gap-6"
			slowMessage={slowLabel}
			skeleton={
				<div className="flex flex-col gap-6">
					<div className="grid gap-3 sm:grid-cols-3">
						<Skeleton className="h-16 rounded-xl" />
						<Skeleton className="h-16 rounded-xl" />
						<Skeleton className="h-16 rounded-xl" />
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						<Skeleton className="h-24 rounded-xl" />
						<Skeleton className="h-24 rounded-xl" />
					</div>
					<div className="flex flex-col gap-3">
						<Skeleton className="h-4 w-28" />
						<div className="overflow-hidden rounded-xl shadow-border">
							<Skeleton className="h-14 w-full rounded-none" />
							<Skeleton className="h-14 w-full rounded-none" />
							<Skeleton className="h-14 w-full rounded-none" />
						</div>
					</div>
				</div>
			}
		/>
	);
}

function slotModeFor(slotKey: string): "crossfade" | "settle" {
	// Loading ↔ ready/partial: opacity only. Empty/error/forbidden: settle 4px.
	if (slotKey === "loading" || slotKey === "ready" || slotKey === "partial") {
		return "crossfade";
	}
	return "settle";
}

function ProjectTiles({
	projects,
	titleFor,
	statusLabelFor,
}: {
	projects: readonly DashboardProject[];
	titleFor: (id: string, name: string) => string;
	statusLabelFor: (status: "active" | "draft") => string;
}) {
	return (
		<div className="grid gap-3 sm:grid-cols-2">
			{projects.map((project, index) => (
				<ProjectTile
					key={project.id}
					title={titleFor(project.id, project.name)}
					status={project.status}
					statusLabel={statusLabelFor(project.status)}
					updatedAt={project.updatedAt}
					owner={project.owner}
					primary={index === 0}
				/>
			))}
		</div>
	);
}

function DashboardRoute() {
	const data: DashboardData = Route.useLoaderData();
	const navigate = useNavigate();
	const router = useRouter();
	const queryClient = useQueryClient();
	const search: DashboardSearch = Route.useSearch();

	const isLoading = useRouterState({
		// Scoped to this route's own pending load; global isLoading would flip
		// the dashboard into a loading state during outbound navigations too.
		select: (state) =>
			state.isLoading && state.location.pathname === Route.fullPath,
	});
	// The route owns the escalation timing: the surface below stays mounted with
	// active={isLoading}, and the slot holds "loading" until the min-visible
	// hold releases, so a response landing just past the delay cannot flash.
	const { showSkeleton } = useLoadingEscalation(isLoading);
	const showLoading = isLoading || showSkeleton;
	const showDemoStates = search.debug === "1";
	const slotKey = showLoading ? "loading" : data.status;
	const slotMode = slotModeFor(slotKey);
	const view = search.view ?? null;

	function handleSignOut() {
		signOutApp("/login", queryClient);
		void navigate({ to: "/login" });
	}

	function goReady() {
		void navigate({
			to: "/dashboard",
			search: showDemoStates
				? { view: "ready", debug: "1" }
				: { view: "ready" },
		});
	}

	function preloadLogin() {
		void router.preloadRoute({ to: "/login" });
	}

	async function refreshDashboard() {
		await queryClient.invalidateQueries({ queryKey: dashboardQueryKey(view) });
		await router.invalidate();
	}

	// Chrome (rail, title, sign-out, demo strip) stays static; only the body cell crossfades or settles (preference: frame still, work moves).
	return (
		<div className="flex min-h-svh flex-col bg-background">
			<SiteHeader />

			<main
				id="main"
				tabIndex={-1}
				className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 border-x border-border/70 px-6 pt-8 pb-16 outline-none safe-bottom"
			>
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="flex max-w-prose flex-col gap-1">
						<h1 className="text-title font-medium tracking-title">Workspace</h1>
						<p className="font-prose text-body text-muted-foreground">
							Projects and activity for your signed-in session.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							data-testid="dashboard-sign-out"
							onPointerEnter={preloadLogin}
							onFocus={preloadLogin}
							onClick={handleSignOut}
						>
							Sign out
						</Button>
					</div>
				</div>

				{showDemoStates ? (
					<div
						className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-label"
						data-testid="dashboard-demo-states"
					>
						<span className="text-muted-foreground">Demo states</span>
						<DemoStateLink search={{ view: "ready", debug: "1" }}>
							Ready
						</DemoStateLink>
						<DemoStateLink search={{ view: "partial", debug: "1" }}>
							Partial
						</DemoStateLink>
						<DemoStateLink search={{ view: "error", debug: "1" }}>
							Error
						</DemoStateLink>
						<DemoStateLink search={{ view: "empty", debug: "1" }}>
							Empty
						</DemoStateLink>
						<DemoStateLink search={{ view: "forbidden", debug: "1" }}>
							Forbidden
						</DemoStateLink>
						<DemoStateLink search={{ view: "filtered", debug: "1" }}>
							Filtered
						</DemoStateLink>
						<DemoStateLink search={{ view: "conflict", debug: "1" }}>
							Conflict
						</DemoStateLink>
					</div>
				) : null}

				<Suspense fallback={null}>
					<MotionShell>
						<ContentSlot slotKey={slotKey} mode={slotMode}>
							{showLoading ? (
								<DashboardBodySkeleton
									active={isLoading}
									slowLabel="Still loading your workspace..."
								/>
							) : null}

							{!showLoading && data.status === "empty" ? (
								<Empty className="border border-dashed">
									<EmptyHeader>
										<EmptyMedia type="icon">
											<FolderPlus />
										</EmptyMedia>
										<EmptyTitle>No projects yet</EmptyTitle>
										<EmptyDescription>
											Projects organize your work. Create one to populate this
											dashboard.
										</EmptyDescription>
									</EmptyHeader>
									<EmptyContent>
										<Button
											size="sm"
											className={actionClass()}
											data-testid="dashboard-create"
											onClick={() => {
												toast.success("Demo project created");
												goReady();
											}}
										>
											Create project
										</Button>
									</EmptyContent>
								</Empty>
							) : null}

							{!showLoading && data.status === "filtered" ? (
								<Empty
									className="border border-dashed"
									data-testid="dashboard-filtered"
								>
									<EmptyHeader>
										<EmptyMedia type="icon">
											<ListFilter />
										</EmptyMedia>
										<EmptyTitle>No projects match</EmptyTitle>
										<EmptyDescription>
											Nothing matches {data.filterLabel}. Clear filters to see
											all projects.
										</EmptyDescription>
									</EmptyHeader>
									<EmptyContent>
										<Button
											size="sm"
											variant="outline"
											className={actionClass()}
											data-testid="dashboard-clear-filters"
											onClick={goReady}
										>
											Clear filters
										</Button>
									</EmptyContent>
								</Empty>
							) : null}

							{!showLoading && data.status === "forbidden" ? (
								<PermissionDenied
									title={"You don\u2019t have access"}
									description="Your role cannot open this resource. Switch account or return home."
									resource={data.resource}
									primaryAction={
										<Link
											to="/"
											className={cn(
												buttonVariants({ size: "sm" }),
												actionClass(),
											)}
										>
											Back home
										</Link>
									}
								/>
							) : null}

							{!showLoading && data.status === "conflict" ? (
								<div
									className="flex flex-col gap-4 rounded-xl border border-dashed p-4"
									data-testid="dashboard-conflict"
								>
									<div className="flex flex-col gap-1">
										<StatusPill status="warning">
											Two versions of this draft
										</StatusPill>
										<p className="font-prose text-caption text-muted-foreground">
											You and another session edited the same resource. Pick a
											version; last write never wins silently.
										</p>
									</div>
									<div className="grid gap-3 sm:grid-cols-2">
										<div className="rounded-xl bg-card p-4 shadow-border">
											<p className="text-caption font-medium">Your version</p>
											<p className="mt-2 text-body">{data.yours}</p>
											<Button
												size="sm"
												className={cn("mt-3", actionClass())}
												onClick={goReady}
											>
												Keep yours
											</Button>
										</div>
										<div className="rounded-xl bg-card p-4 shadow-border">
											<p className="text-caption font-medium">Their version</p>
											<p className="mt-2 text-body">{data.theirs}</p>
											<Button
												size="sm"
												variant="outline"
												className={cn("mt-3", actionClass())}
												onClick={goReady}
											>
												Keep theirs
											</Button>
										</div>
									</div>
								</div>
							) : null}

							{!showLoading && data.status === "error" ? (
								<ErrorState
									title={"Couldn\u2019t load dashboard"}
									message={data.message}
									supportId={data.supportId}
									copyToastMessage="Error ID copied"
									onRetry={() => {
										// Demo ?view=error always reloads the error matrix; leave that
										// preview for recovery. Real remote errors revalidate in place.
										if (view === "error") {
											goReady();
											return;
										}
										void refreshDashboard();
									}}
								/>
							) : null}

							{!showLoading && data.status === "partial" ? (
								<div className="flex flex-col gap-6">
									<div className="flex flex-col gap-1">
										<StatusPill status="warning">Partial dashboard</StatusPill>
										<p className="font-prose text-caption text-muted-foreground">
											Core projects loaded, but one slice is still unavailable.
										</p>
									</div>
									<ProjectTiles
										projects={data.projects}
										titleFor={projectTitle}
										statusLabelFor={projectStatusLabel}
									/>
									<Marker layout="border" className="justify-between">
										<MarkerContent>Activity feed unavailable</MarkerContent>
										<Button
											size="sm"
											variant="outline"
											className={actionClass()}
											onClick={() => {
												void refreshDashboard();
											}}
										>
											<RefreshCw data-icon="inline-start" />
											Retry feed
										</Button>
									</Marker>
								</div>
							) : null}

							{!showLoading && data.status === "ready" ? (
								<div className="flex flex-col gap-6">
									<MetricsRow
										metrics={data.metrics}
										sectionLabel="Workspace metrics"
										labels={{
											openTasks: "Open tasks",
											activeProjects: "Active projects",
											lastSync: "Last sync",
										}}
									/>
									<ProjectTiles
										projects={data.projects}
										titleFor={projectTitle}
										statusLabelFor={projectStatusLabel}
									/>
									<ActivityList title="Recent activity" items={data.activity} />
								</div>
							) : null}
						</ContentSlot>
					</MotionShell>
				</Suspense>
			</main>
		</div>
	);
}
