import { screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { ContentSlot } from "@/components/content-slot";
import { renderWithProviders } from "@/test/render";

test("renders the active cell and exposes data-content-slot", () => {
	renderWithProviders(
		<ContentSlot slotKey="ready">
			<p>Ready body</p>
		</ContentSlot>,
	);

	expect(screen.getByText("Ready body")).toBeInTheDocument();
	expect(document.querySelector("[data-content-slot]")).toBeTruthy();
});

test("settle mode still renders children", () => {
	renderWithProviders(
		<ContentSlot slotKey="empty" mode="settle">
			<p>Empty body</p>
		</ContentSlot>,
	);

	expect(screen.getByText("Empty body")).toBeInTheDocument();
});
