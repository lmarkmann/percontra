import { afterEach, expect, test, vi } from "vitest";

import { registerServiceWorker } from "@/lib/register-service-worker";

// Capture instead of call-through so load listeners never leak between tests.
function interceptLoad() {
	let handler: EventListener | null = null;
	vi.spyOn(window, "addEventListener").mockImplementation(
		(type: string, listener: EventListenerOrEventListenerObject) => {
			if (type === "load") {
				handler = listener as EventListener;
			}
		},
	);
	return {
		added: () => handler !== null,
		fire: () => handler?.(new Event("load")),
	};
}

function stubServiceWorkerContainer(register: () => Promise<unknown>) {
	Object.defineProperty(navigator, "serviceWorker", {
		configurable: true,
		value: { register },
	});
}

afterEach(() => {
	vi.unstubAllEnvs();
	delete (navigator as { serviceWorker?: unknown }).serviceWorker;
});

test("does not register outside production", () => {
	vi.stubEnv("PROD", false);
	const register = vi.fn(() => Promise.resolve());
	stubServiceWorkerContainer(register);
	const load = interceptLoad();

	registerServiceWorker();

	expect(load.added()).toBe(false);
	expect(register).not.toHaveBeenCalled();
});

test("does nothing when the browser lacks serviceWorker", () => {
	vi.stubEnv("PROD", true);
	const load = interceptLoad();

	registerServiceWorker();

	expect(load.added()).toBe(false);
});

test("registers /sw.js on window load in production", async () => {
	vi.stubEnv("PROD", true);
	const register = vi.fn(() => Promise.resolve());
	stubServiceWorkerContainer(register);
	const load = interceptLoad();

	registerServiceWorker();
	expect(register).not.toHaveBeenCalled();

	load.fire();
	await Promise.resolve();

	expect(register).toHaveBeenCalledTimes(1);
	expect(register).toHaveBeenCalledWith("/sw.js");
});

test("swallows a registration rejection", async () => {
	vi.stubEnv("PROD", true);
	const register = vi.fn(() => Promise.reject(new Error("insecure origin")));
	stubServiceWorkerContainer(register);
	const load = interceptLoad();

	registerServiceWorker();
	load.fire();
	// An unswallowed rejection would fail the test as unhandled.
	await new Promise((resolve) => {
		setTimeout(resolve, 0);
	});

	expect(register).toHaveBeenCalledTimes(1);
});
