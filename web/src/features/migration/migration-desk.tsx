import { useCallback, useEffect, useRef, useState } from "react";

import { ErrorState } from "@/components/error-state";
import { LoadingSurface } from "@/components/loading-surface";
import { MigrationSkeleton } from "@/components/migration-skeleton";
import { ReviewQueueEmpty } from "@/components/review-queue-empty";
import { SignedInAs } from "@/components/signed-in-as";
import { StaleBanner } from "@/components/stale-banner";
import { StatusMark, statusRowClass } from "@/components/status-mark";
import { Button } from "@/components/ui/button";
import { describeMigrationFailure } from "@/lib/migration-failure";
import { postingStatus } from "@/lib/posting-status";

import {
	IDLE,
	LOADING_OVERVIEW,
	LOADING_POSTINGS,
	reviewQueueEmptiness,
	staleBatches,
	type DeskActivity,
	type OverviewState,
	type PostingsState,
} from "./desk-state";
import { EvidenceDialog } from "./evidence-dialog";
import {
	formatAmount,
	decodeJson,
	readApi,
	writeApi,
	type AccountPlan,
	type Adapter,
	type Comparison,
	type Connection,
	type Evidence,
	type Overview,
	type Posting,
	type Receipt,
	type Target,
} from "./migration-client";

const fieldClass =
	"mt-1 min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-caption focus-ring";
const company = "Chalbury Co-Invest L.P.";

