import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { Button } from "@/components/ui/button";

test("button loading state uses the CSS spinner without lucide", () => {
	render(<Button loading>Save</Button>);
	const spinner = screen.getByRole("status", { name: "Loading" });
	expect(spinner.tagName).toBe("SPAN");
	expect(spinner).toHaveClass("animate-spin");
});
