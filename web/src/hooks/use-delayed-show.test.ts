import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDelayedShow } from "@/hooks/use-delayed-show";

afterEach(() => {
	vi.useRealTimers();
});

describe("useDelayedShow", () => {
	it("stays hidden until the delay elapses, then shows", () => {
		vi.useFakeTimers();
		const { result } = renderHook(() => useDelayedShow(true, 200));

		expect(result.current).toBe(false);
		act(() => {
			vi.advanceTimersByTime(199);
		});
		expect(result.current).toBe(false);
		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(result.current).toBe(true);
	});

	it("never shows when active resolves before the delay", () => {
		vi.useFakeTimers();
		const { result, rerender } = renderHook(
			({ active }) => useDelayedShow(active, 200, 400),
			{
				initialProps: { active: true },
			},
		);

		act(() => {
			vi.advanceTimersByTime(150);
		});
		rerender({ active: false });
		expect(result.current).toBe(false);
		act(() => {
			vi.advanceTimersByTime(1000);
		});
		expect(result.current).toBe(false);
	});

	it("holds the shown state for minVisibleMs when active resolves just past the delay", () => {
		vi.useFakeTimers();
		const { result, rerender } = renderHook(
			({ active }) => useDelayedShow(active, 200, 400),
			{
				initialProps: { active: true },
			},
		);

		act(() => {
			vi.advanceTimersByTime(250);
		});
		expect(result.current).toBe(true);
		rerender({ active: false });
		expect(result.current).toBe(true);
		act(() => {
			vi.advanceTimersByTime(349);
		});
		expect(result.current).toBe(true);
		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(result.current).toBe(false);
	});

	it("stays visible when active flips back on during the min-visible hold", () => {
		vi.useFakeTimers();
		const { result, rerender } = renderHook(
			({ active }) => useDelayedShow(active, 200, 400),
			{
				initialProps: { active: true },
			},
		);

		// Shown at t=200; deactivating at t=250 starts the hold (release t=600).
		act(() => {
			vi.advanceTimersByTime(250);
		});
		rerender({ active: false });
		expect(result.current).toBe(true);

		// Reactivate at t=350, mid-hold: the hide timer is dropped and the delay
		// timer re-arms while still shown; no flicker at any point.
		act(() => {
			vi.advanceTimersByTime(100);
		});
		rerender({ active: true });
		expect(result.current).toBe(true);
		act(() => {
			vi.advanceTimersByTime(100);
		});
		expect(result.current).toBe(true);
		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(result.current).toBe(true);

		// The re-armed delay fired at t=550 and refreshed shownAt, so
		// deactivating at t=750 holds until t=950, not the stale t=600.
		rerender({ active: false });
		act(() => {
			vi.advanceTimersByTime(199);
		});
		expect(result.current).toBe(true);
		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(result.current).toBe(false);
	});

	it("hides immediately when the hold is already satisfied", () => {
		vi.useFakeTimers();
		const { result, rerender } = renderHook(
			({ active }) => useDelayedShow(active, 200, 400),
			{
				initialProps: { active: true },
			},
		);

		act(() => {
			vi.advanceTimersByTime(900);
		});
		expect(result.current).toBe(true);
		rerender({ active: false });
		expect(result.current).toBe(false);
	});
});