export function MigrationDesk() {
	const [overviewState, setOverviewState] =
		useState<OverviewState>(LOADING_OVERVIEW);
	const [adapters, setAdapters] = useState<Adapter[]>([]);
	const [selected, setSelected] = useState("");
	const [postingsState, setPostingsState] =
		useState<PostingsState>(LOADING_POSTINGS);
	const [offset, setOffset] = useState(0);
	const [activity, setActivity] = useState<DeskActivity>(IDLE);
	const [author, setAuthor] = useState("");
	const [gapRow, setGapRow] = useState(0);
	const [query, setQuery] = useState("");
	const [targets, setTargets] = useState<Target[]>([]);
	const [targetRow, setTargetRow] = useState(0);
	const [reason, setReason] = useState("");
	const [evidence, setEvidence] = useState<Evidence | null>(null);
	const [connection, setConnection] = useState<Connection | null>(null);
	const [accountPlan, setAccountPlan] = useState<AccountPlan[]>([]);
	const [receipts, setReceipts] = useState<Receipt[]>([]);
	const [confirmed, setConfirmed] = useState(false);
	const [comparison, setComparison] = useState<Comparison | null>(null);
	const [revision, setRevision] = useState(0);
	const working = useRef(false);
	const isWorking = activity.tag === "working";
	const setDone = useCallback((notice: string) => {
		setActivity({ tag: "done", notice });
	}, []);
	// The union above is the truth; this is the ready branch unwrapped, so the
	// many read sites below do not each have to re-narrow it.
	const overview =
		overviewState.tag === "ready" ? overviewState.overview : null;
	const stale = staleBatches(overview);
	const postings = postingsState.tag === "ready" ? postingsState.items : [];
	const total = postingsState.tag === "ready" ? postingsState.total : 0;
	const batch = overview?.batches.find(
		(candidate) => candidate.id === selected,
	);
	const gap = overview?.gaps.find((candidate) => candidate.row === gapRow);
	const approved = batch?.release?.state === "approved";
	const ready = batch?.statuses.ready === batch?.rows && Boolean(batch);
	const liveReady =
		approved &&
		batch?.key.legal_entity === company &&
		connection?.live_enabled &&
		connection.problems.length === 0;

	const refresh = useCallback(async () => {
		const summary = await readApi<Overview>("overview");
		setOverviewState({ tag: "ready", overview: summary });
		setSelected((current) =>
			summary.batches.some((candidate) => candidate.id === current)
				? current
				: (summary.batches[0]?.id ?? ""),
		);
		setReceipts((await readApi<{ items: Receipt[] }>("submissions")).items);
		setRevision((current) => current + 1);
	}, []);

	const act = useCallback(
		async (label: string, operation: () => Promise<void>) => {
			if (working.current) return;
			working.current = true;
			setActivity({ tag: "working", label });
			try {
				await operation();
				setActivity(IDLE);
			} catch (failure) {
				const described = describeMigrationFailure(failure);
				setActivity({ tag: "failed", failure: described });
				// A failed first load has no overview to fall back on, so the whole
				// surface owes the reviewer the error rather than an empty frame.
				setOverviewState((current) =>
					current.tag === "ready"
						? current
						: { tag: "failed", failure: described },
				);
			} finally {
				working.current = false;
			}
		},
		[],
	);

	useEffect(() => {
		void act("Loading migration", async () => {
			await refresh();
			setAdapters(
				(await readApi<{ adapters: Adapter[] }>("adapters")).adapters,
			);
		});
	}, [act, refresh]);

	useEffect(() => {
		if (!selected) return undefined;
		let current = true;
		setPostingsState(LOADING_POSTINGS);
		void readApi<{ items: Posting[]; total: number }>(
			`postings?batch=${selected}&offset=${offset}&revision=${revision}`,
		)
			.then((page) => {
				if (current) {
					setPostingsState({
						tag: "ready",
						items: page.items,
						total: page.total,
					});
				}
			})
			.catch((failure: unknown) => {
				if (current) {
					setPostingsState({
						tag: "failed",
						failure: describeMigrationFailure(failure),
					});
				}
			});
		return () => {
			current = false;
		};
	}, [selected, offset, revision]);

	async function load(path: string, body: object | FormData) {
		await writeApi(path, body);
		setGapRow(0);
		setTargetRow(0);
		setOffset(0);
		setComparison(null);
		setAccountPlan([]);
		setConfirmed(false);
		await refresh();
		setDone("Loaded. No mapping decisions or release approvals were invented.");
	}

	return (
		<div className="min-h-svh bg-background text-foreground">
			<header className="border-b">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5">
					<a
						href="/"
						className="focus-ring text-title font-semibold tracking-tight"
					>
						percontra<span className="text-primary">.</span>
					</a>
					<div className="flex items-center gap-3">
						<span className="text-caption text-muted-foreground">
							Migration review
						</span>
						<span aria-hidden className="text-caption text-muted-foreground">
							/
						</span>
						<SignedInAs fallback="Local operator" />
					</div>
				</div>
			</header>
			<main
				id="main"
				tabIndex={-1}
				className="mx-auto max-w-7xl space-y-8 px-5 py-8 outline-none"
			>
				<div className="flex flex-wrap items-end justify-between gap-5">
					<div className="space-y-2">
						<p className="text-label font-medium text-primary">
							SOURCE / DECISION / RELEASE / RECEIPT
						</p>
						<h1 className="text-display font-semibold tracking-tight">
							Know what you are signing off.
						</h1>
						<p className="max-w-2xl font-prose text-title text-muted-foreground">
							Every amount has a source. Every override has an author. A changed
							decision needs a fresh approval.
						</p>
					</div>
					<Button
						variant="outline"
						disabled={isWorking}
						onClick={() => void act("Refreshing", refresh)}
					>
						Refresh
					</Button>
				</div>
				<StaleBanner
					batchLabels={stale}
					onReview={() => void act("Refreshing", refresh)}
				/>
				<div aria-live="polite" className="space-y-2">
					{activity.tag === "working" ? (
						<p role="status" className="text-caption text-muted-foreground">
							{activity.label}. Reading the workbook takes 10 to 20 seconds on
							the full pack.
						</p>
					) : null}
					{activity.tag === "done" ? (
						<p
							role="status"
							className="rounded-lg border border-status-approved-mark/30 bg-status-approved-tint p-3 text-caption text-status-approved-fg"
						>
							{activity.notice}
						</p>
					) : null}
				</div>
				{activity.tag === "failed" ? (
					<ErrorState
						layout="inline"
						title={activity.failure.title}
						message={activity.failure.message}
						supportId={activity.failure.supportId}
						onRetry={
							activity.failure.retryable
								? () => void act("Retrying", refresh)
								: undefined
						}
						copyToastMessage="Reference copied"
					/>
				) : null}
				<section
					aria-label="Load migration"
					className="space-y-4 rounded-xl border bg-card p-5"
				>
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<h2 className="text-body font-semibold">
								1. Bring in the handover
							</h2>
							<p className="mt-1 text-caption text-muted-foreground">
								{overview?.loaded
									? `${overview.label ?? "Migration"}. ${overview.source_count.toLocaleString("en-US")} source rows read.`
									: "Start with the public example, or load the private dataset 02 pack locally."}
							</p>
						</div>
						<div className="flex flex-wrap gap-3">
							<Button
								variant="outline"
								disabled={isWorking}
								onClick={() =>
									void act("Loading public example", () => load("example", {}))
								}
							>
								Public example
							</Button>
							<Button
								disabled={isWorking}
								onClick={() =>
									void act("Reading dataset 02", () => load("upload", {}))
								}
							>
								Load dataset 02
							</Button>
						</div>
					</div>
					<details>
						<summary className="cursor-pointer focus-ring text-caption text-muted-foreground">
							Use your own copies of the dataset 02 workbooks
						</summary>
						<form
							className="mt-3 flex flex-wrap items-end gap-4"
							onSubmit={(event) => {
								event.preventDefault();
								const files = new FormData(event.currentTarget);
								void act("Uploading workbooks", () => load("upload", files));
							}}
						>
							<label className="text-caption">
								Investor-level GL
								<input
									className={fieldClass}
									name="gl"
									type="file"
									accept=".xlsx"
									required
								/>
							</label>
							<label className="text-caption">
								Reference and mapping workbook
								<input
									className={fieldClass}
									name="reference"
									type="file"
									accept=".xlsx"
									required
								/>
							</label>
							<Button type="submit" disabled={isWorking}>
								Upload both
							</Button>
						</form>
					</details>
				</section>
				<LoadingSurface
					active={overviewState.tag === "loading"}
					skeleton={<MigrationSkeleton />}
					slowMessage="Still reading. Large packs run to 34,000 source rows."
				/>
				{overview?.loaded && (
					<>
						<section aria-label="Batches" className="grid gap-3 md:grid-cols-3">
							{overview.batches.map((candidate) => (
								<button
									type="button"
									key={candidate.id}
									aria-pressed={selected === candidate.id}
									disabled={isWorking}
									onClick={() => {
										setSelected(candidate.id);
										setOffset(0);
										setComparison(null);
										setAccountPlan([]);
										setConfirmed(false);
									}}
									className={`space-y-3 rounded-xl border focus-ring p-5 text-left ${selected === candidate.id ? "border-primary bg-primary/5" : "bg-card hover:bg-muted"}`}
								>
									<div className="flex justify-between gap-3">
										<span className="font-mono text-label text-muted-foreground">
											BATCH {candidate.key.source_batch_id}
										</span>
										<span
											className={`text-label font-medium ${candidate.release?.state === "stale" ? "text-destructive" : "text-primary"}`}
										>
											{candidate.release?.state ?? "Not approved"}
										</span>
									</div>
									<h2 className="text-body font-semibold">
										{candidate.key.legal_entity}
									</h2>
									<p className="text-caption">
										{candidate.rows} rows / {candidate.statuses.ready ?? 0}{" "}
										ready / {candidate.rows - (candidate.statuses.ready ?? 0)}{" "}
										need attention
									</p>
								</button>
							))}
						</section>
						<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
							<section
								className="min-w-0 space-y-4 rounded-xl border bg-card p-5"
								aria-label="Batch review"
							>
								<div className="flex flex-wrap justify-between gap-3">
									<div>
										<h2 className="text-body font-semibold">
											2. Review the batch
										</h2>
										<p className="mt-1 text-caption text-muted-foreground">
											Click an amount to follow it back to the source.
										</p>
									</div>
									<span className="font-mono text-caption">
										{batch?.key.source_batch_id}
									</span>
								</div>
								{batch &&
									Object.entries(batch.totals).map(([currency, totals]) => (
										<div
											key={currency}
											className="flex flex-wrap gap-6 border-y py-4 text-caption"
										>
											<div className="space-y-1">
												<p className="text-muted-foreground">Debit</p>
												<p className="font-mono text-title">
													{formatAmount(totals.debit, currency)}
												</p>
											</div>
											<div className="space-y-1">
												<p className="text-muted-foreground">Credit</p>
												<p className="font-mono text-title">
													{formatAmount(totals.credit, currency)}
												</p>
											</div>
											<p className="self-end text-label text-muted-foreground">
												{ready
													? "All rows resolved"
													: "Resolved rows only; not a complete balance"}
											</p>
										</div>
									))}
								<div className="overflow-x-auto">
									<table className="w-full text-left text-caption">
										<caption className="sr-only">
											Generated postings for the selected batch
										</caption>
										<thead className="text-label text-muted-foreground">
											<tr>
												<th className="py-3 font-medium">Source row</th>
												<th className="px-3 font-medium">Treatment</th>
												<th className="px-3 text-right font-medium">Amount</th>
												<th className="pl-3 font-medium">Status</th>
											</tr>
										</thead>
										<tbody>
											{postings.map((posting) => {
												const status = postingStatus(posting, batch?.release);
												return (
													<tr
														key={posting.posting_id}
														className={`border-t ${statusRowClass(status)}`}
													>
														<td className="py-3 font-mono">
															{posting.source_refs[0]?.physical_row}
															<span className="block text-label text-muted-foreground">
																JE {posting.source_identity.je_index}
															</span>
														</td>
														<td className="max-w-xs px-3">
															{posting.destination?.trans_type ??
																posting.block_reason ??
																"Mapping decision needed"}
														</td>
														<td className="px-3 text-right">
															<button
																type="button"
																className="min-h-11 focus-ring font-mono whitespace-nowrap text-primary tabular-nums underline underline-offset-4"
																disabled={isWorking}
																onClick={() =>
																	void act("Opening evidence", async () => {
																		setEvidence(
																			await readApi<Evidence>(
																				`postings/${posting.posting_id}/evidence`,
																			),
																		);
																	})
																}
															>
																{posting.destination
																	? `${formatAmount(posting.destination.investor_amount_local.amount, posting.destination.transaction_currency)} ${posting.destination.is_debit ? "Dr" : "Cr"}`
																	: "View source"}
															</button>
														</td>
														<td className="pl-3">
															<StatusMark status={status} showNote={false} />
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
								{postingsState.tag === "loading" ? (
									<p
										role="status"
										className="text-caption text-muted-foreground"
									>
										Reading postings for this batch.
									</p>
								) : null}
								{postingsState.tag === "ready" &&
								postingsState.items.length === 0 ? (
									<p
										role="status"
										className="text-caption text-muted-foreground"
									>
										This batch generated no postings. Every source row in it was
										either out of the frozen entity scope or is waiting on a
										decision.
									</p>
								) : null}
								{postingsState.tag === "failed" ? (
									<ErrorState
										layout="inline"
										title={postingsState.failure.title}
										message={postingsState.failure.message}
										supportId={postingsState.failure.supportId}
									/>
								) : null}
								<div className="flex items-center justify-between gap-3">
									<Button
										variant="outline"
										disabled={offset === 0 || isWorking}
										onClick={() => setOffset(Math.max(0, offset - 50))}
									>
										Previous
									</Button>
									<span className="text-label text-muted-foreground">
										{offset + 1} to {Math.min(offset + 50, total)} of {total}
									</span>
									<Button
										variant="outline"
										disabled={offset + 50 >= total || isWorking}
										onClick={() => setOffset(offset + 50)}
									>
										Next
									</Button>
								</div>
								<div className="space-y-3 border-t pt-4">
									<h3 className="text-body font-semibold">
										3. Sign off this version
									</h3>
									<label className="block text-caption">
										Reviewer name
										<input
											className={fieldClass}
											value={author}
											onChange={(event) => setAuthor(event.target.value)}
											placeholder="Your name"
											autoComplete="name"
										/>
									</label>
									{batch?.release?.state === "stale" && (
										<p role="alert" className="text-caption text-destructive">
											A dependency changed. The previous approval is stale;
											export and posting are blocked.
										</p>
									)}
									<div className="flex flex-wrap gap-3">
										<Button
											disabled={!ready || !author.trim() || isWorking}
											onClick={() =>
												void act("Approving complete batch", async () => {
													await writeApi(`releases/${selected}/approve`, {
														author,
													});
													await refresh();
													setDone(
														"Approval saved against the current mapping and decision versions.",
													);
												})
											}
										>
											Approve {batch?.rows} rows
										</Button>
										<Button
											variant="outline"
											disabled={!approved || isWorking}
											onClick={() =>
												void act("Exporting approved batch", async () => {
													const response = await writeApi("exports", {
														batch: selected,
													});
													const url = URL.createObjectURL(
														await response.blob(),
													);
													const link = document.createElement("a");
													link.href = url;
													link.download = "phase1-loader.xlsx";
													link.click();
													setTimeout(() => URL.revokeObjectURL(url), 1000);
													setDone(
														"Exported; destination not checked. This is a file, not a destination receipt.",
													);
												})
											}
										>
											Export loader
										</Button>
										<Button
											variant="ghost"
											disabled={isWorking}
											onClick={() =>
												void act("Comparing reference fields", async () => {
													setComparison(
														await readApi<Comparison>(
															`compare?batch=${selected}`,
														),
													);
												})
											}
										>
											Check answer key
										</Button>
									</div>
									{!ready && (
										<p className="text-caption text-muted-foreground">
											Approval needs every row resolved. A manual decision is
											not permission to drop blocked rows.
										</p>
									)}
									{comparison && (
										<div className="rounded-lg bg-muted p-3 text-caption">
											<p className="font-semibold">
												{comparison.matched} of {comparison.expected} reference
												rows match on {comparison.fields.length} fields.
											</p>
											<p>
												{comparison.missing} missing / {comparison.unexpected}{" "}
												unexpected
											</p>
											<p className="mt-1 text-muted-foreground">
												{comparison.note}
											</p>
										</div>
									)}
								</div>
							</section>
							<aside className="space-y-4 rounded-xl border bg-card p-5">
								<h2 className="text-body font-semibold">
									Decisions, not silent fixes
								</h2>
								<p className="text-caption text-muted-foreground">
									These gaps come from the supplied Mapping Gaps sheet. Changing
									a decision invalidates only dependent approvals.
								</p>
								<div className="space-y-2">
									{reviewQueueEmptiness(overview, false) ? (
										<ReviewQueueEmpty
											reason={
												reviewQueueEmptiness(overview, false) ?? "resolved"
											}
										/>
									) : null}
									{overview.gaps.map((candidate) => (
										<button
											type="button"
											key={candidate.row}
											aria-pressed={candidate.row === gapRow}
											className={`w-full rounded-lg border focus-ring p-3 text-left text-caption ${candidate.row === gapRow ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
											onClick={() => {
												setGapRow(candidate.row);
												setTargetRow(0);
												setTargets([]);
												setReason("");
											}}
										>
											<p className="font-medium">
												{candidate.values.GL_Account} /{" "}
												{candidate.values.Trans_Type}
											</p>
											<p className="mt-1 text-muted-foreground">
												{candidate.affected} affected rows /{" "}
												{candidate.history.length
													? `decision v${candidate.history.at(-1)?.version ?? 0}`
													: "Unresolved"}
											</p>
											<p className="mt-1 text-label">
												{candidate.entities.join(", ")}
											</p>
										</button>
									))}
								</div>
								{gap && (
									<form
										className="space-y-3 border-t pt-4"
										onSubmit={(event) => {
											event.preventDefault();
											void act("Saving versioned decision", async () => {
												await writeApi("decisions", {
													gap_row: gapRow,
													target_row: targetRow,
													author,
													reason,
												});
												await refresh();
												setAccountPlan([]);
												setDone(
													"Decision recorded. Any affected approval now requires a fresh sign-off.",
												);
											});
										}}
									>
										<p className="text-caption">
											Mapping Gaps, row {gap.row}. Choose an evidenced target
											treatment below.
										</p>
										<label className="block text-caption">
											Find a target transaction type
											<input
												className={fieldClass}
												value={query}
												onChange={(event) => setQuery(event.target.value)}
												placeholder="For example: Administration"
											/>
										</label>
										<Button
											type="button"
											variant="outline"
											disabled={isWorking}
											onClick={() =>
												void act("Searching destination chart", async () => {
													setTargets(
														(
															await readApi<{ items: Target[] }>(
																`targets?q=${encodeURIComponent(query)}`,
															)
														).items,
													);
													setTargetRow(0);
												})
											}
										>
											Search Corvus chart
										</Button>
										<label className="block text-caption">
											Approved target
											<select
												required
												className={fieldClass}
												value={targetRow}
												onChange={(event) =>
													setTargetRow(Number(event.target.value))
												}
											>
												<option value={0}>Select a chart row</option>
												{targets.map((target) => (
													<option key={target.row} value={target.row}>
														{target.trans_type} / {target.account} / row{" "}
														{target.row}
													</option>
												))}
											</select>
										</label>
										<label className="block text-caption">
											Accounting reason
											<textarea
												required
												className={fieldClass}
												rows={3}
												value={reason}
												onChange={(event) => setReason(event.target.value)}
												placeholder="Why is this treatment appropriate?"
											/>
										</label>
										<p className="text-label text-muted-foreground">
											Recorded as {author || "the reviewer named in sign-off"}.
											This is a new version, not an edit to history.
										</p>
										<Button
											type="submit"
											disabled={
												!author.trim() ||
												!reason.trim() ||
												!targetRow ||
												isWorking
											}
										>
											Record decision v{(gap.history.at(-1)?.version ?? 0) + 1}
										</Button>
										{gap.history.map((decision) => (
											<div
												key={decision.version}
												className="border-t pt-3 text-caption"
											>
												<p className="font-medium">
													v{decision.version} / {decision.author}
												</p>
												<p>{decision.target.trans_type}</p>
												<p className="text-muted-foreground">
													{decision.reason}
												</p>
											</div>
										))}
									</form>
								)}
							</aside>
						</div>
					</>
				)}
				<section className="space-y-4 rounded-xl border bg-card p-5">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h2 className="text-body font-semibold">
								4. Destination acceptance
							</h2>
							<p className="mt-1 text-caption text-muted-foreground">
								ERPNext is an optional live general ledger, not a fund
								allocation engine. Only {company} may be posted.
							</p>
						</div>
						<Button
							variant="outline"
							disabled={isWorking}
							onClick={() =>
								void act("Checking ERPNext (read only)", async () => {
									setConnection(
										await readApi<Connection>("connections/erpnext"),
									);
								})
							}
						>
							Check connection
						</Button>
					</div>
					{connection && (
						<div className="space-y-3">
							<p className="text-caption">
								{connection.company ?? "Not connected"} /{" "}
								{connection.currency ?? "Currency unverified"} /{" "}
								{connection.live_enabled
									? "Local live writes enabled"
									: "Live writes disabled"}
							</p>
							{connection.problems.map((problem) => (
								<p key={problem} className="text-caption text-destructive">
									{problem}
								</p>
							))}
							<div className="flex flex-wrap gap-3">
								<Button
									variant="outline"
									disabled={!liveReady || isWorking}
									onClick={() =>
										void act("Previewing account changes", async () => {
											const response = await writeApi(
												"connections/erpnext/preview",
												{ batch: selected },
											);
											const preview = await decodeJson<{
												accounts: AccountPlan[];
											}>(response);
											setAccountPlan(preview.accounts);
										})
									}
								>
									Preview account setup
								</Button>
								<Button
									variant="outline"
									disabled={!liveReady || accountPlan.length === 0 || isWorking}
									onClick={() =>
										void act("Provisioning company accounts", async () => {
											const response = await writeApi(
												"connections/erpnext/provision",
												{ batch: selected },
											);
											const provisioned = await decodeJson<{
												accounts: AccountPlan[];
											}>(response);
											setAccountPlan(provisioned.accounts);
											setDone(
												"Company accounts checked. No journal has been posted yet.",
											);
										})
									}
								>
									Create missing accounts
								</Button>
							</div>
							{accountPlan.map((account) => (
								<p key={account.spec.account_number} className="text-caption">
									{account.action}: {account.spec.account_number}{" "}
									{account.spec.account_name} ({account.spec.root_type})
								</p>
							))}
							<label className="flex items-start gap-3 text-caption">
								<input
									type="checkbox"
									className="mt-1 size-5 accent-primary"
									checked={confirmed}
									onChange={(event) => setConfirmed(event.target.checked)}
								/>
								I confirm this approved batch may be posted to {company} on
								percontra.l.frappe.cloud.
							</label>
							<Button
								disabled={
									!liveReady ||
									!confirmed ||
									accountPlan.length === 0 ||
									accountPlan.some((account) => account.action !== "reuse") ||
									isWorking
								}
								onClick={() =>
									void act("Submitting and verifying ledger", async () => {
										const storageKey = `percontra-submit-${selected}`;
										const key =
											sessionStorage.getItem(storageKey) ?? crypto.randomUUID();
										sessionStorage.setItem(storageKey, key);
										const response = await writeApi(
											"submissions",
											{ batch: selected, confirm_company: company },
											key,
										);
										const receipt = await decodeJson<Receipt>(response);
										await refresh();
										setDone(`${receipt.state}: ${receipt.detail}`);
										setConfirmed(false);
									})
								}
							>
								Post once and verify
							</Button>
						</div>
					)}
					{receipts.map((receipt) => (
						<div
							key={receipt.submission_id}
							className="space-y-2 rounded-lg border p-4"
						>
							<div className="flex flex-wrap justify-between gap-3">
								<p className="font-medium">
									{receipt.state} /{" "}
									{receipt.doc_names.join(", ") ||
										"Destination name not yet confirmed"}
								</p>
								<Button
									variant="outline"
									disabled={isWorking}
									onClick={() =>
										void act("Re-reading destination receipt", async () => {
											await writeApi(
												`submissions/${receipt.submission_id}/verify`,
												{},
											);
											await refresh();
										})
									}
								>
									Verify again
								</Button>
							</div>
							<p className="text-caption">{receipt.detail}</p>
							<p className="font-mono text-label break-all text-muted-foreground">
								Artifact {receipt.artifact_digest}
							</p>
							{receipt.doc_names.map((name) => (
								<a
									key={name}
									className="inline-block min-h-11 focus-ring text-caption text-primary underline"
									href={`https://percontra.l.frappe.cloud/app/journal-entry/${encodeURIComponent(name)}`}
									target="_blank"
									rel="noreferrer"
								>
									Open journal in ERPNext
								</a>
							))}
						</div>
					))}
				</section>
				<details className="rounded-xl border p-5">
					<summary className="cursor-pointer focus-ring font-medium">
						Adapters: what is actually connected
					</summary>
					<p className="my-3 text-caption text-muted-foreground">
						File evidence and decisions stay in Percontra. Capability
						declarations are not proof of vendor access.
					</p>
					<div className="overflow-x-auto">
						<table className="w-full text-left text-caption">
							<thead>
								<tr>
									{[
										"Adapter",
										"Implementation",
										"Source evidence",
										"Investor allocation",
										"Author / reason",
										"Receipt",
										"Change impact",
									].map((label) => (
										<th key={label} className="p-2 text-label font-medium">
											{label}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{adapters.map((adapter) => (
									<tr key={adapter.name} className="border-t">
										<td className="p-2 font-medium">{adapter.name}</td>
										<td className="p-2">
											{adapter.implemented ? "Implemented" : "Declared only"}
										</td>
										{Object.entries(adapter.capabilities).map(
											([name, capability]) => (
												<td key={name} className="p-2 text-muted-foreground">
													{capability.replaceAll("_", " ")}
												</td>
											),
										)}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</details>
				<footer className="pb-6 text-label text-muted-foreground">
					Local append-only review history, not a tamper-proof ledger. File
					exports do not prove destination acceptance. Private client workbooks
					are never bundled with the public demo.
				</footer>
			</main>
			<EvidenceDialog evidence={evidence} close={() => setEvidence(null)} />
		</div>
	);
}
