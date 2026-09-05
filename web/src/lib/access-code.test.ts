import { afterEach, beforeEach, expect, test, vi } from "vitest";

// sha256("open sesame")
const CODE = "open sesame";
const CODE_HASH =
	"41ef47f6c48c40e3f4b1932c2b1fed52fb4b83d90a2d5b7e08b1d76b45ecc1a2";

const envState = vi.hoisted(() => ({
	VITE_ACCESS_CODE_SHA256: undefined as string | undefined,
}));

vi.mock("@/env", () => ({
	env: {
		get VITE_ACCESS_CODE_SHA256() {
			return envState.VITE_ACCESS_CODE_SHA256;
		},
	},
}));

import { isGateEnabled, isUnlocked, submitAccessCode } from "@/lib/access-code";

async function realHash(value: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(value),
	);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

beforeEach(() => {
	sessionStorage.clear();
});

afterEach(() => {
	envState.VITE_ACCESS_CODE_SHA256 = undefined;
});

test("no configured hash means no gate, so local development is not blocked", () => {
	expect(isGateEnabled()).toBe(false);
	expect(isUnlocked()).toBe(true);
});

test("a configured hash locks the app until the code is entered", async () => {
	envState.VITE_ACCESS_CODE_SHA256 = await realHash(CODE);
	expect(isGateEnabled()).toBe(true);
	expect(isUnlocked()).toBe(false);
});

test("the right code unlocks and survives a reload in the same tab", async () => {
	envState.VITE_ACCESS_CODE_SHA256 = await realHash(CODE);
	expect(await submitAccessCode(CODE)).toBe(true);
	expect(isUnlocked()).toBe(true);
});

test("surrounding whitespace is forgiven; a wrong code is not", async () => {
	envState.VITE_ACCESS_CODE_SHA256 = await realHash(CODE);
	expect(await submitAccessCode(`  ${CODE}  `)).toBe(true);

	sessionStorage.clear();
	expect(await submitAccessCode("not the code")).toBe(false);
	expect(isUnlocked()).toBe(false);
});

test("the code itself is never written to storage, only the hash it matches", async () => {
	envState.VITE_ACCESS_CODE_SHA256 = await realHash(CODE);
	await submitAccessCode(CODE);
	expect(JSON.stringify(sessionStorage)).not.toContain(CODE);
});

test("the configured hash is compared case-insensitively", async () => {
	envState.VITE_ACCESS_CODE_SHA256 = (await realHash(CODE)).toUpperCase();
	expect(await submitAccessCode(CODE)).toBe(true);
});

test("a placeholder hash nobody holds the preimage of stays locked", async () => {
	envState.VITE_ACCESS_CODE_SHA256 = CODE_HASH;
	expect(await submitAccessCode(CODE)).toBe(false);
});
