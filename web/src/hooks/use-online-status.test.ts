import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useOnlineStatus } from "@/hooks/use-online-status";

describe("useOnlineStatus", () => {
	it("starts from navigator.onLine and follows online/offline events", () => {
		const { result } = renderHook(() => useOnlineStatus());

		expect(result.current).toBe(true);

		act(() => {
			window.dispatchEvent(new Event("offline"));
		});
		expect(result.current).toBe(false);

		act(() => {
			window.dispatchEvent(new Event("online"));
		});
		expect(result.current).toBe(true);
	});
});
