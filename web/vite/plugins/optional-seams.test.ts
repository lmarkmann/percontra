import { afterEach, describe, expect, it, vi } from "vitest";

import { optionalSeamsPlugin } from "./optional-seams";

type SeamPlugin = {
	configResolved: (config: { mode: string; envDir: string }) => void;
	resolveId: (source: string) => string | null;
	load: (id: string) => string | null;
};

// posthog-js and @sentry/react are optional and unshipped by default, so isInstalled() is false and the plugin virtualizes them.
const plugin = optionalSeamsPlugin() as unknown as SeamPlugin;

// No .env files live next to the plugin sources; loadEnv then only sees process.env, which vi.stubEnv controls.
const emptyEnvDir = import.meta.dirname;

function configuredPlugin() {
	const fresh = optionalSeamsPlugin() as unknown as SeamPlugin;
	fresh.configResolved({ mode: "production", envDir: emptyEnvDir });
	return fresh;
}

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("optionalSeamsPlugin", () => {
	it("virtualizes an uninstalled optional SDK import", () => {
		expect(plugin.resolveId("posthog-js")).toBe("\0optional-seam:posthog-js");
		expect(plugin.resolveId("@sentry/react")).toBe(
			"\0optional-seam:@sentry/react",
		);
	});

	it("ignores imports it does not manage", () => {
		expect(plugin.resolveId("react")).toBeNull();
	});

	it("loads a stub module for a virtualized seam", () => {
		expect(plugin.load("\0optional-seam:posthog-js")).toContain("capture()");
		expect(plugin.load("\0optional-seam:@sentry/react")).toContain(
			"captureException",
		);
	});

	it("does not load ids it did not virtualize", () => {
		expect(plugin.load("\0real-module")).toBeNull();
	});

	it("still stubs when the seam env var is unset", () => {
		const fresh = configuredPlugin();
		expect(fresh.resolveId("posthog-js")).toBe("\0optional-seam:posthog-js");
		expect(fresh.resolveId("@sentry/react")).toBe(
			"\0optional-seam:@sentry/react",
		);
	});

	it("fails loud when VITE_POSTHOG_KEY is set without posthog-js", () => {
		vi.stubEnv("VITE_POSTHOG_KEY", "phc_test");
		const fresh = configuredPlugin();
		expect(() => fresh.resolveId("posthog-js")).toThrow(/pnpm add posthog-js/);
	});

	it("fails loud when VITE_SENTRY_DSN is set without @sentry/react", () => {
		vi.stubEnv("VITE_SENTRY_DSN", "https://key@o0.ingest.sentry.io/1");
		const fresh = configuredPlugin();
		expect(() => fresh.resolveId("@sentry/react")).toThrow(
			/pnpm add @sentry\/react/,
		);
	});
});
