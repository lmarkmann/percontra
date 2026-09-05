import { createRouter } from "@tanstack/react-router";

import { type RouterContext, queryClient } from "@/lib/query-client";

import { routeTree } from "./routeTree.gen";

export type { RouterContext };

export function createAppRouter(
	options?: Omit<
		Parameters<typeof createRouter>[0],
		"routeTree" | "defaultPreload" | "context"
	> & {
		context?: RouterContext;
	},
) {
	const { context, ...rest } = options ?? {};
	return createRouter({
		routeTree,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		context: context ?? { queryClient },
		...rest,
	});
}

export const router = createAppRouter();

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Re-export generated tree for memory-router tests.
export { routeTree };
