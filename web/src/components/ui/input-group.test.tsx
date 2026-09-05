import { describe, expect, it } from "vitest";

import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { renderWithProviders } from "@/test/render";

describe("InputGroupAddon", () => {
	it("is presentational and does not wrap its buttons in an interactive role", () => {
		const { container, getByRole } = renderWithProviders(
			<InputGroup>
				<InputGroupInput aria-label="Message" />
				<InputGroupAddon align="inline-end">
					<InputGroupButton aria-label="Send">Send</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>,
		);

		const addon = container.querySelector('[data-slot="input-group-addon"]');
		expect(addon).not.toHaveAttribute("role");
		expect(addon).not.toHaveAttribute("tabindex");

		const button = getByRole("button", { name: "Send" });
		expect(button.tagName).toBe("BUTTON");
	});
});
