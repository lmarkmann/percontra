import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { server } from "./mocks/server";

// autoCodeSplitting turns every route into a dynamic import whose transform can outlast RTL's 1s default waitFor deadline under parallel load.
configure({ asyncUtilTimeout: 4000 });

// MSW owns the network in unit tests: anything unmocked fails loudly instead of hitting the wire.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Unit tests do not mount a real TanStack router. Mock the navigation surface so Link/useNavigate render without RouterProvider; router.test.tsx builds a full memory router and does not rely on these stubs for assertions.
vi.mock("@tanstack/react-router", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("@tanstack/react-router")>();

	function MockLink({
		to,
		children,
		className,
		...rest
	}: {
		to: string | { pathname?: string };
		children?: ReactNode;
		className?: string;
	}) {
		const href = typeof to === "string" ? to : (to.pathname ?? "#");
		return createElement("a", { href, className, ...rest }, children);
	}

	return {
		...actual,
		Link: MockLink,
		useNavigate: () => vi.fn(),
		useRouterState: (opts?: {
			select?: (state: {
				isLoading: boolean;
				isTransitioning: boolean;
				location: { pathname: string };
			}) => unknown;
		}) => {
			const state = {
				isLoading: false,
				isTransitioning: false,
				location: { pathname: "/" },
			};
			return opts?.select ? opts.select(state) : state;
		},
	};
});

// `globals` is off, so RTL cannot auto-register its cleanup; unmount between tests ourselves or rendered trees leak into the next test's queries.
afterEach(cleanup);

// Node 22+ happy-dom may leave `localStorage` undefined unless --localstorage-file is set. ThemeProvider and session read it on mount.
const testLocalStorage = globalThis.localStorage;
if (!testLocalStorage) {
	const store = new Map<string, string>();
	const memoryStorage: Storage = {
		get length() {
			return store.size;
		},
		clear() {
			store.clear();
		},
		getItem(key: string) {
			return store.has(key) ? (store.get(key) ?? null) : null;
		},
		key(index: number) {
			return [...store.keys()][index] ?? null;
		},
		removeItem(key: string) {
			store.delete(key);
		},
		setItem(key: string, value: string) {
			store.set(key, value);
		},
	};
	Object.defineProperty(globalThis, "localStorage", {
		configurable: true,
		writable: true,
		value: memoryStorage,
	});
	Object.defineProperty(window, "localStorage", {
		configurable: true,
		writable: true,
		value: memoryStorage,
	});
}

// happy-dom does not implement matchMedia; ThemeProvider reads it on the default "system" theme, so without this stub any test that renders through the provider throws. Stub a non-matching, no-op media query.
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
	}),
});
