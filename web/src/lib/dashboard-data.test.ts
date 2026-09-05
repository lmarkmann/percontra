import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

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

import { fetchDashboardData } from "@/lib/dashboard-data";
import { MSW_REQUEST_ID } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";

beforeEach(() => {
	envState.VITE_API_BASE_URL = undefined;
});

afterEach(() => {
	envState.VITE_API_BASE_URL = undefined;
});

test("fetchDashboardData returns ready by default", async () => {
	const data = await fetchDashboardData(null);
	expect(data.status).toBe("ready");
	if (data.status === "ready") {
		expect(data.projects).toHaveLength(2);
		expect(data.metrics.openTasks).toBeGreaterThan(0);
		expect(data.activity).toHaveLength(3);
	}
});

test("fetchDashboardData returns empty when requested", async () => {
	const data = await fetchDashboardData("empty");
	expect(data.status).toBe("empty");
});

test("fetchDashboardData returns ready preview", async () => {
	const data = await fetchDashboardData("ready");
	expect(data.status).toBe("ready");
	if (data.status === "ready") {
		expect(Date.parse(data.projects[0]!.updatedAt)).not.toBeNaN();
	}
});

test("fetchDashboardData returns error preview", async () => {
	const data = await fetchDashboardData("error");
	expect(data.status).toBe("error");
	if (data.status === "error") {
		expect(data.supportId.length).toBeGreaterThan(0);
	}
});

test("fetchDashboardData returns partial preview", async () => {
	const data = await fetchDashboardData("partial");
	expect(data.status).toBe("partial");
	if (data.status === "partial") {
		expect(data.projects).toHaveLength(2);
	}
});

test("fetchDashboardData returns forbidden preview", async () => {
	const data = await fetchDashboardData("forbidden");
	expect(data.status).toBe("forbidden");
	if (data.status === "forbidden") {
		expect(data.resource.length).toBeGreaterThan(0);
	}
});

test("fetchDashboardData returns filtered preview", async () => {
	const data = await fetchDashboardData("filtered");
	expect(data.status).toBe("filtered");
	if (data.status === "filtered") {
		expect(data.filterLabel).toContain("status");
	}
});

test("fetchDashboardData returns conflict preview", async () => {
	const data = await fetchDashboardData("conflict");
	expect(data.status).toBe("conflict");
	if (data.status === "conflict") {
		expect(data.yours.length).toBeGreaterThan(0);
		expect(data.theirs.length).toBeGreaterThan(0);
	}
});

// Distinct from the demo fixture so the assertion proves the remote body won, not the fallback.
const readyPayload = {
	status: "ready" as const,
	projects: [
		{
			id: "r1",
			name: "Remote",
			status: "active" as const,
			updatedAt: "2026-07-11T12:00:00.000Z",
			owner: "API",
		},
	],
	metrics: {
		openTasks: 1,
		activeProjects: 1,
		lastSyncAt: "2026-07-11T12:00:00.000Z",
	},
	activity: [
		{
			id: "act1",
			summary: "Synced",
			actor: "API",
			occurredAt: "2026-07-11T11:59:00.000Z",
		},
	],
};

test("fetchDashboardData uses remote ready payload when base URL is set", async () => {
	envState.VITE_API_BASE_URL = "https://api.example.com";
	const requests: Request[] = [];
	server.use(
		http.get("*/api/dashboard", ({ request }) => {
			requests.push(request);
			return HttpResponse.json(readyPayload);
		}),
	);

	const data = await fetchDashboardData(null);
	expect(data).toEqual(readyPayload);
	expect(requests[0]?.url).toBe("https://api.example.com/api/dashboard");
	expect(requests[0]?.credentials).toBe("include");
});

test("fetchDashboardData surfaces an error card when the remote body fails the contract", async () => {
	envState.VITE_API_BASE_URL = "https://api.example.com";
	server.use(
		http.get("*/api/dashboard", () => HttpResponse.json({ status: "ready" })),
	);

	// Schema drift on a real remote response must not masquerade as fixture data.
	const data = await fetchDashboardData(null);
	expect(data.status).toBe("error");
	if (data.status === "error") {
		expect(data.supportId.length).toBeGreaterThan(0);
		expect(data.message).toBe("Workspace API returned an unexpected response.");
	}
});

test("fetchDashboardData falls back to demo on network failure", async () => {
	envState.VITE_API_BASE_URL = "https://api.example.com";
	server.use(http.get("*/api/dashboard", () => HttpResponse.error()));

	const data = await fetchDashboardData("empty");
	expect(data.status).toBe("empty");
});

test("fetchDashboardData returns error status on HTTP non-OK", async () => {
	// The shared view=error handler answers a 500 problem+json; no override needed.
	envState.VITE_API_BASE_URL = "https://api.example.com";

	const data = await fetchDashboardData("error");
	expect(data.status).toBe("error");
	if (data.status === "error") {
		expect(data.supportId).toBe(MSW_REQUEST_ID);
		expect(data.message).toBe("Workspace API returned an unexpected response.");
	}
});
