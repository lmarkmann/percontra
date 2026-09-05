import type { QueryClient } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { type RenderResult, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { domAnimation, LazyMotion, MotionConfig } from "motion/react";

import { ThemeProvider } from "@/components/theme-provider";
import { character } from "@/lib/motion";
import { createAppQueryClient } from "@/lib/query-client";
import { routeTree } from "@/router";

interface ProvidersRenderResult extends RenderResult {
	user: ReturnType<typeof userEvent.setup>;
}

// Mirrors main.tsx (ThemeProvider > QueryClientProvider > LazyMotion > MotionConfig) minus ErrorBoundary and the router, so test failures surface as thrown errors rather than the fallback UI. Tests exercising real route config (loaders, beforeLoad) render their own RouterProvider wrapped in this instead of renderWithProviders - nesting two routers throws. Router: unit tests mock Link/useNavigate in setup.ts so components can render without a full TanStack tree. router.test.tsx builds a real memory router.
export function AppProviders({
	children,
	queryClient,
}: {
	children: ReactNode;
	queryClient?: QueryClient;
}) {
	const client = queryClient ?? createAppQueryClient();
	return (
		<ThemeProvider>
			<QueryClientProvider client={client}>
				<LazyMotion features={domAnimation} strict>
					<MotionConfig reducedMotion="user" transition={character.standard}>
						{children}
					</MotionConfig>
				</LazyMotion>
			</QueryClientProvider>
		</ThemeProvider>
	);
}

// Renders `ui` inside the app provider tree (no real router; see setup mocks).
export function renderWithProviders(ui: ReactElement): ProvidersRenderResult {
	const queryClient = createAppQueryClient();
	const result = render(ui, {
		wrapper: ({ children }) => (
			<AppProviders queryClient={queryClient}>{children}</AppProviders>
		),
	});
	return { ...result, user: userEvent.setup() };
}

// Renders a real TanStack memory router at `path`. Use for route files whose
// component is no longer exported for code-splitting.
export function renderRoute(path: string) {
	const history = createMemoryHistory({ initialEntries: [path] });
	const queryClient = createAppQueryClient();
	const router = createRouter({
		routeTree,
		history,
		defaultPreload: "intent",
		context: { queryClient },
	});
	const result = render(<RouterProvider router={router} />, {
		wrapper: ({ children }) => (
			<AppProviders queryClient={queryClient}>{children}</AppProviders>
		),
	});
	return { ...result, router, user: userEvent.setup() };
}
