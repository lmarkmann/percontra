import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const sonnerToast = Object.assign(vi.fn(), {
	success: vi.fn(),
	error: vi.fn(),
	info: vi.fn(),
	warning: vi.fn(),
	message: vi.fn(),
	dismiss: vi.fn(),
});

vi.mock("sonner", () => ({
	toast: sonnerToast,
}));

describe("toast", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetModules();
	});

	test("onToasterMount notifies new subscribers after sonner loads", async () => {
		const { onToasterMount, resolveToasterMounted, toast } =
			await import("@/lib/toast");
		const mount = vi.fn();
		const stop = onToasterMount(mount);

		toast.success("Saved");
		resolveToasterMounted();
		await vi.waitFor(() => expect(mount).toHaveBeenCalledTimes(1));

		stop();
	});

	test("toast facade forwards calls to sonner after lazy load", async () => {
		const { resolveToasterMounted, toast } = await import("@/lib/toast");

		toast("Hello");
		toast.success("Saved");
		toast.error("Failed");
		toast.info("Note");
		toast.warning("Careful");
		toast.message("Plain");
		toast.dismiss(1);
		resolveToasterMounted();

		await vi.waitFor(() =>
			expect(sonnerToast).toHaveBeenCalledWith("Hello", undefined),
		);
		expect(sonnerToast.success).toHaveBeenCalledWith("Saved", undefined);
		expect(sonnerToast.error).toHaveBeenCalledWith("Failed", undefined);
		expect(sonnerToast.info).toHaveBeenCalledWith("Note", undefined);
		expect(sonnerToast.warning).toHaveBeenCalledWith("Careful", undefined);
		expect(sonnerToast.message).toHaveBeenCalledWith("Plain", undefined);
		expect(sonnerToast.dismiss).toHaveBeenCalledWith(1);
	});
});
