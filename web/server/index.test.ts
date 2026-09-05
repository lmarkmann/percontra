import { expect, test, vi } from "vitest";
import { z } from "zod";

import app from "./index";

const demoEnv = { WORKOS_CLIENT_ID: "" };
const workosEnv = { WORKOS_CLIENT_ID: "client_test123" };

const spaShell = "<!doctype html><html><body>app shell</body></html>";

function assetsStub(): { fetched: Request[]; ASSETS: Env["ASSETS"] } {
	const fetched: Request[] = [];
	const stub: Pick<Env["ASSETS"], "fetch"> = {
		fetch: (input) => {
			fetched.push(new Request(input));
			return Promise.resolve(
				new Response(spaShell, { headers: { "Content-Type": "text/html" } }),
			);
		},
	};
	return { fetched, ASSETS: stub as Env["ASSETS"] };
}

const problemSchema = z.object({
	status: z.number(),
	title: z.string().optional(),
	detail: z.string().optional(),
	request_id: z.string().optional(),
});

async function problemOf(res: Response) {
	expect(res.headers.get("Content-Type")).toBe("application/problem+json");
	const raw: unknown = await res.json();
	return problemSchema.parse(raw);
}

test("GET /api/session answers 501 when auth is not configured", async () => {
	const res = await app.request("/api/session", {}, demoEnv);
	expect(res.status).toBe(501);
	expect(res.headers.get("Cache-Control")).toBe("no-store");
	const problem = await problemOf(res);
	expect(problem.title).toBe("Auth not configured");
});

test("GET /api/dashboard serves demo fixtures when auth is not configured", async () => {
	const res = await app.request("/api/dashboard", {}, demoEnv);
	expect(res.status).toBe(200);
	const raw: unknown = await res.json();
	expect(z.object({ status: z.string() }).parse(raw).status).toBe("ready");
});

test("GET /api/dashboard exposes the deliberate error preview as problem JSON", async () => {
	const res = await app.request("/api/dashboard?view=error", {}, demoEnv);
	expect(res.status).toBe(500);
	const problem = await problemOf(res);
	expect(problem.title).toBe("Internal Server Error");
	expect(problem.detail).toBe("Workspace API returned an unexpected response.");
});

test("GET /api/session without a bearer is 401 when WorkOS is configured", async () => {
	const res = await app.request("/api/session", {}, workosEnv);
	expect(res.status).toBe(401);
	const problem = await problemOf(res);
	expect(problem.title).toBe("Unauthorized");
});

test("GET /api/dashboard with a malformed bearer is 401 when WorkOS is configured", async () => {
	// "garbage" is not compact JWS, so jose rejects it before any JWKS fetch.
	const res = await app.request(
		"/api/dashboard",
		{ headers: { Authorization: "Bearer garbage" } },
		workosEnv,
	);
	expect(res.status).toBe(401);
	const problem = await problemOf(res);
	expect(problem.title).toBe("Unauthorized");
});

// happy-dom strips Origin and Referer inside the Request constructor (browsers
// forbid setting them); workerd does not. Set them after construction to reach
// the Worker.
function postDashboard(headers: Record<string, string>): Request {
	const request = new Request("http://localhost/api/dashboard", {
		method: "POST",
	});
	for (const [name, value] of Object.entries(headers)) {
		request.headers.set(name, value);
	}
	return request;
}

test("mutations from a foreign origin are rejected with 403", async () => {
	const res = await app.request(
		postDashboard({ Origin: "https://evil.example" }),
		undefined,
		demoEnv,
	);
	expect(res.status).toBe(403);
	const problem = await problemOf(res);
	expect(problem.title).toBe("Forbidden");
});

test("mutations with neither Origin nor Referer are rejected with 403", async () => {
	const res = await app.request(postDashboard({}), undefined, demoEnv);
	expect(res.status).toBe(403);
	const problem = await problemOf(res);
	expect(problem.title).toBe("Forbidden");
});

test("mutations with a same-origin Referer pass the origin backstop", async () => {
	// No POST route exists, so passing the check falls through to 404, not 403.
	const res = await app.request(
		postDashboard({ Referer: "http://localhost/dashboard" }),
		undefined,
		demoEnv,
	);
	expect(res.status).toBe(404);
});

test("mutations with a foreign Referer are rejected with 403", async () => {
	const res = await app.request(
		postDashboard({ Referer: "https://evil.example/dashboard" }),
		undefined,
		demoEnv,
	);
	expect(res.status).toBe(403);
});

test("same-origin mutations pass the origin check", async () => {
	const res = await app.request(
		postDashboard({ Origin: "http://localhost" }),
		undefined,
		demoEnv,
	);
	expect(res.status).toBe(404);
});

test("unknown non-API paths proxy to the SPA shell via the assets binding", async () => {
	const { fetched, ASSETS } = assetsStub();
	const res = await app.request("/dashboard", {}, { ...demoEnv, ASSETS });
	expect(res.status).toBe(200);
	expect(res.headers.get("Content-Type")).toBe("text/html");
	expect(await res.text()).toBe(spaShell);
	expect(fetched).toHaveLength(1);
	expect(new URL(fetched[0]?.url ?? "").pathname).toBe("/dashboard");
});

test("unknown API paths still answer 404 problem+json", async () => {
	const { fetched, ASSETS } = assetsStub();
	const res = await app.request("/api/nope", {}, { ...demoEnv, ASSETS });
	expect(res.status).toBe(404);
	const problem = await problemOf(res);
	expect(problem.title).toBe("Not Found");
	expect(fetched).toHaveLength(0);
});

test("API responses carry secure headers", async () => {
	const res = await app.request("/api/dashboard", {}, demoEnv);
	expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
});

test("error responses carry nosniff and the request id even outside secureHeaders", async () => {
	const res = await app.request("/api/nope", {}, demoEnv);
	expect(res.status).toBe(404);
	expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
	expect(res.headers.get("X-Request-Id")).toBeTruthy();
});

test("unexpected errors return a sanitized problem envelope", async () => {
	vi.spyOn(console, "error").mockImplementation(() => {});
	const ASSETS = {
		fetch: () => Promise.reject(new Error("private upstream failure")),
	} as unknown as Env["ASSETS"];

	const res = await app.request("/dashboard", {}, { ...demoEnv, ASSETS });
	expect(res.status).toBe(500);
	const problem = await problemOf(res);
	expect(problem.detail).toBe(
		"Unexpected server error. Quote the request id when reporting.",
	);
	expect(JSON.stringify(problem)).not.toContain("private upstream failure");
});
