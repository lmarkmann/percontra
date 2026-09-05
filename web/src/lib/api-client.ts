import { env } from "@/env";
import { getRegisteredAccessToken } from "@/lib/api-auth";
import { parseApiProblem } from "@/lib/api-problem";
import { reportError } from "@/lib/error-reporting";

function apiBaseUrl(): string {
	const base = env.VITE_API_BASE_URL?.replace(/\/$/, "");
	if (!base) {
		throw new Error("VITE_API_BASE_URL is not set");
	}
	return base;
}

function resolveUrl(path: string): string {
	const base = apiBaseUrl();
	if (path.startsWith("http://") || path.startsWith("https://")) {
		return path;
	}
	return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export type ApiRequestInit = Omit<RequestInit, "body"> & {
	body?: unknown;
};

/**
 * Backend-agnostic HTTP transport.
 * Cookie sessions: credentials always "include" so cross-origin APIs work when CORS allows.
 * Errors: non-OK responses become ApiProblem (RFC 9457).
 */
export async function apiRequest(
	path: string,
	init: ApiRequestInit = {},
): Promise<Response> {
	const { body, headers, ...rest } = init;
	const requestHeaders = new Headers(headers);
	let payload: BodyInit | undefined;
	if (body !== undefined) {
		if (!requestHeaders.has("Content-Type")) {
			requestHeaders.set("Content-Type", "application/json");
		}
		payload = JSON.stringify(body);
	}
	if (!requestHeaders.has("Authorization")) {
		const accessToken = await getRegisteredAccessToken();
		if (accessToken) {
			requestHeaders.set("Authorization", `Bearer ${accessToken}`);
		}
	}
	const response = await fetch(resolveUrl(path), {
		...rest,
		headers: requestHeaders,
		body: payload,
		credentials: "include",
	});
	if (!response.ok) {
		const problem = await parseApiProblem(response);
		// 5xx only: 401/403/404 are normal control flow for the session seam, and
		// 501 is the designed steady state of /api/session before WORKOS_CLIENT_ID
		// is set, not an outage worth reporting.
		if (problem.status >= 500 && problem.status !== 501) {
			reportError(problem, { supportId: problem.requestId });
		}
		throw problem;
	}
	return response;
}

// Structural seam so classic zod and zod/mini schemas both fit (ADR 031).
interface WireSchema<T> {
	parse(data: unknown): T;
}

export async function apiGet<T>(
	path: string,
	schema: WireSchema<T>,
): Promise<T> {
	const response = await apiRequest(path, { method: "GET" });
	const json: unknown = await response.json();
	return schema.parse(json);
}

export async function apiPost<T>(
	path: string,
	body: unknown,
	schema: WireSchema<T>,
): Promise<T> {
	const response = await apiRequest(path, { method: "POST", body });
	const json: unknown = await response.json();
	return schema.parse(json);
}
