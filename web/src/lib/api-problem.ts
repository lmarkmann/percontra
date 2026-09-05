import type { ApiProblemBody } from "@/contract/problem";

import { createSupportId } from "@/lib/support-id";

export class ApiProblem extends Error {
	readonly type: string;
	readonly title: string;
	readonly status: number;
	readonly detail: string;
	readonly requestId: string;

	constructor(body: ApiProblemBody) {
		const title = body.title ?? defaultTitle(body.status);
		const detail = body.detail ?? title;
		super(detail);
		this.name = "ApiProblem";
		this.type = body.type ?? "about:blank";
		this.title = title;
		this.status = body.status;
		this.detail = detail;
		this.requestId = body.request_id ?? createSupportId();
	}
}

function defaultTitle(status: number): string {
	if (status === 401) return "Unauthorized";
	if (status === 403) return "Forbidden";
	if (status === 404) return "Not Found";
	if (status >= 500) return "Internal Server Error";
	return `HTTP ${status}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

/**
 * Build an ApiProblem from a failed Response.
 * Prefers problem+json body; falls back to status text + generated request id.
 */
export async function parseApiProblem(response: Response): Promise<ApiProblem> {
	const status = response.status;
	let body: unknown;
	try {
		const contentType = response.headers.get("content-type") ?? "";
		if (
			contentType.includes("application/problem+json") ||
			contentType.includes("application/json")
		) {
			body = await response.json();
		}
	} catch {
		body = undefined;
	}

	if (isRecord(body)) {
		const statusField = typeof body.status === "number" ? body.status : status;
		return new ApiProblem({
			type: typeof body.type === "string" ? body.type : undefined,
			title: typeof body.title === "string" ? body.title : undefined,
			status: statusField,
			detail: typeof body.detail === "string" ? body.detail : undefined,
			request_id:
				typeof body.request_id === "string"
					? body.request_id
					: typeof body.requestId === "string"
						? body.requestId
						: undefined,
		});
	}

	return new ApiProblem({
		status,
		title: response.statusText || defaultTitle(status),
		detail: response.statusText || defaultTitle(status),
	});
}
