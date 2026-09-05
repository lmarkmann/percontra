import { expect, test } from "vitest";

import { authReturnFromSearch, normalizeAuthReturn } from "@/lib/auth-return";

test("preserves an internal auth return path", () => {
	expect(normalizeAuthReturn("/dashboard?view=empty#activity")).toBe(
		"/dashboard?view=empty#activity",
	);
});

test("rejects an external auth return URL", () => {
	expect(normalizeAuthReturn("https://attacker.example")).toBe("/dashboard");
	expect(normalizeAuthReturn("//attacker.example")).toBe("/dashboard");
});

test("reads a safe return path from validated route search", () => {
	expect(authReturnFromSearch({ redirect: "/dashboard?view=empty" })).toBe(
		"/dashboard?view=empty",
	);
	expect(authReturnFromSearch({ redirect: "https://attacker.example" })).toBe(
		"/dashboard",
	);
});
