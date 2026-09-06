import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignedInAs } from "@/components/signed-in-as";
import { fetchSession, SIGN_OUT_PATH } from "@/lib/session";
import { renderWithProviders } from "@/test/render";

vi.mock("@/lib/session", () => ({
	SIGN_OUT_PATH: "/cdn-cgi/access/logout",
	fetchSession: vi.fn(),
}));

const mockFetchSession = vi.mocked(fetchSession);

describe("SignedInAs", () => {
	beforeEach(() => {
		mockFetchSession.mockReset();
		mockFetchSession.mockResolvedValue(null);
	});

	it("shows the IdP display name and opens a menu with the sign-out link", async () => {
		mockFetchSession.mockResolvedValue({
			email: "luis@example.com",
			name: "Luis Markmann",
		});

		const { user } = renderWithProviders(<SignedInAs />);

		expect(await screen.findByText("Luis Markmann")).toBeInTheDocument();
		expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Account menu" }));

		const signOut = await screen.findByRole("menuitem", { name: "Sign out" });
		expect(signOut).toHaveAttribute("href", SIGN_OUT_PATH);
		expect(screen.getByText("luis@example.com")).toBeInTheDocument();
	});

	it("falls back to the email when the IdP sends no name", async () => {
		mockFetchSession.mockResolvedValue({
			email: "luis@example.com",
			name: null,
		});

		renderWithProviders(<SignedInAs />);

		expect(await screen.findByText("luis@example.com")).toBeInTheDocument();
	});

	it("collapsed shows only the avatar, named after the person", async () => {
		mockFetchSession.mockResolvedValue({
			email: "luis@example.com",
			name: "Luis Markmann",
		});

		const { user } = renderWithProviders(<SignedInAs collapsed />);

		const trigger = await screen.findByRole("button", {
			name: "Luis Markmann, account menu",
		});
		expect(screen.queryByText("Luis Markmann")).not.toBeInTheDocument();

		await user.click(trigger);

		expect(
			await screen.findByRole("menuitem", { name: "Sign out" }),
		).toHaveAttribute("href", SIGN_OUT_PATH);
	});

	it("renders nothing without a session or fallback", async () => {
		renderWithProviders(<SignedInAs />);

		await waitFor(() => expect(mockFetchSession).toHaveBeenCalled());
		expect(screen.queryByRole("button")).toBeNull();
	});
});
