import { expect, test } from "vitest";

import { dashboardDataSchema } from "@/contract/dashboard";
import { demoDashboardData } from "@/contract/dashboard-fixtures";

test("dashboard fixtures carry ISO timestamps instead of presentation copy", () => {
	const fixture = demoDashboardData("ready", "request-1");
	const parsed = dashboardDataSchema.parse(fixture);
	if (parsed.status !== "ready") throw new Error("Expected ready fixture");

	expect(Date.parse(parsed.projects[0]!.updatedAt)).not.toBeNaN();
	expect(Date.parse(parsed.activity[0]!.occurredAt)).not.toBeNaN();
	expect(Date.parse(parsed.metrics.lastSyncAt)).not.toBeNaN();
});

test("dashboard contract rejects preformatted timestamps", () => {
	const fixture = demoDashboardData("ready", "request-1");
	if (fixture.status !== "ready") throw new Error("Expected ready fixture");
	fixture.projects[0]!.updatedAt = "2h ago";

	expect(() => dashboardDataSchema.parse(fixture)).toThrow(/datetime/i);
});
