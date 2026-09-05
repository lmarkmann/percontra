import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { MetricValue } from "@/components/metric-value";

test("renders known values as tabular numbers", () => {
	render(<MetricValue value={42} />);
	expect(screen.getByText("42")).toBeInTheDocument();
	expect(screen.getByText("42")).not.toHaveAttribute("data-unknown");
});

test("unknown values use hyphen-minus placeholder", () => {
	render(<MetricValue value={null} />);
	const node = screen.getByText("-");
	expect(node).toHaveAttribute("data-unknown", "true");
	expect(node.textContent).not.toBe("N/A");
	expect(node.textContent).not.toBe("—");
});
