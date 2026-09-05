import { expect, test } from "vitest";

import { UNKNOWN_METRIC } from "@/lib/view-state";

test("UNKNOWN_METRIC is a hyphen-minus, never an em dash", () => {
	expect(UNKNOWN_METRIC).toBe("-");
	expect(UNKNOWN_METRIC).not.toBe("—");
	expect(UNKNOWN_METRIC).not.toBe("–");
});
