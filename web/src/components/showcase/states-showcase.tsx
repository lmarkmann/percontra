import type { ViewState } from "@/lib/view-state";

import { GitBranch, MessageSquare, RefreshCw, WifiOff } from "lucide-react";
import { type KeyboardEvent, useCallback, useState } from "react";

import { ContentSlot } from "@/components/content-slot";
import { ErrorState } from "@/components/error-state";
import { LoadingSurface } from "@/components/loading-surface";
import { MetricValue } from "@/components/metric-value";
import { ShowcaseSection } from "@/components/showcase/showcase-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { actionClass } from "@/lib/action-class";
import { createSupportId } from "@/lib/support-id";
import { toast } from "@/lib/toast";

/**
 * Showcase tabs: full lattice minus idle (ready is the resting happy path).
 * Production-matrix extras (forbidden / filtered) live on the dashboard demo
 * switches (`?view=forbidden|filtered&debug=1`), not as extra tabs here.
 */
type DataViewState = Exclude<ViewState, "idle">;

const stateKeys: DataViewState[] = [
	"ready",
	"loading",
	"empty",
	"error",
	"partial",
	"conflict",
	"offline",
];

const demoErrorId = createSupportId();
const STATES_TAB_PANEL_ID = "states-showcase-panel";
const stateLabels: Record<DataViewState, string> = {
	ready: "Ready",
	loading: "Loading",
	empty: "Empty",
	error: "Error",
	partial: "Partial",
	conflict: "Conflict",
	offline: "Offline",
};

function focusStateTab(key: DataViewState) {
	requestAnimationFrame(() => {
		document.getElementById(`state-tab-${key}`)?.focus();
	});
}

function getNextStateIndex(
	currentIndex: number,
	key: string,
	count: number,
): number | null {
	switch (key) {
		case "ArrowRight":
		case "ArrowDown":
			return (currentIndex + 1) % count;
		case "ArrowLeft":
		case "ArrowUp":
			return (currentIndex - 1 + count) % count;
		case "Home":
			return 0;
		case "End":
			return count - 1;
		default:
			return null;
	}
}

function LoadingPanel() {
	return (
		<LoadingSurface
			active
			early={
				<p className="text-body text-muted-foreground">{"Loading\u2026"}</p>
			}
			slowMessage={"Still loading\u2026"}
			skeleton={
				<>
					<Skeleton className="h-4 w-3/5" />
					<Skeleton className="h-4 w-4/5" />
					<Skeleton className="h-16 w-full rounded-xl" />
				</>
			}
		/>
	);
}

