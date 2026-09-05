import { expect, test, vi } from "vitest";
import { z } from "zod";

// Mock jose so the positive path runs without a JWKS fetch; the negative paths
// (malformed token, missing bearer) are covered against real jose in
// index.test.ts. `errors` stays the real module so instanceof checks hold.
vi.mock("jose", async (importOriginal) => {
	const actual = await importOriginal<typeof import("jose")>();
	return {
		...actual,
		createRemoteJWKSet: vi.fn(() => "jwks-stub"),
		jwtVerify: vi.fn((token: string) => {
			switch (token) {
				case "valid-token":
					return Promise.resolve({ payload: { sub: "user_wos_123" } });
				case "subless-token":
					return Promise.resolve({ payload: {} });
				case "jwks-fetch-down":
					return Promise.reject(new TypeError("fetch failed"));
				case "jwks-timeout":
					return Promise.reject(new actual.errors.JWKSTimeout());
				case "jwks-error":
					return Promise.reject(
						new actual.errors.JOSEError("JWKS unavailable"),
					);
				case "invalid-jwt":
					return Promise.reject(new actual.errors.JWTInvalid("invalid JWT"));
				default:
					return Promise.reject(new Error("signature verification failed"));
			}
		}),
	};
});

import { jwtVerify } from "jose";

import app from "./index";

const workosEnv = { WORKOS_CLIENT_ID: "client_test123" };

function silenceConsoleError() {
	return vi.spyOn(console, "error").mockImplementation(() => {});
}

test("GET /api/session returns the verified session", async () => {
	const res = await app.request(
		"/api/session",
		{ headers: { Authorization: "Bearer valid-token" } },
		workosEnv,
	);
	expect(res.status).toBe(200);
	const raw: unknown = await res.json();
	expect(z.object({ userId: z.string() }).parse(raw)).toEqual({
		userId: "user_wos_123",
	});
	expect(vi.mocked(jwtVerify)).toHaveBeenCalledWith(
		"valid-token",
		"jwks-stub",
		expect.objectContaining({
			issuer: "https://api.workos.com",
			algorithms: ["RS256"],
			clockTolerance: "5s",
		}),
	);
});

test("GET /api/dashboard serves data behind a verified session", async () => {
	const res = await app.request(
		"/api/dashboard",
		{ headers: { Authorization: "Bearer valid-token" } },
		workosEnv,
	);
	expect(res.status).toBe(200);
});

test("a rejected token still yields a generic 401", async () => {
	const errorSpy = silenceConsoleError();
	const res = await app.request(
		"/api/session",
		{ headers: { Authorization: "Bearer forged-token" } },
		workosEnv,
	);
	expect(res.status).toBe(401);
	// The log carries the error taxonomy, never the token itself.
	const logged = errorSpy.mock.calls.flat().join(" ");
	expect(logged).toContain("signature verification failed");
	expect(logged).not.toContain("forged-token");
});

test("a verified token without a sub claim is a generic 401", async () => {
	const errorSpy = silenceConsoleError();
	const res = await app.request(
		"/api/session",
		{ headers: { Authorization: "Bearer subless-token" } },
		workosEnv,
	);
	expect(res.status).toBe(401);
	expect(res.headers.get("Content-Type")).toBe("application/problem+json");
	expect(errorSpy.mock.calls.flat().join(" ")).not.toContain("subless-token");
});

test("a JWKS network failure answers 503, not 401", async () => {
	silenceConsoleError();
	const res = await app.request(
		"/api/session",
		{ headers: { Authorization: "Bearer jwks-fetch-down" } },
		workosEnv,
	);
	expect(res.status).toBe(503);
	expect(res.headers.get("Content-Type")).toBe("application/problem+json");
	const raw: unknown = await res.json();
	expect(z.object({ title: z.string() }).parse(raw).title).toBe(
		"Service Unavailable",
	);
});

test("a JWKS timeout answers 503, not 401", async () => {
	silenceConsoleError();
	const res = await app.request(
		"/api/session",
		{ headers: { Authorization: "Bearer jwks-timeout" } },
		workosEnv,
	);
	expect(res.status).toBe(503);
});

test("a bare JOSEError from JWKS resolution answers 503", async () => {
	silenceConsoleError();
	const res = await app.request(
		"/api/session",
		{ headers: { Authorization: "Bearer jwks-error" } },
		workosEnv,
	);
	expect(res.status).toBe(503);
});

test("a JOSEError subclass for invalid credentials stays 401", async () => {
	silenceConsoleError();
	const res = await app.request(
		"/api/session",
		{ headers: { Authorization: "Bearer invalid-jwt" } },
		workosEnv,
	);
	expect(res.status).toBe(401);
});
