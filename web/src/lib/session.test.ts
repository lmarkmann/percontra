import { afterEach, expect, test, vi } from "vitest";

import { fetchSession } from "@/lib/session";

function answerWith(body: unknown, ok = true) {
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => ({ ok, json: async () => body }) as unknown as Response),
	);
}

afterEach(() => {
	vi.unstubAllGlobals();
});

test("an authenticated visitor is reported with their email", async () => {
	answerWith({ email: "reviewer@example.com", name: "A Reviewer" });
	await expect(fetchSession()).resolves.toEqual({
		email: "reviewer@example.com",
		name: "A Reviewer",
	});
});

test("a nameless identity keeps the email", async () => {
	answerWith({ email: "reviewer@example.com", name: null });
	await expect(fetchSession()).resolves.toEqual({
		email: "reviewer@example.com",
		name: null,
	});
});

test("running without the edge worker in front reports nobody", async () => {
	answerWith({ email: null, name: null });
	await expect(fetchSession()).resolves.toBeNull();
});

test("a non-json route answering the path reports nobody", async () => {
	answerWith("<!doctype html>", false);
	await expect(fetchSession()).resolves.toBeNull();
});

test("an unreachable edge reports nobody rather than throwing", async () => {
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => {
			throw new TypeError("Failed to fetch");
		}),
	);
	await expect(fetchSession()).resolves.toBeNull();
});
