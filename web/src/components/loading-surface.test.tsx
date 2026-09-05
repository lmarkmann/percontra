import { act, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { LoadingSurface } from "@/components/loading-surface";
import { renderWithProviders } from "@/test/render";

// Timings are the hook defaults: delay 200ms, min visible 400ms, slow 5s.

afterEach(() => {
	vi.useRealTimers();
});

test("hides content before the delay, then shows skeleton and slow copy", () => {
	vi.useFakeTimers();
	renderWithProviders(
		<LoadingSurface
			active
			early={<p>early</p>}
			slowMessage="Still loading..."
			skeleton={<div data-testid="skeleton">skeleton</div>}
		/>,
	);

	expect(screen.getByText("early")).toBeInTheDocument();
	expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();

	act(() => {
		vi.advanceTimersByTime(200);
	});
	expect(screen.getByTestId("skeleton")).toBeInTheDocument();
	expect(screen.queryByText("Still loading...")).not.toBeInTheDocument();

	act(() => {
		vi.advanceTimersByTime(4800);
	});
	expect(screen.getByText("Still loading...")).toBeInTheDocument();
});

test("keeps the skeleton for the minimum-visible hold after active drops", () => {
	vi.useFakeTimers();
	const { rerender } = renderWithProviders(
		<LoadingSurface
			active
			skeleton={<div data-testid="skeleton">skeleton</div>}
		/>,
	);

	act(() => {
		vi.advanceTimersByTime(250);
	});
	expect(screen.getByTestId("skeleton")).toBeInTheDocument();

	rerender(
		<LoadingSurface
			active={false}
			skeleton={<div data-testid="skeleton">skeleton</div>}
		/>,
	);
	expect(screen.getByTestId("skeleton")).toBeInTheDocument();

	act(() => {
		vi.advanceTimersByTime(350);
	});
	expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
});

test("renders nothing when inactive", () => {
	const { container } = renderWithProviders(
		<LoadingSurface
			active={false}
			skeleton={<div data-testid="skeleton">skeleton</div>}
		/>,
	);
	expect(container).toBeEmptyDOMElement();
});
