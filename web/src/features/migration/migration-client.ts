import type {
	BatchKey,
	Capabilities,
	Decision,
	Posting,
	Receipt,
	Release,
	SourceRow,
} from "@/contract/migration";

import { parseApiProblem } from "@/lib/api-problem";

/** @public - reached through Overview.batches, never imported by name. */
export type Batch = {
	id: string;
	key: BatchKey;
	rows: number;
	statuses: Record<string, number>;
	release: Release | null;
	turns: number;
	totals: Record<string, { debit: string; credit: string }>;
};
/** @public - reached through Overview.gaps, never imported by name. */
export type Gap = {
	row: number;
	values: Record<string, string>;
	affected: number;
	entities: string[];
	history: Decision[];
};
export type Overview = {
	loaded: boolean;
	label?: string;
	source_count: number;
	batches: Batch[];
	gaps: Gap[];
};
export type Evidence = {
	posting: Posting;
	source: SourceRow[];
	mappings: SourceRow[];
	decisions: Decision[];
	approval: Release | null;
};
export type Adapter = {
	name: string;
	implemented: boolean;
	capabilities: Capabilities;
};
export type Connection = {
	company?: string;
	currency?: string;
	live_enabled?: boolean;
	problems: string[];
};
export type AccountPlan = {
	action: string;
	name?: string;
	spec: { account_number: string; account_name: string; root_type: string };
};
export type Comparison = {
	matched: number;
	expected: number;
	missing: number;
	unexpected: number;
	note: string;
	fields: string[];
};
export type Target = { row: number; account: string; trans_type: string };

export async function readApi<T>(path: string): Promise<T> {
	const response = await fetch(`/api/${path}`, { credentials: "same-origin" });
	if (!response.ok) throw await parseApiProblem(response);
	return decodeJson<T>(response);
}

export function decodeJson<T>(response: Response): Promise<T> {
	return response.json();
}

export async function writeApi(
	path: string,
	body: object | FormData,
	key?: string,
): Promise<Response> {
	const csrf = await readApi<{ token: string }>("csrf");
	const headers: Record<string, string> = { "X-CSRFToken": csrf.token };
	if (key) headers["Idempotency-Key"] = key;
	if (!(body instanceof FormData)) headers["Content-Type"] = "application/json";
	const response = await fetch(`/api/${path}`, {
		method: "POST",
		credentials: "same-origin",
		headers,
		body: body instanceof FormData ? body : JSON.stringify(body),
	});
	if (!response.ok) throw await parseApiProblem(response);
	return response;
}

export function formatAmount(amount: string, currency: string): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
	}).format(Number(amount));
}

export type { Posting, Receipt };
