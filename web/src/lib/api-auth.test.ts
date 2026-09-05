import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
	vi.doUnmock("@/env");
	vi.resetModules();
});

test("waits for the first WorkOS token getter registration", async () => {
	vi.doMock("@/env", () => ({
		env: { VITE_WORKOS_CLIENT_ID: "client_test" },
	}));
	const { getRegisteredAccessToken, registerAccessTokenGetter } =
		await import("@/lib/api-auth");
	let settled = false;
	const token = getRegisteredAccessToken().then((value) => {
		settled = true;
		return value;
	});

	await Promise.resolve();
	expect(settled).toBe(false);

	registerAccessTokenGetter(async () => "token-123");
	await expect(token).resolves.toBe("token-123");
});

test("does not wait for a token getter when WorkOS is disabled", async () => {
	vi.doMock("@/env", () => ({
		env: { VITE_WORKOS_CLIENT_ID: undefined },
	}));
	const { getRegisteredAccessToken } = await import("@/lib/api-auth");

	await expect(getRegisteredAccessToken()).resolves.toBeNull();
});
