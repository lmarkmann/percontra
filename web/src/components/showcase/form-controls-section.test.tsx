import { describe, expect, it } from "vitest";

import { FormControlsSection } from "@/components/showcase/form-controls-section";
import { renderWithProviders } from "@/test/render";

describe("FormControlsSection", () => {
	it("associates the invalid field with its error text", () => {
		const { container } = renderWithProviders(<FormControlsSection />);

		const input = container.querySelector("#showcase-invalid");
		const error = container.querySelector("#showcase-invalid-error");

		expect(input).toHaveAttribute("aria-invalid", "true");
		expect(input).toHaveAttribute("aria-describedby", "showcase-invalid-error");
		expect(error).toHaveAttribute("role", "alert");
		expect(error).toHaveTextContent("Enter a valid email address.");
	});
});
