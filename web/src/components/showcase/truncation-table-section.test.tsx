import { describe, expect, it } from "vitest";

import { TruncationTableSection } from "@/components/showcase/truncation-table-section";
import { renderWithProviders } from "@/test/render";

describe("TruncationTableSection", () => {
	it("lets the truncation cards shrink below their content on narrow tracks", () => {
		const { container } = renderWithProviders(<TruncationTableSection />);
		const cards = container.querySelectorAll(".grid > div");

		expect(cards).toHaveLength(3);
		for (const card of cards) {
			expect(card).toHaveClass("min-w-0");
		}
	});
});
