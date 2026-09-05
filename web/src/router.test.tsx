import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";

import { createAppQueryClient } from "@/lib/query-client";
import { AppProviders } from "@/test/render";

import { createAppRouter, routeTree } from "./router";

test("route intent preloads always revalidate loader data", () => {
	expect(createAppRouter().options.defaultPreloadStaleTime).toBe(0);
});

test("beforeLoad redirects an unauthenticated visitor from /dashboard to /login", async () => {
	const history = createMemoryHistory({
		initialEntries: ["/dashboard?view=empty"],
	});
	const queryClient = createAppQueryClient();
	const memoryRouter = createRouter({
		routeTree,
		history,
		defaultPreload: "intent",
		context: { queryClient },
	});
	render(<RouterProvider router={memoryRouter} />, {
		wrapper: ({ children }) => (
			<AppProviders queryClient={queryClient}>{children}</AppProviders>
		),
	});
	await waitFor(() =>
		expect(
			screen.getByRole("heading", { name: /log in/i }),
		).toBeInTheDocument(),
	);
	expect(memoryRouter.state.location.search).toEqual({
		redirect: "/dashboard?view=empty",
	});
});
