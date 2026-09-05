import { screen } from "@testing-library/react";
import { expect } from "vitest";

/** Loading contract: skeleton or early placeholder is visible, not bare empty main. */
export function expectLoadingSurface(): void {
	const skeleton = document.querySelector(
		'[data-testid="skeleton"], [data-slot="skeleton"], .animate-pulse',
	);
	expect(skeleton).toBeTruthy();
}

/** Error contract: mapped message plus a retry affordance. */
export async function expectErrorWithRetry(
	messagePattern: RegExp,
	retryName = /retry|try again/i,
): Promise<HTMLElement> {
	expect(await screen.findByText(messagePattern)).toBeInTheDocument();
	const retry = screen.getByRole("button", { name: retryName });
	expect(retry).toBeInTheDocument();
	return retry;
}

/** Empty must differ from error: empty copy present, no retry button. */
export async function expectEmpty(
	messagePattern: RegExp,
	retryName = /retry|try again/i,
): Promise<void> {
	expect(await screen.findByText(messagePattern)).toBeInTheDocument();
	expect(screen.queryByRole("button", { name: retryName })).toBeNull();
}
