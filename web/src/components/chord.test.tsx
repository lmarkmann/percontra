import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Chord, Keycap } from "@/components/chord";
import { renderWithProviders } from "@/test/render";

describe("Keycap", () => {
	it("renders idle glyphs at full muted-foreground for contrast", () => {
		const { container } = renderWithProviders(
			<Keycap state="idle" size="sm" glyph="K" />,
		);
		const keycap = container.querySelector('[data-slot="keycap"]');
		expect(keycap).toHaveClass("text-muted-foreground");
		expect(keycap?.className).not.toContain("text-muted-foreground/45");
	});
});

describe("Chord", () => {
	it("renders modifier and key keycaps for a binding", () => {
		const { container } = renderWithProviders(
			<Chord value="Super+Shift+K" size="sm" />,
		);
		const keycaps = container.querySelectorAll('[data-slot="keycap"]');
		expect(keycaps.length).toBe(3);
		expect(screen.getByText("K")).toBeInTheDocument();
	});

	it("renders nothing for an empty chord", () => {
		const { container } = renderWithProviders(<Chord value="" />);
		expect(container.querySelectorAll('[data-slot="keycap"]')).toHaveLength(0);
	});
});
