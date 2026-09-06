import { Link } from "@tanstack/react-router";
import { ArrowLeftRight, ExternalLink, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/ui/status-pill";
import {
	ENTITIES,
	type Entity,
	type MigrationResult,
	PiperError,
	type PiperUser,
	type Provider,
	type ProviderId,
	disconnect,
	login,
	me,
	piperBaseUrl,
	preview,
	providerLoginUrl,
	providers as fetchProviders,
	readToken,
	register,
	run,
	seed,
	writeToken,
} from "@/features/bridge/piper-client";

/**
 * The live bridge: sign in to Piper, connect Xero and Zoho Books, then move
 * contacts, items and invoices from one to the other.
 *
 * Everything on this page talks to the Piper API, a separate process from the
 * Django desk. Cloudflare Access still decides who reaches this page; Piper's
 * own JWT decides who owns which provider connections.
 */
export function BridgePage() {
	const base = piperBaseUrl();
	const [user, setUser] = useState<PiperUser | null>(null);
	const [checking, setChecking] = useState(Boolean(readToken()));

	useEffect(() => {
		let current = true;
		if (readToken() && base) {
			me()
				.then((found) => {
					if (current) setUser(found);
				})
				.catch(() => writeToken(null))
				.finally(() => {
					if (current) setChecking(false);
				});
		}
		return () => {
			current = false;
		};
	}, [base]);

	return (
		<div className="min-h-svh bg-background text-foreground">
			<SiteHeader kicker="Per Contra: Bridge">
				<Link
					to="/"
					className="text-caption text-muted-foreground underline-offset-4 hover:underline"
				>
					Back to the desk
				</Link>
			</SiteHeader>
			<main
				id="main"
				tabIndex={-1}
				className="mx-auto w-full max-w-3xl space-y-8 border-x border-border/70 px-6 pb-16 outline-none"
			>
				<header className="space-y-2">
					<h1 className="text-title font-semibold tracking-title">
						Accounting bridge
					</h1>
					<p className="max-w-2xl font-prose text-body text-muted-foreground">
						Connect the system a fund is leaving and the one it is joining.
						Piper reads contacts, items and invoices from the source, reshapes
						them for the destination, and creates them there. Anything that had
						to be adapted rather than copied is listed, not hidden.
					</p>
				</header>

				{!base ? (
					<Notice tone="warning">
						The bridge API address is not configured. Set{" "}
						<code>VITE_PIPER_API_URL</code> at build time to enable the live
						controls.
					</Notice>
				) : checking ? (
					<p className="text-caption text-muted-foreground">
						Checking session...
					</p>
				) : user ? (
					<>
						<Section title="Signed in to Piper">
							<div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
								<span className="text-caption">{user.email}</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										writeToken(null);
										setUser(null);
									}}
								>
									Sign out
								</Button>
							</div>
						</Section>
						<Connections />
						<Migration />
					</>
				) : (
					<SignIn onSignedIn={setUser} />
				)}
			</main>
		</div>
	);
}

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

function Notice({
	tone,
	children,
}: {
	tone: "warning" | "error" | "info";
	children: React.ReactNode;
}) {
	const border =
		tone === "error"
			? "border-destructive/40"
			: tone === "warning"
				? "border-warning/40"
				: "border-border";
	return (
		<p className={`rounded-xl border bg-card px-4 py-3 text-caption ${border}`}>
			{children}
		</p>
	);
}

function describe(error: unknown): string {
	if (error instanceof PiperError) return error.message;
	if (error instanceof Error) return error.message;
	return "Something went wrong";
}

// ---- sign in

function SignIn({ onSignedIn }: { onSignedIn: (user: PiperUser) => void }) {
	const [email, setEmail] = useState("demo@piper.dev");
	const [password, setPassword] = useState("demo1234");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function submit(mode: "login" | "register") {
		setBusy(true);
		setError(null);
		try {
			const user =
				mode === "login"
					? await login(email, password)
					: await register(email, password);
			onSignedIn(user);
		} catch (caught) {
			setError(describe(caught));
		} finally {
			setBusy(false);
		}
	}

	return (
		<Section title="Sign in to Piper">
			<form
				className="space-y-4 rounded-xl border bg-card p-5"
				onSubmit={(event) => {
					event.preventDefault();
					void submit("login");
				}}
			>
				<p className="text-caption text-muted-foreground">
					Piper keeps each reviewer's Xero and Zoho Books connections apart. The
					demo account already has both connected.
				</p>
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-1.5">
						<Label htmlFor="piper-email">Email</Label>
						<Input
							id="piper-email"
							type="email"
							autoComplete="username"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="piper-password">Password</Label>
						<Input
							id="piper-password"
							type="password"
							autoComplete="current-password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
						/>
					</div>
				</div>
				{error ? <Notice tone="error">{error}</Notice> : null}
				<div className="flex gap-2">
					<Button type="submit" disabled={busy}>
						Sign in
					</Button>
					<Button
						type="button"
						variant="outline"
						disabled={busy}
						onClick={() => void submit("register")}
					>
						Create account
					</Button>
				</div>
			</form>
		</Section>
	);
}

