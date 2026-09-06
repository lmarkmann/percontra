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

	it("shows the IdP display name and a sign-out link", async () => {
		mockFetchSession.mockResolvedValue({
			email: "luis@example.com",
			name: "Luis Markmann",
		});

		renderWithProviders(<SignedInAs />);

		expect(await screen.findByText("Luis Markmann")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Sign out" })).toHaveAttribute(
			"href",
			SIGN_OUT_PATH,
		);
	});

	it("falls back to the email when the IdP sends no name", async () => {
		mockFetchSession.mockResolvedValue({
			email: "luis@example.com",
			name: null,
		});

		renderWithProviders(<SignedInAs />);

		expect(await screen.findByText("luis@example.com")).toBeInTheDocument();
	});

	it("collapsed shows only the avatar as the named image", async () => {
		mockFetchSession.mockResolvedValue({
			email: "luis@example.com",
			name: "Luis Markmann",
		});

		renderWithProviders(<SignedInAs collapsed />);

		expect(
			await screen.findByRole("img", { name: "Luis Markmann" }),
		).toBeInTheDocument();
		expect(screen.queryByText("Luis Markmann")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "Sign out" }),
		).not.toBeInTheDocument();
	});

	it("renders nothing without a session or fallback", async () => {
		renderWithProviders(<SignedInAs />);

		await waitFor(() => expect(mockFetchSession).toHaveBeenCalled());
		expect(screen.queryByRole("link", { name: "Sign out" })).toBeNull();
	});
});
