import { afterEach, expect, test, vi } from "vitest";

import { ApiProblem } from "@/lib/api-problem";
import { describeMigrationFailure } from "@/lib/migration-failure";

function problem(status: number, detail: string): ApiProblem {
	return new ApiProblem({
		type: "about:blank",
		title: "Bad Request",
		status,
		detail,
		request_id: "req-42x",
	});
}

afterEach(() => {
	vi.unstubAllGlobals();
});

function goOffline() {
	// Only onLine is read; spreading the Navigator instance would drop its
	// prototype and take every other member with it.
	vi.stubGlobal("navigator", { onLine: false });
}

test("offline is reported before anything else, and promises no write happened", () => {
	goOffline();
	const failure = describeMigrationFailure(problem(500, "boom"));
	expect(failure.title).toBe("You are offline");
	expect(failure.message).toContain("Nothing was changed");
	expect(failure.retryable).toBe(true);
});

test("a workbook rejection quotes the server's cause and adds the recovery step", () => {
	const failure = describeMigrationFailure(
		problem(400, "Sheet 'Mapping Gaps' is missing column 'GL_Account'"),
	);
	expect(failure.title).toBe("That workbook is not the shape we expect");
	expect(failure.message).toContain("Mapping Gaps");
	expect(failure.message).toContain("header row");
	// Retrying the same file cannot change the answer.
	expect(failure.retryable).toBe(false);
});

test("a 5xx keeps the server's words behind the support id", () => {
	const failure = describeMigrationFailure(
		problem(500, "IndexError at generate.py line 88"),
	);
	expect(failure.message).not.toContain("generate.py");
	expect(failure.supportId).toBe("req-42x");
	expect(failure.retryable).toBe(true);
});

test("a 501 is the designed steady state, not an outage to retry", () => {
	const failure = describeMigrationFailure(problem(501, "not implemented yet"));
	expect(failure.title).toBe("Not wired up yet");
	expect(failure.retryable).toBe(false);
});

test("a 404 explains supersession rather than blaming the reviewer", () => {
	const failure = describeMigrationFailure(problem(404, "no such batch"));
	expect(failure.message).toContain("superseded");
	expect(failure.retryable).toBe(true);
});

test("a fetch that never reached a server says so", () => {
	const failure = describeMigrationFailure(new TypeError("Failed to fetch"));
	expect(failure.title).toBe("The request never reached the server");
	expect(failure.message).toContain("8080");
});

test("every failure carries all three parts", () => {
	for (const error of [
		problem(400, "Sheet 'X' is missing"),
		problem(500, "boom"),
		problem(501, "stub"),
		new TypeError("Failed to fetch"),
		"a string nobody typed",
	]) {
		const failure = describeMigrationFailure(error);
		expect(failure.title.length).toBeGreaterThan(0);
		expect(failure.message.length).toBeGreaterThan(0);
		expect(failure.supportId.length).toBeGreaterThan(0);
	}
});
