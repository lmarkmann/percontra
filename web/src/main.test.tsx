import { beforeEach, expect, test, vi } from "vitest";

const renderMock = vi.hoisted(() => vi.fn());
const createRootMock = vi.hoisted(() => vi.fn(() => ({ render: renderMock })));
const ensureAuthProviderReadyMock = vi.hoisted(() => vi.fn());

vi.mock("react-dom/client", () => ({ createRoot: createRootMock }));
vi.mock("@/lib/auth-provider", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/lib/auth-provider")>();
	return {
		...actual,
		ensureAuthProviderReady: ensureAuthProviderReadyMock,
	};
});
vi.mock("./router.tsx", () => ({ router: {} }));

beforeEach(() => {
	vi.resetModules();
	renderMock.mockClear();
	createRootMock.mockClear();
	ensureAuthProviderReadyMock.mockReset();
	document.body.replaceChildren();
});

test("mounts the app after AuthKit is ready", async () => {
	ensureAuthProviderReadyMock.mockResolvedValue(undefined);
	const root = document.createElement("div");
	root.id = "root";
	document.body.append(root);

	await import("./main");
	await vi.waitFor(() => {
		expect(renderMock).toHaveBeenCalledTimes(1);
	});

	expect(createRootMock).toHaveBeenCalledWith(root);
	expect(ensureAuthProviderReadyMock).toHaveBeenCalledOnce();
	root.remove();
});

test("keeps the static shell when AuthKit bootstrap rejects", async () => {
	const bootstrapError = new Error("AuthKit chunk failed");
	ensureAuthProviderReadyMock.mockRejectedValue(bootstrapError);
	const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	const root = document.createElement("div");
	root.id = "root";
	root.textContent = "Static home shell";
	document.body.append(root);

	await import("./main");
	await vi.waitFor(() => {
		expect(errorSpy).toHaveBeenCalledWith(
			"AuthKit bootstrap failed, keeping the static shell",
			bootstrapError,
		);
	});

	expect(createRootMock).not.toHaveBeenCalled();
	expect(renderMock).not.toHaveBeenCalled();
	expect(root).toHaveTextContent("Static home shell");
	root.remove();
});
