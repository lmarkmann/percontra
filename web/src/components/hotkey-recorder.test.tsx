import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HotkeyRecorder } from "@/components/hotkey-recorder";
import { renderWithProviders } from "@/test/render";

describe("HotkeyRecorder", () => {
	it("shows the bound chord when idle", () => {
		renderWithProviders(
			<HotkeyRecorder
				value="Super+K"
				onCommit={vi.fn(async () => null)}
				label="Summon hotkey"
			/>,
		);
		expect(screen.getByText("Summon hotkey")).toBeInTheDocument();
		expect(screen.getByText("click to change")).toBeInTheDocument();
		expect(screen.getByText("K")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Summon: Super K" }),
		).toBeInTheDocument();
	});

	it("enters recording on click and commits a chord on keydown", async () => {
		const onCommit = vi.fn(async () => null);
		const { user } = renderWithProviders(
			<HotkeyRecorder value="Super+K" onCommit={onCommit} />,
		);

		await user.click(
			screen.getByRole("button", { name: "Keyboard shortcut: Super K" }),
		);
		expect(screen.getByText("listening...")).toBeInTheDocument();

		window.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: "G",
				code: "KeyG",
				metaKey: true,
				bubbles: true,
				cancelable: true,
			}),
		);

		await waitFor(() => {
			expect(onCommit).toHaveBeenCalledWith("Super+G");
		});
	});

	it("rejects bare keys when requireModifier is true", async () => {
		const onCommit = vi.fn(async () => null);
		const { user } = renderWithProviders(
			<HotkeyRecorder value="Super+K" onCommit={onCommit} />,
		);

		await user.click(
			screen.getByRole("button", { name: "Keyboard shortcut: Super K" }),
		);

		window.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: "g",
				code: "KeyG",
				bubbles: true,
				cancelable: true,
			}),
		);

		await waitFor(() => {
			expect(screen.getByText(/hold/i)).toBeInTheDocument();
		});
		expect(onCommit).not.toHaveBeenCalled();
	});

	it("surfaces commit errors", async () => {
		const onCommit = vi.fn(async () => "That shortcut is taken");
		const { user } = renderWithProviders(
			<HotkeyRecorder value="Super+K" onCommit={onCommit} />,
		);

		await user.click(
			screen.getByRole("button", { name: "Keyboard shortcut: Super K" }),
		);
		window.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: "G",
				code: "KeyG",
				metaKey: true,
				bubbles: true,
				cancelable: true,
			}),
		);

		await waitFor(() => {
			expect(screen.getByRole("alert")).toHaveTextContent(
				"That shortcut is taken",
			);
		});
	});
});
