import { QueryClient } from "@tanstack/react-query";
import { expect, test } from "vitest";

import { dashboardQueryOptions } from "@/lib/dashboard-api";

test("dashboardQueryOptions wires the view into its key and query", async () => {
	const options = dashboardQueryOptions("empty");

	expect(options.queryKey).toEqual(["dashboard", "empty"]);
	expect(await new QueryClient().fetchQuery(options)).toEqual({
		status: "empty",
	});
});
