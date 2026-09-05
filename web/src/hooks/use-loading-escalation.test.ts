import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useLoadingEscalation } from "@/hooks/use-loading-escalation";

afterEach(() => {
	vi.useRealTimers();
});

describe("useLoadingEscalation", () => {
	it("shows the skeleton after the delay and escalates to slow after slowMs", () => {
		vi.useFakeTimers();
		const { result } = renderHook(() =>
			useLoadingEscalation(true, { delayMs: 200, slowMs: 5000 }),
		);

		expect(result.current).toEqual({ showSkeleton: false, isSlow: false });
		act(() => {
			vi.advanceTimersByTime(200);
		});
		expect(result.current).toEqual({ showSkeleton: true, isSlow: false });
		act(() => {
			vi.advanceTimersByTime(4800);
		});
		expect(result.current).toEqual({ showSkeleton: true, isSlow: true });
	});

	it("reports neither state while inactive, using default timings", () => {
		vi.useFakeTimers();
		const { result } = renderHook(() => useLoadingEscalation(false));

		act(() => {
			vi.advanceTimersByTime(10000);
		});
		expect(result.current).toEqual({ showSkeleton: false, isSlow: false });
	});

	it("keeps the skeleton for minVisibleMs after loading resolves", () => {
		vi.useFakeTimers();
		const { result, rerender } = renderHook(
			({ active }) =>
				useLoadingEscalation(active, {
					delayMs: 200,
					minVisibleMs: 400,
					slowMs: 5000,
				}),
			{
				initialProps: { active: true },
			},
		);

		act(() => {
			vi.advanceTimersByTime(250);
		});
		rerender({ active: false });
		expect(result.current).toEqual({ showSkeleton: true, isSlow: false });
		act(() => {
			vi.advanceTimersByTime(350);
		});
		expect(result.current).toEqual({ showSkeleton: false, isSlow: false });
	});
});
