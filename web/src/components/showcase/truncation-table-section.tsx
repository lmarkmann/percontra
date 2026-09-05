import { ShowcaseSection } from "@/components/showcase/showcase-section";
import { StatusPill } from "@/components/ui/status-pill";

const rows = [
	{
		id: "1",
		name: "Launch checklist for the first production deploy",
		owner: "Ada Lovelace",
		status: "active",
		note: "Includes offline queue reconciliation and absolute OG image wiring on the public origin.",
	},
	{
		id: "2",
		name: "Design review notes",
		owner: "Josef Albers",
		status: "draft",
		note: "Truncation matrix: single-line ellipsis versus multi-line clamp for dense tables.",
	},
	{
		id: "3",
		name: "Accessibility finish pass",
		owner: "Vint Cerf",
		status: "active",
		note: "Contrast, tab order, and motion CPU checks before ship.",
	},
] as const;

export function TruncationTableSection() {
	return (
		<ShowcaseSection
			slug="truncation-and-tables"
			figure="13 / Truncation"
			title="Truncation and tables"
			description="Single-line truncate, multi-line clamp, and a compact data table for long cell content."
		>
			<div className="flex flex-col gap-6">
				<div className="grid gap-3 sm:grid-cols-3">
					<div className="min-w-0 rounded-xl bg-card p-3 shadow-border">
						<p className="mb-1 font-mono text-label tracking-label text-muted-foreground uppercase">
							truncate
						</p>
						<p className="truncate text-caption">
							This single line ends with an ellipsis when the container is
							narrower than the full sentence about truncation matrix coverage.
						</p>
					</div>
					<div className="min-w-0 rounded-xl bg-card p-3 shadow-border">
						<p className="mb-1 font-mono text-label tracking-label text-muted-foreground uppercase">
							line-clamp-2
						</p>
						<p className="line-clamp-2 text-caption">
							Two lines of body copy clamp here. Extra sentences stay available
							to assistive tech in the full text node but are visually cut after
							the second line for dense layouts.
						</p>
					</div>
					<div className="min-w-0 rounded-xl bg-card p-3 shadow-border">
						<p className="mb-1 font-mono text-label tracking-label text-muted-foreground uppercase">
							line-clamp-3
						</p>
						<p className="line-clamp-3 text-caption">
							Three-line clamp for notes and descriptions that need more context
							than a title row without expanding the table row height unbounded.
							Prefer this for secondary columns.
						</p>
					</div>
				</div>

				<div className="overflow-x-auto rounded-xl bg-card shadow-border">
					<table className="w-full min-w-xl border-collapse text-left text-caption">
						<thead className="border-b border-border bg-muted/40">
							<tr>
								<th className="px-3 py-2 font-medium">Name</th>
								<th className="px-3 py-2 font-medium">Owner</th>
								<th className="px-3 py-2 font-medium">Status</th>
								<th className="px-3 py-2 font-medium">Note</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr
									key={row.id}
									className="duration-fast border-b border-border/70 transition-[background-color] ease-out last:border-0 hover-fine:hover:bg-muted/40"
								>
									<td className="max-w-40 px-3 py-2 font-medium">
										<span className="block truncate" title={row.name}>
											{row.name}
										</span>
									</td>
									<td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
										{row.owner}
									</td>
									<td className="px-3 py-2">
										<StatusPill
											status={row.status === "active" ? "success" : "neutral"}
										>
											{row.status}
										</StatusPill>
									</td>
									<td className="max-w-56 px-3 py-2 text-muted-foreground">
										<span className="line-clamp-2" title={row.note}>
											{row.note}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</ShowcaseSection>
	);
}
