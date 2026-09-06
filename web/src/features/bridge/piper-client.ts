import { env } from "@/env";

/**
 * Client for the Piper bridge API (piper/ at the repository root).
 *
 * Piper is a separate FastAPI process: it holds the Xero and Zoho Books OAuth
 * connections and runs the migration between them. It is reached cross-origin
 * at `VITE_PIPER_API_URL`, never through Django, so it does not go through
 * `apiRequest`: the Access session cookie means nothing to it and its errors
 * are plain `{ detail }` bodies, not RFC 9457 problems.
 *
 * Auth is a bearer JWT issued by Piper itself, kept in localStorage. The two
 * OAuth logins are browser navigations and carry the same JWT as `?token=`.
 */

const TOKEN_KEY = "piper.jwt";

export function piperBaseUrl(): string | undefined {
	return env.VITE_PIPER_API_URL?.replace(/\/$/, "");
}

export function readToken(): string | null {
	try {
		return localStorage.getItem(TOKEN_KEY);
	} catch {
		return null;
	}
}

export function writeToken(token: string | null): void {
	try {
		if (token) localStorage.setItem(TOKEN_KEY, token);
		else localStorage.removeItem(TOKEN_KEY);
	} catch {
		// Storage unavailable (private mode, blocked): the session lasts the page.
	}
}

export class PiperError extends Error {
	readonly status: number;
	constructor(status: number, message: string) {
		super(message);
		this.name = "PiperError";
		this.status = status;
	}
}

function decodeJson<T>(response: Response): Promise<T> {
	return response.json();
}

async function request<T>(
	path: string,
	init: { method?: string; body?: unknown } = {},
): Promise<T> {
	const base = piperBaseUrl();
	if (!base) {
		throw new PiperError(0, "VITE_PIPER_API_URL is not set");
	}
	const headers = new Headers({
		Accept: "application/json",
		// ngrok's free tier interposes an HTML warning page on requests that lack
		// this header; the value is irrelevant, only its presence.
		"ngrok-skip-browser-warning": "1",
	});
	const token = readToken();
	if (token) headers.set("Authorization", `Bearer ${token}`);
	let payload: string | undefined;
	if (init.body !== undefined) {
		headers.set("Content-Type", "application/json");
		payload = JSON.stringify(init.body);
	}
	const response = await fetch(`${base}${path}`, {
		method: init.method ?? "GET",
		headers,
		body: payload,
	});
	if (!response.ok) {
		let detail = `${response.status} ${response.statusText}`;
		try {
			const body = await decodeJson<{ detail?: unknown }>(response);
			if (typeof body.detail === "string") detail = body.detail;
			else if (body.detail !== undefined) detail = JSON.stringify(body.detail);
		} catch {
			// Non-JSON error body: keep the status line.
		}
		throw new PiperError(response.status, detail);
	}
	return decodeJson<T>(response);
}

// ---- auth

export type PiperUser = { id: number; email: string };
type AuthResponse = { token: string; user: PiperUser };

export async function login(
	email: string,
	password: string,
): Promise<PiperUser> {
	const auth = await request<AuthResponse>("/api/auth/login", {
		method: "POST",
		body: { email, password },
	});
	writeToken(auth.token);
	return auth.user;
}

export async function register(
	email: string,
	password: string,
): Promise<PiperUser> {
	const auth = await request<AuthResponse>("/api/auth/register", {
		method: "POST",
		body: { email, password },
	});
	writeToken(auth.token);
	return auth.user;
}

export function me(): Promise<PiperUser> {
	return request<PiperUser>("/api/auth/me");
}

// ---- providers

export type ProviderId = "xero" | "zoho";
export type Provider = {
	id: ProviderId;
	name: string;
	login: string;
	connected: boolean;
	organisations: Array<string | null>;
	updated_at: number | null;
};

export function providers(): Promise<Provider[]> {
	return request<Provider[]>("/api/providers");
}

/** Absolute URL for the OAuth consent redirect; opened as a navigation, not fetched. */
export function providerLoginUrl(provider: Provider): string | undefined {
	const base = piperBaseUrl();
	const token = readToken();
	if (!base || !token) return undefined;
	return `${base}${provider.login}?token=${encodeURIComponent(token)}`;
}

export function disconnect(provider: ProviderId): Promise<{ ok: boolean }> {
	return request<{ ok: boolean }>(`/api/providers/${provider}`, {
		method: "DELETE",
	});
}

// ---- migration

export const ENTITIES = ["contacts", "items", "invoices"] as const;
export type Entity = (typeof ENTITIES)[number];

type EntityReport = {
	extracted: number;
	created: number;
	matched_existing: number;
	already_migrated: number;
	failed: Array<{ source_id: string; name: string | null; error: string }>;
	sample_payload: unknown;
};

export type MigrationResult = {
	ok: boolean;
	direction: string;
	dry_run: boolean;
	seconds: number;
	entities: Partial<Record<Entity, EntityReport>>;
	notes: string[];
};

function migrationPath(
	action: "preview" | "run",
	source: ProviderId,
	target: ProviderId,
	entities: readonly Entity[],
	limit: number,
): string {
	const query = new URLSearchParams({
		source,
		target,
		entities: entities.join(","),
		limit: String(limit),
	});
	return `/api/migrate/${action}?${query.toString()}`;
}

export function preview(
	source: ProviderId,
	target: ProviderId,
	entities: readonly Entity[],
	limit = 50,
): Promise<MigrationResult> {
	return request<MigrationResult>(
		migrationPath("preview", source, target, entities, limit),
	);
}

export function run(
	source: ProviderId,
	target: ProviderId,
	entities: readonly Entity[],
	limit = 50,
): Promise<MigrationResult> {
	return request<MigrationResult>(
		migrationPath("run", source, target, entities, limit),
		{ method: "POST" },
	);
}

export type SeedResult = {
	contacts: Array<{ id: string; name: string }>;
	items: Array<{ id: string; name: string }>;
	invoices: Array<{ id: string; number: string }>;
	failed: Array<Record<string, string>>;
};

export function seed(target: ProviderId, n = 3): Promise<SeedResult> {
	return request<SeedResult>(`/api/migrate/seed?target=${target}&n=${n}`);
}
