import { expect, test } from "vitest";

import { ApiProblem, parseApiProblem } from "@/lib/api-problem";

test("ApiProblem fills defaults for missing title and request id", () => {
	const problem = new ApiProblem({ status: 500 });
	expect(problem.title).toBe("Internal Server Error");
	expect(problem.detail).toBe("Internal Server Error");
	expect(problem.type).toBe("about:blank");
	expect(problem.requestId.length).toBeGreaterThan(0);
	expect(problem.message).toBe(problem.detail);
});

test("parseApiProblem reads application/problem+json body", async () => {
	const response = new Response(
		JSON.stringify({
			type: "https://example.com/problems/out-of-credit",
			title: "Out of credit",
			status: 403,
			detail: "Account balance is zero.",
			request_id: "req-abc",
		}),
		{
			status: 403,
			headers: { "Content-Type": "application/problem+json" },
		},
	);
	const problem = await parseApiProblem(response);
	expect(problem).toBeInstanceOf(ApiProblem);
	expect(problem.status).toBe(403);
	expect(problem.title).toBe("Out of credit");
	expect(problem.detail).toBe("Account balance is zero.");
	expect(problem.requestId).toBe("req-abc");
	expect(problem.type).toContain("out-of-credit");
});

test("parseApiProblem accepts requestId camelCase from JSON APIs", async () => {
	const response = new Response(
		JSON.stringify({
			title: "Nope",
			status: 401,
			requestId: "camel-id",
		}),
		{
			status: 401,
			headers: { "Content-Type": "application/json" },
		},
	);
	const problem = await parseApiProblem(response);
	expect(problem.requestId).toBe("camel-id");
});

test("parseApiProblem falls back when body is not JSON", async () => {
	const response = new Response("plain error", {
		status: 502,
		statusText: "Bad Gateway",
	});
	const problem = await parseApiProblem(response);
	expect(problem.status).toBe(502);
	expect(problem.title).toMatch(/Bad Gateway|Internal|HTTP 502/);
	expect(problem.requestId.length).toBeGreaterThan(0);
});
