import { expect, test } from "@playwright/test";

// Preview runs the real Worker in workerd, so these pin the wire contract:
// problem+json envelopes, the origin backstop, and the SPA fallback for
// non-navigation requests (the request fixture sends no Sec-Fetch-Mode).
test.describe("api surface", () => {
	test("GET /api/session answers 501 problem+json out of the box", async ({
		request,
	}) => {
		const res = await request.get("/api/session");
		expect(res.status()).toBe(501);
		expect(res.headers()["content-type"]).toBe("application/problem+json");
		expect(res.headers()["cache-control"]).toBe("no-store");
		expect(await res.json()).toMatchObject({
			status: 501,
			title: "Auth not configured",
		});
	});

	test("static routes expose their cache and robots policies", async ({
		request,
	}) => {
		const login = await request.get("/login");
		expect(login.headers()["x-robots-tag"]).toBe("noindex,nofollow");

		const home = await request.get("/");
		const html = await home.text();
		const assetPath = html.match(/(?:src|href)="(\/assets\/[^"]+)"/)?.[1];
		expect(assetPath).toBeTruthy();
		const asset = await request.get(assetPath!);
		expect(asset.headers()["cache-control"]).toBe(
			"public, max-age=31536000, immutable",
		);
	});

	test("GET /api/dashboard returns the ready contract payload", async ({
		request,
	}) => {
		const res = await request.get("/api/dashboard");
		expect(res.status()).toBe(200);
		const body = (await res.json()) as {
			status: string;
			projects: unknown[];
			activity: unknown[];
			metrics: Record<string, unknown>;
		};
		expect(body.status).toBe("ready");
		expect(body.projects.length).toBeGreaterThan(0);
		expect(body.activity.length).toBeGreaterThan(0);
		expect(body.metrics).toMatchObject({ openTasks: expect.any(Number) });
	});

	test("cross-origin mutations are rejected with 403", async ({ request }) => {
		const res = await request.post("/api/anything", {
			headers: { Origin: "https://evil.example" },
		});
		expect(res.status()).toBe(403);
		expect(res.headers()["content-type"]).toBe("application/problem+json");
	});

	test("deep links serve the SPA shell to non-navigation requests", async ({
		request,
	}) => {
		const res = await request.get("/some-deep-link");
		expect(res.status()).toBe(200);
		expect(res.headers()["content-type"]).toContain("text/html");
	});
});
