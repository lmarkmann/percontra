import { beforeEach, expect, test, vi } from "vitest";

const sentry = {
	init: vi.fn(),
	captureException: vi.fn(),
};

vi.mock("@sentry/react", () => sentry);

beforeEach(() => {
	vi.resetModules();
	sentry.init.mockClear();
	sentry.captureException.mockClear();
});

test("initErrorReporting no-ops when the DSN is unset", async () => {
	vi.doMock("@/env", () => ({
		env: { VITE_SENTRY_DSN: undefined },
	}));
	const { initErrorReporting, reportError } =
		await import("@/lib/error-reporting");

	await initErrorReporting();
	reportError(new Error("boom"), { supportId: "abcd1234" });

	expect(sentry.init).not.toHaveBeenCalled();
	expect(sentry.captureException).not.toHaveBeenCalled();
});

test("reportError before init does not throw", async () => {
	vi.doMock("@/env", () => ({
		env: { VITE_SENTRY_DSN: "https://key@o0.ingest.sentry.io/1" },
	}));
	const { reportError } = await import("@/lib/error-reporting");

	expect(() => reportError(new Error("boom"))).not.toThrow();
	expect(sentry.captureException).not.toHaveBeenCalled();
});

test("initErrorReporting wires captureException with the support id tag", async () => {
	vi.doMock("@/env", () => ({
		env: { VITE_SENTRY_DSN: "https://key@o0.ingest.sentry.io/1" },
	}));
	const { initErrorReporting, reportError } =
		await import("@/lib/error-reporting");

	await initErrorReporting();
	const failure = new Error("boom");
	reportError(failure, { supportId: "abcd1234" });

	expect(sentry.init).toHaveBeenCalledWith({
		dsn: "https://key@o0.ingest.sentry.io/1",
		environment: "test",
		sendDefaultPii: false,
	});
	expect(sentry.captureException).toHaveBeenCalledWith(failure, {
		tags: { support_id: "abcd1234" },
	});
});

test("reportError without a support id sends no tags", async () => {
	vi.doMock("@/env", () => ({
		env: { VITE_SENTRY_DSN: "https://key@o0.ingest.sentry.io/1" },
	}));
	const { initErrorReporting, reportError } =
		await import("@/lib/error-reporting");

	await initErrorReporting();
	const failure = new Error("boom");
	reportError(failure);

	expect(sentry.captureException).toHaveBeenCalledWith(failure, undefined);
});
