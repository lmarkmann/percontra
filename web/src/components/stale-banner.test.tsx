import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { StaleBanner } from "@/components/stale-banner";

test("nothing stale renders nothing at all", () => {
	const { container } = render(<StaleBanner batchLabels={[]} />);
	expect(container).toBeEmptyDOMElement();
});

test("it announces as an alert, because someone else's edit caused it", () => {
	render(<StaleBanner batchLabels={["Chalbury / batch 639661"]} />);
	expect(screen.getByRole("alert")).toBeInTheDocument();
});

test("it says the export is withheld and why, not just that something is stale", () => {
	render(<StaleBanner batchLabels={["Chalbury / batch 639661"]} />);
	expect(screen.getByText(/export withheld/i)).toBeInTheDocument();
	expect(
		screen.getByText(/no longer covers what would leave/i),
	).toBeInTheDocument();
	expect(screen.getByText("Chalbury / batch 639661")).toBeInTheDocument();
});

test("it counts, so one stale approval does not read as plural", () => {
	const { rerender } = render(
		<StaleBanner batchLabels={["Chalbury / batch 639661"]} />,
	);
	expect(screen.getByText(/an approval is out of date/i)).toBeInTheDocument();

	rerender(<StaleBanner batchLabels={["a / batch 1", "b / batch 2"]} />);
	expect(screen.getByText(/2 approvals are out of date/i)).toBeInTheDocument();
});
