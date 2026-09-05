import type { SourceRow } from "@/contract/migration";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import { formatAmount, type Evidence } from "./migration-client";

function SourceCard({ row }: { row: SourceRow }) {
	return (
		<details className="rounded-lg border p-3">
			<summary className="cursor-pointer focus-ring text-caption font-medium">
				{row.source.sheet}, row {row.source.physical_row}
			</summary>
			<p className="mt-2 text-label break-all text-muted-foreground">
				{row.source.file_name} / SHA-256 {row.source.file_digest}
			</p>
			<dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-caption">
				{Object.entries(row.values)
					.filter(([, content]) => content !== "")
					.map(([name, content]) => (
						<div
							key={name}
							className="col-span-2 grid grid-cols-subgrid border-t py-1"
						>
							<dt className="break-words text-muted-foreground">
								{name.replaceAll("_", " ")}
							</dt>
							<dd className="break-words">{content}</dd>
						</div>
					))}
			</dl>
		</details>
	);
}

export function EvidenceDialog({
	evidence,
	close,
}: {
	evidence: Evidence | null;
	close: () => void;
}) {
	const target = evidence?.posting.destination;
	return (
		<Dialog
			open={evidence !== null}
			onOpenChange={(open) => {
				if (!open) close();
			}}
		>
			<DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>
						{target
							? formatAmount(
									target.investor_amount_local.amount,
									target.transaction_currency,
								)
							: "Unresolved posting"}
						: evidence
					</DialogTitle>
					<DialogDescription>
						Original rows, the mappings used, and who approved this version.
					</DialogDescription>
				</DialogHeader>
				{evidence && (
					<div className="space-y-5">
						<p className="text-caption">
							{evidence.posting.batch_key.legal_entity} / Batch{" "}
							{evidence.posting.batch_key.source_batch_id} / JE{" "}
							{evidence.posting.source_identity.je_index}, transaction{" "}
							{evidence.posting.source_identity.transaction_index}
						</p>
						<section className="space-y-2">
							<h3 className="font-medium">1. Source evidence</h3>
							{evidence.source.map((row) => (
								<SourceCard key={row.source.physical_row} row={row} />
							))}
						</section>
						<section className="space-y-2">
							<h3 className="font-medium">2. Mapping versions</h3>
							{evidence.posting.mappings_used.map((mapping) => (
								<p
									key={`${mapping.table}-${mapping.source.physical_row}`}
									className="text-caption"
								>
									{mapping.table} v{mapping.version} / {mapping.source.sheet},
									row {mapping.source.physical_row}
								</p>
							))}
							{evidence.mappings.map((row) => (
								<SourceCard
									key={`${row.source.sheet}-${row.source.physical_row}`}
									row={row}
								/>
							))}
						</section>
						<section className="space-y-2">
							<h3 className="font-medium">3. Decision history</h3>
							{evidence.decisions.length === 0 ? (
								<p className="text-caption text-muted-foreground">
									No manual decision used; resolved from the supplied
									crosswalks.
								</p>
							) : (
								evidence.decisions.map((decision) => (
									<div
										key={`${decision.decision_id}-${decision.version}`}
										className="rounded-lg border p-3 text-caption"
									>
										<p className="font-medium">
											v{decision.version} / {decision.target.trans_type} /{" "}
											{decision.author}
										</p>
										<p>{decision.reason}</p>
										<p className="text-muted-foreground">
											{new Date(decision.decided_at).toLocaleString("en-GB")}
										</p>
									</div>
								))
							)}
						</section>
						<section className="space-y-2">
							<h3 className="font-medium">4. Release approval</h3>
							<p className="text-caption">
								{evidence.approval
									? `${evidence.approval.state} / ${evidence.approval.approved_by ?? "Unnamed reviewer"} / ${evidence.approval.state_reason}`
									: "Not approved for export."}
							</p>
							{evidence.approval && (
								<p className="font-mono text-label break-all text-muted-foreground">
									Snapshot {evidence.approval.mapping_snapshot_digest}
								</p>
							)}
						</section>
						{evidence.posting.warnings.map((warning) => (
							<p key={warning.code} className="text-caption text-warning">
								{warning.message}
							</p>
						))}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