export function StatesShowcase() {
	const [state, setState] = useState<DataViewState>("ready");

	const handleTabListKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			const currentIndex = stateKeys.indexOf(state);
			if (currentIndex === -1) {
				return;
			}

			const nextIndex = getNextStateIndex(
				currentIndex,
				event.key,
				stateKeys.length,
			);
			if (nextIndex === null) {
				return;
			}

			event.preventDefault();
			// non-null: getNextStateIndex returns an in-range index or null
			const nextKey = stateKeys[nextIndex]!;
			setState(nextKey);
			focusStateTab(nextKey);
		},
		[state],
	);

	return (
		<ShowcaseSection
			slug="data-view-states"
			figure="09 / States"
			title="Data view states"
			description="Ready, loading, empty, error, partial, conflict, and offline for data views. Permission and filter demos live on the workspace with ?debug=1."
		>
			<Card>
				<CardContent className="flex flex-col gap-4 pt-(--card-spacing)">
					<div
						className="flex flex-wrap gap-2"
						role="tablist"
						// Not dead: jsx-a11y/interactive-supports-focus requires the
						// keydown host to be focusable; -1 keeps it out of tab order
						// while the tabs keep their roving tabindex.
						tabIndex={-1}
						aria-label="Preview data view state"
						onKeyDown={handleTabListKeyDown}
					>
						{stateKeys.map((key) => (
							<Button
								key={key}
								id={`state-tab-${key}`}
								variant={state === key ? "default" : "outline"}
								size="sm"
								role="tab"
								aria-selected={state === key}
								aria-controls={STATES_TAB_PANEL_ID}
								tabIndex={state === key ? 0 : -1}
								data-testid={`state-tab-${key}`}
								onClick={() => setState(key)}
							>
								{stateLabels[key]}
							</Button>
						))}
					</div>

					<div
						id={STATES_TAB_PANEL_ID}
						className="min-h-40 rounded-xl border border-dashed p-4"
						role="tabpanel"
						aria-labelledby={`state-tab-${state}`}
						aria-live="polite"
					>
						<ContentSlot
							slotKey={state}
							mode={
								state === "loading" || state === "ready" || state === "partial"
									? "crossfade"
									: "settle"
							}
						>
							{state === "loading" ? <LoadingPanel /> : null}

							{state === "empty" ? (
								<Empty className="border-0 p-0">
									<EmptyHeader>
										<EmptyMedia type="icon">
											<MessageSquare />
										</EmptyMedia>
										<EmptyTitle>No messages yet</EmptyTitle>
										<EmptyDescription>
											Send a first message to start the thread. Transport lands
											when you wire your API or AI SDK.
										</EmptyDescription>
									</EmptyHeader>
									<EmptyContent>
										<Button size="sm" className={actionClass()}>
											Compose message
										</Button>
									</EmptyContent>
								</Empty>
							) : null}

							{state === "error" ? (
								<div className="flex flex-col items-center gap-3 text-center">
									<ErrorState
										layout="inline"
										title="Could not load messages"
										message="Could not load messages. Check your connection, then try again."
										supportId={demoErrorId}
										retryTestId="state-retry"
										onRetry={() =>
											toast.error("Still offline", {
												description:
													"Demo error path - wire your API retry here.",
											})
										}
									/>
								</div>
							) : null}

							{state === "partial" ? (
								<div className="flex flex-col gap-3">
									<StatusPill status="warning">Some data loaded</StatusPill>
									<p className="text-caption text-muted-foreground">
										Core fields arrived; one slice failed. Retry the failed
										piece without reloading the rest.
									</p>
									<div className="grid gap-2 sm:grid-cols-2">
										<div className="rounded-lg bg-card p-3 shadow-border">
											<p className="text-body font-medium">Alpha</p>
											<p className="text-label text-muted-foreground">active</p>
										</div>
										<div className="rounded-lg bg-card p-3 shadow-border">
											<p className="text-body font-medium">Beta</p>
											<p className="text-label text-muted-foreground">draft</p>
										</div>
									</div>
									<Marker layout="border" className="justify-between">
										<MarkerContent>Activity feed unavailable</MarkerContent>
										<Button
											size="sm"
											variant="outline"
											className={actionClass()}
										>
											<RefreshCw data-icon="inline-start" />
											Retry feed
										</Button>
									</Marker>
									<p className="text-label text-muted-foreground">
										Failed metric: <MetricValue value={null} />
									</p>
								</div>
							) : null}

							{state === "conflict" ? (
								<div className="flex flex-col gap-3">
									<StatusPill status="warning">
										Two versions of this draft
									</StatusPill>
									<p className="text-caption text-muted-foreground">
										You and another session edited the same resource. Pick a
										version or merge manually; last write never wins silently.
									</p>
									<div className="grid gap-2 sm:grid-cols-2">
										<div className="rounded-lg bg-surface-tinted p-3 shadow-border">
											<p className="flex items-center gap-1.5 text-body font-medium">
												<GitBranch className="size-3.5" aria-hidden />
												Your version
											</p>
											<p className="mt-1 text-label text-muted-foreground">
												Ship the offline queue first.
											</p>
										</div>
										<div className="rounded-lg bg-card p-3 shadow-border">
											<p className="text-body font-medium">Their version</p>
											<p className="mt-1 text-label text-muted-foreground">
												Ship partial metrics first.
											</p>
										</div>
									</div>
									<div className="flex flex-wrap gap-2">
										<Button size="sm" className={actionClass()}>
											Keep yours
										</Button>
										<Button size="sm" variant="outline">
											Keep theirs
										</Button>
									</div>
								</div>
							) : null}

							{state === "offline" ? (
								<div className="flex flex-col items-center gap-3 text-center">
									<StatusPill status="error">
										<span className="inline-flex items-center gap-1.5">
											<WifiOff className="size-3" aria-hidden />
											{"You\u2019re offline"}
										</span>
									</StatusPill>
									<p className="max-w-prose text-caption text-muted-foreground">
										Queued writes stay on this device and sync when the
										connection returns. Actions that need the network stay
										disabled.
									</p>
									<p className="text-label text-muted-foreground">
										1 message queued
									</p>
								</div>
							) : null}

							{state === "ready" ? (
								<p className="text-body text-muted-foreground">
									Happy path lives in the chat feature section below. Use this
									panel to verify non-happy states before shipping a real route.
								</p>
							) : null}
						</ContentSlot>
					</div>
				</CardContent>
			</Card>
		</ShowcaseSection>
	);
}
