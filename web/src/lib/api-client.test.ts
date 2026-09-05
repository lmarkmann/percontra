import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { z } from "zod";

const envState = vi.hoisted(() => ({
	VITE_API_BASE_URL: undefined as string | undefined,
}));

vi.mock("@/env", () => ({
	env: {
		get VITE_API_BASE_URL() {
			return envState.VITE_API_BASE_URL;
		},
	},
}));

vi.mock("@/lib/error-reporting", () => ({
	reportError: vi.fn(),
}));

import { problemResponse } from "@/contract/problem";
import { apiGet, apiPost, apiRequest } from "@/lib/api-client";
import { ApiProblem } from "@/lib/api-problem";
import { reportError } from "@/lib/error-reporting";
import { server } from "@/test/mocks/server";

beforeEach(() => {
	envState.VITE_API_BASE_URL = "https://api.example.com";
});

afterEach(() => {
	envState.VITE_API_BASE_URL = undefined;
});

/** Route GET {path} to a 200 JSON body and hand back the requests MSW saw. */
function captureGet(path: string, body: Record<string, unknown>): Request[] {
	const requests: Request[] = [];
	server.use(
		http.get(`*${path}`, ({ request }) => {
			requests.push(request);
			return HttpResponse.json(body);
		}),
	);
	return requests;
}

test("apiRequest falls back to same-origin when VITE_API_BASE_URL is unset", async () => {
	envState.VITE_API_BASE_URL = undefined;
	const requests = captureGet("/api/health", { ok: true });
	await apiRequest("/api/health");
	expect(new URL(requests[0]?.url ?? "").pathname).toBe("/api/health");
});

test("apiGet joins base URL, includes credentials, and parses schema", async () => {
	const requests = captureGet("/api/projects/1", { id: "p1", name: "Alpha" });

	const schema = z.object({ id: z.string(), name: z.string() });
	const data = await apiGet("/api/projects/1", schema);

	expect(data).toEqual({ id: "p1", name: "Alpha" });
	expect(requests[0]?.url).toBe("https://api.example.com/api/projects/1");
	expect(requests[0]?.method).toBe("GET");
	expect(requests[0]?.credentials).toBe("include");
});

test("apiGet strips trailing slash from base URL", async () => {
	envState.VITE_API_BASE_URL = "https://api.example.com/";
	const requests = captureGet("/api/ok", { ok: true });
	await apiGet("/api/ok", z.object({ ok: z.boolean() }));
	expect(requests[0]?.url).toBe("https://api.example.com/api/ok");
});

test("apiRequest throws ApiProblem on non-OK response", async () => {
	server.use(
		http.get("*/api/missing", () =>
			problemResponse({
				status: 404,
				title: "Not found",
				detail: "Missing",
				requestId: "rid-1",
			}),
		),
	);

	await expect(apiRequest("/api/missing")).rejects.toSatisfy(
		(error: unknown) =>
			error instanceof ApiProblem &&
			error.status === 404 &&
			error.requestId === "rid-1",
	);
	expect(reportError).not.toHaveBeenCalled();
});

test("apiRequest reports 5xx problems with the request id", async () => {
	server.use(
		http.get("*/api/boom", () =>
			problemResponse({
				status: 500,
				title: "Internal Server Error",
				requestId: "rid-500",
			}),
		),
	);

	await expect(apiRequest("/api/boom")).rejects.toBeInstanceOf(ApiProblem);
	expect(reportError).toHaveBeenCalledWith(expect.any(ApiProblem), {
		supportId: "rid-500",
	});
});

test("apiRequest does not report 501, the designed unconfigured steady state", async () => {
	server.use(
		http.get("*/api/unconfigured", () =>
			problemResponse({
				status: 501,
				title: "Auth not configured",
				requestId: "rid-501",
			}),
		),
	);

	await expect(apiRequest("/api/unconfigured")).rejects.toSatisfy(
		(error: unknown) => error instanceof ApiProblem && error.status === 501,
	);
	expect(reportError).not.toHaveBeenCalled();
});

test("apiPost sends JSON body", async () => {
	const requests: Request[] = [];
	const bodies: unknown[] = [];
	server.use(
		http.post("*/api/items", async ({ request }) => {
			requests.push(request);
			bodies.push(await request.json());
			return HttpResponse.json({ accepted: true });
		}),
	);

	const result = await apiPost(
		"/api/items",
		{ name: "x" },
		z.object({ accepted: z.boolean() }),
	);
	expect(result.accepted).toBe(true);
	expect(requests[0]?.url).toBe("https://api.example.com/api/items");
	expect(requests[0]?.method).toBe("POST");
	expect(requests[0]?.credentials).toBe("include");
	expect(bodies[0]).toEqual({ name: "x" });
});
