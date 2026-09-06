import type { Release } from "@/contract/migration";

import { StatusMark, statusRowClass } from "@/components/status-mark";

import { type BoundDecisionRow } from "./desk-state";

const clock = new Intl.DateTimeFormat(undefined, {
	dateStyle: "medium",
	timeStyle: "short",
});

function when(iso: string | null): string {
	return iso ? clock.format(new Date(iso)) : "";
}

export type SignedVsNowProps = {
	release: Release;
	rows: BoundDecisionRow[];
	turns?: number;
};

/**
 * The per contra panel: what the reviewer signed on the left, what the batch
 * is now on the right. When nothing diverged the right column has nothing to
 * say, so it is not drawn.
 */
export function SignedVsNow({ release, rows, turns }: SignedVsNowProps) {
	const stale = release.state === "stale";
	const diverged = rows.filter((row) => row.diverged);
	const first = diverged[0];
	return (
		<section
			aria-label="Signed against now"
			className="space-y-4 rounded-xl border bg-card p-5"
		>
			<div className="flex flex-wrap items-baseline justify-between gap-3">
				<p className="text-caption">
					<span className="font-semibold">Signed by {release.approved_by}</span>
					<span className="text-muted-foreground">
						, {when(release.approved_at)}
						{turns ? ` (turn ${turns})` : ""}
					</span>
				</p>
				<StatusMark status={stale ? "stale" : "approved"} showNote={false} />
			</div>
			{rows.length > 0 ? (
				<div className="overflow-x-auto">
					<table className="w-full text-left text-caption">
						<caption className="sr-only">
							Decisions this approval was granted on
						</caption>
						<thead className="text-label text-muted-foreground">
							<tr>
								<th className="py-2 font-medium">Decision</th>
								<th className="px-3 py-2 font-medium">Signed</th>
								{stale ? <th className="px-3 py-2 font-medium">Now</th> : null}
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr
									key={row.label}
									className={`border-t ${row.diverged ? statusRowClass("stale") : ""}`}
								>
									<td className="py-2 font-medium">{row.label}</td>
									<td className="px-3 py-2">
										<span className="font-mono">v{row.signedVersion}</span>{" "}
										{row.signedTarget}
										<span className="block text-label text-muted-foreground">
											{row.signedBy}
										</span>
									</td>
									{stale ? (
										<td
											className={`px-3 py-2 ${row.diverged ? "text-status-stale-fg" : ""}`}
										>
											<span className="font-mono">v{row.nowVersion}</span>{" "}
											{row.nowTarget}
											<span className="block text-label text-muted-foreground">
												{row.nowBy}, {when(row.nowAt)}
											</span>
										</td>
									) : null}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : null}
			<p className="font-prose text-body text-muted-foreground">
				{first
					? `Decision ${first.label} moved from v${first.signedVersion} to v${first.nowVersion} by ${first.nowBy}. This approval was granted on v${first.signedVersion}, so it is stale until someone signs again.`
					: stale
						? `${release.state_reason}. This approval no longer covers the batch, so it is stale until someone signs again.`
						: `Nothing has changed since ${release.approved_by ?? "the reviewer"} signed.`}
			</p>
		</section>
	);
}
