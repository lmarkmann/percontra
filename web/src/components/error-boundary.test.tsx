import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { ErrorBoundary } from "@/components/error-boundary";
import { reportError } from "@/lib/error-reporting";

vi.mock("@/lib/error-reporting", () => ({
	reportError: vi.fn(),
}));

const writeText = vi.fn<(text: string) => Promise<void>>(() =>
	Promise.resolve(),
);

beforeEach(() => {
	// Silence React's own error-boundary logging and the boundary's console.error.
	vi.spyOn(console, "error").mockImplementation(() => {});
	writeText.mockClear();
	Object.defineProperty(navigator, "clipboard", {
		value: { writeText },
		configurable: true,
	});
});

afterEach(() => {
	vi.unstubAllEnvs();
});

function Bomb(): never {
	throw new Error("kaboom");
}

function renderCrashed() {
	render(
		<ErrorBoundary>
			<Bomb />
		</ErrorBoundary>,
	);
	const supportId = screen
		.getByText("Error ID:", { exact: false })
		.querySelector("code")?.textContent;
	if (!supportId) throw new Error("support id not rendered");
	return supportId;
}

test("production fallback shows generic copy and copies only the support ID", () => {
	vi.stubEnv("DEV", false);
	const supportId = renderCrashed();

	expect(
		screen.getByText(
			"Something unexpected happened while rendering this view.",
		),
	).toBeInTheDocument();
	expect(screen.queryByText("kaboom")).not.toBeInTheDocument();

	fireEvent.click(screen.getByRole("button", { name: "Copy error details" }));
	expect(writeText).toHaveBeenCalledWith(
		`Error ID: ${supportId}\nSomething unexpected happened while rendering this view.`,
	);
});

test("DEV fallback shows the raw message and copies message plus stack", () => {
	vi.stubEnv("DEV", true);
	const supportId = renderCrashed();

	expect(screen.getByText("kaboom")).toBeInTheDocument();

	fireEvent.click(screen.getByRole("button", { name: "Copy error details" }));
	const payload = writeText.mock.calls[0]?.[0] ?? "";
	expect(payload).toContain(`Error ID: ${supportId}`);
	expect(payload).toContain("kaboom");
	expect(payload).toMatch(/\n\s+at /);
});

test("reports the crash with the on-screen support ID", () => {
	vi.stubEnv("DEV", false);
	const supportId = renderCrashed();

	expect(reportError).toHaveBeenCalledWith(expect.any(Error), { supportId });
});
