import { act, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { OfflineBanner } from "@/components/offline-banner";
import { renderWithProviders } from "@/test/render";

test("renders nothing while online", () => {
	renderWithProviders(<OfflineBanner />);
	expect(screen.queryByTestId("offline-banner")).not.toBeInTheDocument();
});

test("announces offline status when disconnected", () => {
	renderWithProviders(<OfflineBanner />);

	act(() => {
		window.dispatchEvent(new Event("offline"));
	});

	const banner = screen.getByTestId("offline-banner");
	expect(banner).toHaveAttribute("role", "status");
	expect(banner).toHaveTextContent(/offline/i);

	act(() => {
		window.dispatchEvent(new Event("online"));
	});
	expect(screen.queryByTestId("offline-banner")).not.toBeInTheDocument();
});
