import { expect, test } from "vitest";

import { formatRelativeTime } from "@/lib/relative-time";

const now = Date.parse("2026-07-11T12:00:00.000Z");

test("formats an ISO timestamp relative to now in English", () => {
	expect(formatRelativeTime("2026-07-11T10:00:00.000Z", now)).toBe("2h ago");
	expect(formatRelativeTime("2026-07-09T12:00:00.000Z", now)).toBe("2d ago");
});

test("uses the English automatic label for the current instant", () => {
	expect(formatRelativeTime("2026-07-11T12:00:00.000Z", now)).toBe("now");
});
