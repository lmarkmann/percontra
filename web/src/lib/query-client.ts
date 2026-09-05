import { QueryClient } from "@tanstack/react-query";

/** TanStack Router context; kept here so route files avoid importing `router.tsx`. */
export type RouterContext = {
	queryClient: QueryClient;
};

/**
 * App QueryClient factory.
 * Tests pass `retry: false` so failed queries do not hang Vitest.
 */
export function createAppQueryClient(): QueryClient {
	const isTest = import.meta.env.MODE === "test";
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				retry: isTest ? false : 1,
				refetchOnWindowFocus: !isTest,
			},
			mutations: {
				retry: false,
			},
		},
	});
}

/** Singleton used by the app router and QueryClientProvider. */
export const queryClient = createAppQueryClient();
