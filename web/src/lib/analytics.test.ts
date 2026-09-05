import { beforeEach, expect, test, vi } from "vitest";

const posthog = {
	init: vi.fn(),
	capture: vi.fn(),
	identify: vi.fn(),
	reset: vi.fn(),
};

vi.mock("posthog-js", () => ({
	default: posthog,
}));

beforeEach(() => {
	vi.resetModules();
	posthog.init.mockClear();
	posthog.capture.mockClear();
	posthog.identify.mockClear();
	posthog.reset.mockClear();
});

test("initAnalytics no-ops when PostHog key is unset", async () => {
	vi.doMock("@/env", () => ({
		env: { VITE_POSTHOG_KEY: undefined, VITE_POSTHOG_HOST: undefined },
	}));
	const { initAnalytics, capture } = await import("@/lib/analytics");

	await initAnalytics();
	capture("page_view");

	expect(posthog.init).not.toHaveBeenCalled();
	expect(posthog.capture).not.toHaveBeenCalled();
});

test("initAnalytics wires capture, identify, and reset when key is set", async () => {
	vi.doMock("@/env", () => ({
		env: {
			VITE_POSTHOG_KEY: "phk_test",
			VITE_POSTHOG_HOST: "https://eu.i.posthog.com",
		},
	}));
	const { initAnalytics, capture, identify, reset } =
		await import("@/lib/analytics");

	await initAnalytics();
	capture("button_clicked", { label: "save" });
	identify("user-1", { plan: "pro" });
	reset();

	expect(posthog.init).toHaveBeenCalledWith("phk_test", {
		api_host: "https://eu.i.posthog.com",
		persistence: "memory",
		person_profiles: "identified_only",
		capture_pageview: true,
		disable_session_recording: true,
	});
	expect(posthog.capture).toHaveBeenCalledWith("button_clicked", {
		label: "save",
	});
	expect(posthog.identify).toHaveBeenCalledWith("user-1", { plan: "pro" });
	expect(posthog.reset).toHaveBeenCalled();
});
