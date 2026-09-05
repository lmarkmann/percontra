import { beforeEach, expect, test, vi } from "vitest";

const renderMock = vi.hoisted(() => vi.fn());
const createRootMock = vi.hoisted(() => vi.fn(() => ({ render: renderMock })));
const registerServiceWorkerMock = vi.hoisted(() => vi.fn());

vi.mock("react-dom/client", () => ({ createRoot: createRootMock }));
vi.mock("./router.tsx", () => ({ router: {} }));
vi.mock("@/lib/register-service-worker", () => ({
	registerServiceWorker: registerServiceWorkerMock,
}));

beforeEach(() => {
	vi.resetModules();
	renderMock.mockClear();
	createRootMock.mockClear();
	registerServiceWorkerMock.mockClear();
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

test("registers the service worker at module load", async () => {
	const root = document.createElement("div");
	root.id = "root";
	document.body.append(root);

	await import("./main");

	expect(registerServiceWorkerMock).toHaveBeenCalledOnce();
	root.remove();
});
