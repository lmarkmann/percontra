import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from "@/components/ui/chat/message-scroller";
import { renderWithProviders } from "@/test/render";

test("reveals the end control away from the bottom and scrolls on activation", async () => {
	const { user } = renderWithProviders(
		<MessageScrollerProvider>
			<MessageScroller>
				<MessageScrollerViewport data-testid="viewport">
					<MessageScrollerContent>
						<MessageScrollerItem messageId="first" />
					</MessageScrollerContent>
				</MessageScrollerViewport>
				<MessageScrollerButton />
			</MessageScroller>
		</MessageScrollerProvider>,
	);
	const viewport = screen.getByTestId("viewport");
	Object.defineProperties(viewport, {
		clientHeight: { configurable: true, value: 100 },
		scrollHeight: { configurable: true, value: 500 },
		scrollTop: { configurable: true, value: 0, writable: true },
	});
	const scrollTo = vi.fn();
	Object.defineProperty(viewport, "scrollTo", {
		configurable: true,
		value: scrollTo,
	});

	fireEvent.scroll(viewport);
	const button = screen.getByRole("button", { name: "Scroll to end" });
	await waitFor(() => expect(button).toHaveAttribute("data-active", "true"));
	await user.click(button);

	expect(scrollTo).toHaveBeenCalledWith({ top: 500, behavior: "smooth" });
});
