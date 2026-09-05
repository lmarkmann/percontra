import { beforeEach, expect, test, vi } from "vitest";

const renderMock = vi.hoisted(() => vi.fn());
const createRootMock = vi.hoisted(() => vi.fn(() => ({ render: renderMock })));

vi.mock("react-dom/client", () => ({ createRoot: createRootMock }));
vi.mock("./router.tsx", () => ({ router: {} }));

beforeEach(() => {
	vi.resetModules();
	renderMock.mockClear();
	createRootMock.mockClear();
	document.body.replaceChildren();
});

test("mounts the app into the static shell root", async () => {
	const root = document.createElement("div");
	root.id = "root";
	root.textContent = "Static home shell";
	document.body.append(root);

	await import("./main");
	await vi.waitFor(() => {
		expect(renderMock).toHaveBeenCalledTimes(1);
	});

	expect(createRootMock).toHaveBeenCalledWith(root);
	root.remove();
});

test("does not register a service worker while the demo is gated", async () => {
	const root = document.createElement("div");
	root.id = "root";
	document.body.append(root);
	const register = vi.fn();
	vi.stubGlobal("navigator", { serviceWorker: { register } });

	await import("./main");

	// A worker here would intercept navigations and swallow the edge 401 before
	// the browser could prompt for credentials. See edge/proxy.ts.
	expect(register).not.toHaveBeenCalled();
	root.remove();
	vi.unstubAllGlobals();
});