// ---- provider connections

function Connections() {
	const [list, setList] = useState<Provider[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		try {
			setList(await fetchProviders());
			setError(null);
		} catch (caught) {
			setError(describe(caught));
		}
	}, []);

	useEffect(() => {
		void refresh();
		// The OAuth consent happens in another tab; when the reviewer comes back,
		// the connection state has changed underneath this one.
		const onFocus = () => void refresh();
		window.addEventListener("focus", onFocus);
		return () => window.removeEventListener("focus", onFocus);
	}, [refresh]);

	return (
		<Section title="Connections">
			{error ? <Notice tone="error">{error}</Notice> : null}
			<div className="grid gap-3 sm:grid-cols-2">
				{(list ?? []).map((provider) => (
					<ProviderCard
						key={provider.id}
						provider={provider}
						onChanged={refresh}
					/>
				))}
			</div>
			{list === null && !error ? (
				<p className="text-caption text-muted-foreground">Loading...</p>
			) : null}
		</Section>
	);
}

function ProviderCard({
	provider,
	onChanged,
}: {
	provider: Provider;
	onChanged: () => Promise<void>;
}) {
	const [busy, setBusy] = useState(false);
	const href = providerLoginUrl(provider);
	const orgs = provider.organisations.filter(
		(name): name is string => typeof name === "string" && name !== "",
	);

	return (
		<div className="space-y-3 rounded-xl border bg-card p-4">
			<div className="flex items-center justify-between">
				<span className="text-body font-medium">{provider.name}</span>
				<StatusPill status={provider.connected ? "success" : "neutral"}>
					{provider.connected ? "Connected" : "Not connected"}
				</StatusPill>
			</div>
			<p className="min-h-5 text-caption text-muted-foreground">
				{orgs.length > 0 ? orgs.join(", ") : "No organisation yet"}
			</p>
			<div className="flex gap-2">
				{href ? (
					<a
						href={href}
						target="_blank"
						rel="noreferrer"
						className="inline-flex h-7 items-center gap-1 rounded-lg border px-2.5 text-caption font-medium"
					>
						{provider.connected ? "Reconnect" : "Connect"}
						<ExternalLink aria-hidden="true" className="size-3.5" />
					</a>
				) : null}
				{provider.connected ? (
					<Button
						variant="ghost"
						size="sm"
						disabled={busy}
						onClick={() => {
							setBusy(true);
							void disconnect(provider.id)
								.then(onChanged)
								.finally(() => setBusy(false));
						}}
					>
						Disconnect
					</Button>
				) : null}
			</div>
		</div>
	);
}

// ---- migration controls

const LABELS: Record<ProviderId, string> = { zoho: "Zoho Books", xero: "Xero" };

