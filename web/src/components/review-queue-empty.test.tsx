import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { ReviewQueueEmpty } from "@/components/review-queue-empty";

test("an unloaded queue explains there is nothing to review yet", () => {
	render(<ReviewQueueEmpty reason="unloaded" />);
	expect(screen.getByText(/no migration loaded/i)).toBeInTheDocument();
});

test("a resolved queue reads as the goal state, not as missing data", () => {
	render(<ReviewQueueEmpty reason="resolved" />);
	expect(screen.getByText(/every gap has a decision/i)).toBeInTheDocument();
	expect(screen.queryByText(/no data/i)).not.toBeInTheDocument();
});

test("a filtered queue offers the fix that actually applies", async () => {
	let cleared = false;
	render(
		<ReviewQueueEmpty
			reason="filtered"
			onClearFilter={() => {
				cleared = true;
			}}
		/>,
	);
	screen.getByRole("button", { name: /clear the filter/i }).click();
	expect(cleared).toBe(true);
});

test("every cause names itself in the DOM so the state is assertable", () => {
	for (const reason of ["unloaded", "resolved", "filtered"] as const) {
		const { container, unmount } = render(<ReviewQueueEmpty reason={reason} />);
		expect(
			container.querySelector(`[data-reason="${reason}"]`),
		).toBeInTheDocument();
		unmount();
	}
});
