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

import { problemResponse } from "@/contract/problem";
import { clearDemoSession, setDemoSession } from "@/lib/session";
import { fetchRemoteSession, resolveSession } from "@/lib/session-api";
import { server } from "@/test/mocks/server";

beforeEach(() => {
	envState.VITE_API_BASE_URL = undefined;
	clearDemoSession();
});

afterEach(() => {
	envState.VITE_API_BASE_URL = undefined;
	clearDemoSession();
});

function useSessionHandler(resolver: () => Response, requests?: Request[]) {
	server.use(
		http.get("*/api/session", ({ request }) => {
			requests?.push(request);
			return resolver();
		}),
	);
}

test("resolveSession reads demo localStorage when base URL is unset", async () => {
	setDemoSession({ userId: "demo-1", email: "demo@example.com" });
	await expect(resolveSession()).resolves.toEqual({
		userId: "demo-1",
		email: "demo@example.com",
	});
});

test("resolveSession returns null when demo storage is empty", async () => {
	await expect(resolveSession()).resolves.toBeNull();
});

test("fetchRemoteSession returns session on 200", async () => {
	envState.VITE_API_BASE_URL = "https://api.example.com";
	const requests: Request[] = [];
	useSessionHandler(
		() => HttpResponse.json({ userId: "u-live", email: "live@example.com" }),
		requests,
	);

	await expect(fetchRemoteSession()).resolves.toEqual({
		userId: "u-live",
		email: "live@example.com",
	});
	expect(requests[0]?.url).toBe("https://api.example.com/api/session");
	expect(requests[0]?.credentials).toBe("include");
});

test("fetchRemoteSession falls back to the demo session on 501", async () => {
	envState.VITE_API_BASE_URL = "https://api.example.com";
	setDemoSession({ userId: "demo-1", email: "demo@example.com" });
	useSessionHandler(() =>
		problemResponse({ status: 501, title: "Auth not configured" }),
	);

	await expect(fetchRemoteSession()).resolves.toEqual({
		userId: "demo-1",
		email: "demo@example.com",
	});
});

test("fetchRemoteSession 501 fallback is null without a demo session", async () => {
	envState.VITE_API_BASE_URL = "https://api.example.com";
	useSessionHandler(() =>
		problemResponse({ status: 501, title: "Auth not configured" }),
	);

	await expect(fetchRemoteSession()).resolves.toBeNull();
});

test("fetchRemoteSession returns null on the default 401", async () => {
	// No override: the shared handler tree answers 401 problem+json by default.
	envState.VITE_API_BASE_URL = "https://api.example.com";
	await expect(fetchRemoteSession()).resolves.toBeNull();
});

test("fetchRemoteSession returns null on 403", async () => {
	envState.VITE_API_BASE_URL = "https://api.example.com";
	useSessionHandler(() => problemResponse({ status: 403, title: "Forbidden" }));
	await expect(fetchRemoteSession()).resolves.toBeNull();
});

test("fetchRemoteSession returns null on 404", async () => {
	envState.VITE_API_BASE_URL = "https://api.example.com";
	useSessionHandler(() => problemResponse({ status: 404, title: "Not Found" }));
	await expect(fetchRemoteSession()).resolves.toBeNull();
});

test("fetchRemoteSession rethrows network errors", async () => {
	envState.VITE_API_BASE_URL = "https://api.example.com";
	useSessionHandler(() => HttpResponse.error());
	await expect(fetchRemoteSession()).rejects.toThrow(/.+/);
});

test("fetchRemoteSession rethrows schema mismatches", async () => {
	envState.VITE_API_BASE_URL = "https://api.example.com";
	useSessionHandler(() => HttpResponse.json({ user: "wrong-shape" }));
	await expect(fetchRemoteSession()).rejects.toThrow(/.+/);
});

test("fetchRemoteSession rethrows a 503 instead of logging the user out", async () => {
	envState.VITE_API_BASE_URL = "https://api.example.com";
	useSessionHandler(() =>
		problemResponse({ status: 503, title: "Authentication unavailable" }),
	);

	await expect(fetchRemoteSession()).rejects.toMatchObject({ status: 503 });
});

test("resolveSession uses remote when base URL is set", async () => {
	envState.VITE_API_BASE_URL = "https://api.example.com";
	setDemoSession({ userId: "ignored-demo" });
	useSessionHandler(() => HttpResponse.json({ userId: "remote" }));

	await expect(resolveSession()).resolves.toEqual({ userId: "remote" });
});
