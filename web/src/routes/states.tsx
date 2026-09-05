import { createFileRoute } from "@tanstack/react-router";

import { ErrorState } from "@/components/error-state";
import { MigrationSkeleton } from "@/components/migration-skeleton";
import { ReviewQueueEmpty } from "@/components/review-queue-empty";
import { StaleBanner } from "@/components/stale-banner";
import { StatusMark } from "@/components/status-mark";
import { ApiProblem } from "@/lib/api-problem";
import { describeMigrationFailure } from "@/lib/migration-failure";
import { POSTING_STATUSES } from "@/lib/posting-status";
import { routeSeo, seoHead } from "@/lib/seo";

/**
 * Every non-happy state on one page, rendered from the same components the
 * workbench uses, with no server involved.
 *
 * A state nobody can look at is a state nobody maintains: reproducing a
 * malformed workbook or a stale approval on demand is slow enough that in
 * practice it never gets checked. This route is how those get reviewed, and it
 * is why the failure classifier takes an error rather than a preformatted
 * string. Not linked from the product and noindex.
 */
export const Route = createFileRoute("/states")({
	head: () => seoHead(routeSeo.states),
	component: StatesRoute,
});

function problem(status: number, detail: string): ApiProblem {
	return new ApiProblem({
		type: "about:blank",
		title: "Error",
		status,
		detail,
		request_id: "demo-1f4c",
	});
}

const FAILURES = [
	[
		"Malformed workbook",
		problem(400, "Sheet 'Mapping Gaps' is missing column 'GL_Account'"),
	],
	["Server failure", problem(500, "IndexError at generate.py line 88")],
	[
		"Not implemented",
		problem(501, "not implemented yet; see docs/posting-contract.md"),
	],
	["Superseded batch", problem(404, "no such batch")],
	["Never reached the server", new TypeError("Failed to fetch")],
] as const;

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-3">
			<h2 className="text-label font-medium tracking-label text-muted-foreground uppercase">
				{title}
			</h2>
			{children}
		</section>
	);
}

function StatesRoute() {
	return (
		<main
			id="main"
			tabIndex={-1}
			className="mx-auto max-w-5xl space-y-10 px-5 py-10 outline-none"
		>
			<header className="space-y-2">
				<h1 className="text-title font-semibold tracking-title">
					States review
				</h1>
				<p className="max-w-2xl text-caption text-muted-foreground">
					Every non-happy state the workbench can reach, rendered without a
					server. Not linked from the product.
				</p>
			</header>

			<Section title="Status vocabulary">
				<div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border bg-card p-4">
					{POSTING_STATUSES.map((status) => (
						<StatusMark key={status} status={status} />
					))}
				</div>
			</Section>

			<Section title="Stale approvals">
				<StaleBanner batchLabels={["Chalbury Co-Invest L.P. / batch 639661"]} />
				<StaleBanner
					batchLabels={[
						"Chalbury Co-Invest L.P. / batch 639661",
						"Kestrel Westvale Co-Invest LP / batch 995747",
					]}
				/>
			</Section>

			<Section title="Loading">
				<MigrationSkeleton />
			</Section>

			<Section title="Empty review queue">
				<div className="grid gap-4 md:grid-cols-3">
					{(["unloaded", "resolved", "filtered"] as const).map((reason) => (
						<div key={reason} className="rounded-xl border bg-card p-2">
							<ReviewQueueEmpty reason={reason} />
						</div>
					))}
				</div>
			</Section>

			<Section title="Failures">
				<div className="space-y-3">
					{FAILURES.map(([label, error]) => {
						const failure = describeMigrationFailure(error);
						return (
							<div key={label} className="space-y-1.5">
								<p className="text-label text-muted-foreground">{label}</p>
								<ErrorState
									layout="inline"
									title={failure.title}
									message={failure.message}
									supportId={failure.supportId}
									onRetry={failure.retryable ? () => {} : undefined}
								/>
							</div>
						);
					})}
				</div>
			</Section>
		</main>
	);
}
