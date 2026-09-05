import { screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { ErrorState } from "@/components/error-state";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { renderWithProviders } from "@/test/render";
import {
	expectEmpty,
	expectErrorWithRetry,
	expectLoadingSurface,
} from "@/test/state-matrix";

test("expectLoadingSurface finds skeleton chrome", () => {
	renderWithProviders(
		<div>
			<Skeleton data-testid="skeleton" className="h-8 w-48" />
		</div>,
	);
	expectLoadingSurface();
	// Helper asserts; keep an explicit expect so vitest/expect-expect is happy.
	expect(document.querySelector("[data-testid='skeleton']")).toBeTruthy();
});

test("expectErrorWithRetry finds message and retry", async () => {
	const onRetry = vi.fn();
	const { user } = renderWithProviders(
		<ErrorState
			title="Could not load"
			message="Check your connection, then try again."
			supportId="supp-01"
			onRetry={onRetry}
			retryTestId="error-retry"
		/>,
	);
	const retry = await expectErrorWithRetry(/check your connection/i);
	await user.click(retry);
	expect(onRetry).toHaveBeenCalledOnce();
});

test("expectEmpty differs from error (no retry)", async () => {
	renderWithProviders(
		<Empty>
			<EmptyHeader>
				<EmptyTitle>Nothing here</EmptyTitle>
				<EmptyDescription>Create your first project.</EmptyDescription>
			</EmptyHeader>
		</Empty>,
	);
	await expectEmpty(/create your first project/i);
	expect(screen.queryByRole("button", { name: /retry/i })).toBeNull();
});