function Migration() {
	const [source, setSource] = useState<ProviderId>("zoho");
	const target: ProviderId = source === "zoho" ? "xero" : "zoho";
	const [entities, setEntities] = useState<readonly Entity[]>(ENTITIES);
	const [busy, setBusy] = useState<"seed" | "preview" | "run" | null>(null);
	const [result, setResult] = useState<MigrationResult | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function act(kind: "seed" | "preview" | "run") {
		setBusy(kind);
		setError(null);
		setMessage(null);
		try {
			if (kind === "seed") {
				const seeded = await seed(source, 3);
				const failed =
					seeded.failed.length > 0 ? ` (${seeded.failed.length} failed)` : "";
				setMessage(
					`Seeded ${LABELS[source]}: ${seeded.contacts.length} contacts, ${seeded.items.length} items, ${seeded.invoices.length} invoices${failed}`,
				);
			} else if (kind === "preview") {
				setResult(await preview(source, target, entities));
			} else {
				setResult(await run(source, target, entities));
			}
		} catch (caught) {
			setError(describe(caught));
		} finally {
			setBusy(null);
		}
	}

	function toggle(entity: Entity) {
		setEntities((current) =>
			current.includes(entity)
				? current.filter((item) => item !== entity)
				: ENTITIES.filter((item) => item === entity || current.includes(item)),
		);
	}

	return (
		<Section title="Migrate">
			<div className="space-y-5 rounded-xl border bg-card p-5">
				<div className="flex flex-wrap items-center gap-3">
					<span className="text-body font-medium">{LABELS[source]}</span>
					<Button
						variant="outline"
						size="icon-sm"
						aria-label="Swap direction"
						onClick={() => setSource(target)}
					>
						<ArrowLeftRight aria-hidden="true" />
					</Button>
					<span className="text-body font-medium">{LABELS[target]}</span>
				</div>

				<fieldset className="flex flex-wrap gap-4">
					<legend className="mb-2 text-caption text-muted-foreground">
						Entities, loaded in dependency order
					</legend>
					{ENTITIES.map((entity) => (
						<label
							key={entity}
							className="flex items-center gap-2 text-caption capitalize"
						>
							<input
								type="checkbox"
								checked={entities.includes(entity)}
								onChange={() => toggle(entity)}
							/>
							{entity}
						</label>
					))}
				</fieldset>

				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						disabled={busy !== null}
						onClick={() => void act("seed")}
					>
						Seed demo data into {LABELS[source]}
					</Button>
					<Button
						variant="secondary"
						disabled={busy !== null || entities.length === 0}
						onClick={() => void act("preview")}
					>
						Preview
					</Button>
					<Button
						disabled={busy !== null || entities.length === 0}
						onClick={() => void act("run")}
					>
						{busy === "run" ? (
							<RefreshCw aria-hidden="true" className="animate-spin" />
						) : null}
						Run migration
					</Button>
				</div>

				{busy ? (
					<p className="text-caption text-muted-foreground">
						{busy === "seed"
							? "Creating demo records..."
							: busy === "preview"
								? "Reading the source and shaping records..."
								: "Reading the source and writing to the destination..."}
					</p>
				) : null}
				{message ? <Notice tone="info">{message}</Notice> : null}
				{error ? <Notice tone="error">{error}</Notice> : null}
			</div>

			{result ? <ResultView result={result} /> : null}
		</Section>
	);
}

function ResultView({ result }: { result: MigrationResult }) {
	const rows = ENTITIES.flatMap((entity) => {
		const report = result.entities[entity];
		return report ? [[entity, report] as const] : [];
	});
	const failures = rows.flatMap(([entity, report]) =>
		report.failed.map((failure) => ({ entity, ...failure })),
	);

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-3">
				<StatusPill
					status={result.ok ? (result.dry_run ? "info" : "success") : "error"}
				>
					{result.dry_run ? "Preview, nothing written" : "Migration run"}
				</StatusPill>
				<span className="text-caption text-muted-foreground">
					{result.direction}, {result.seconds}s
				</span>
			</div>

			<div className="overflow-x-auto rounded-xl border">
				<table className="w-full text-caption">
					<thead className="bg-muted/40 text-left text-label text-muted-foreground uppercase">
						<tr>
							<th className="px-3 py-2 font-medium">Entity</th>
							<th className="px-3 py-2 font-medium">Read</th>
							<th className="px-3 py-2 font-medium">
								{result.dry_run ? "Would create" : "Created"}
							</th>
							<th className="px-3 py-2 font-medium">Matched existing</th>
							<th className="px-3 py-2 font-medium">Already migrated</th>
							<th className="px-3 py-2 font-medium">Failed</th>
						</tr>
					</thead>
					<tbody>
						{rows.map(([entity, report]) => (
							<tr key={entity} className="border-t">
								<td className="px-3 py-2 capitalize">{entity}</td>
								<td className="px-3 py-2 tabular-nums">{report.extracted}</td>
								<td className="px-3 py-2 tabular-nums">{report.created}</td>
								<td className="px-3 py-2 tabular-nums">
									{report.matched_existing}
								</td>
								<td className="px-3 py-2 tabular-nums">
									{report.already_migrated}
								</td>
								<td className="px-3 py-2 tabular-nums">
									{report.failed.length}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{result.notes.length > 0 ? (
				<div className="space-y-2">
					<h3 className="text-label font-medium tracking-label text-muted-foreground uppercase">
						Adapted, not copied
					</h3>
					<ul className="list-disc space-y-1 pl-5 text-caption">
						{result.notes.map((note) => (
							<li key={note}>{note}</li>
						))}
					</ul>
				</div>
			) : null}

			{failures.length > 0 ? (
				<div className="space-y-2">
					<h3 className="text-label font-medium tracking-label text-destructive uppercase">
						Failed records
					</h3>
					<ul className="space-y-1 text-caption">
						{failures.map((failure) => (
							<li key={`${failure.entity}-${failure.source_id}`}>
								<span className="capitalize">{failure.entity}</span>{" "}
								{failure.name ?? failure.source_id}: {failure.error}
							</li>
						))}
					</ul>
				</div>
			) : null}
		</div>
	);
}
