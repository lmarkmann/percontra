import { act, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { ChatFeature } from "@/features/chat/chat-feature";
import * as chatTransport from "@/lib/chat-transport";
import {
	clearChatQueue,
	enqueueChatSend,
	listChatQueue,
} from "@/lib/offline-queue";
import { renderWithProviders } from "@/test/render";

let onLine = true;

beforeEach(() => {
	onLine = true;
	Object.defineProperty(window.navigator, "onLine", {
		configurable: true,
		get: () => onLine,
	});
});

afterEach(async () => {
	await clearChatQueue();
	vi.restoreAllMocks();
});

function setOnline(value: boolean) {
	onLine = value;
	act(() => {
		window.dispatchEvent(new Event(value ? "online" : "offline"));
	});
}

test("shows empty state with compose action", () => {
	renderWithProviders(<ChatFeature />);
	expect(screen.getByText("No messages yet")).toBeInTheDocument();
	expect(
		screen.getByRole("button", { name: "Compose message" }),
	).toBeInTheDocument();
});

test("surfaces inline transport error when send fails", async () => {
	vi.spyOn(chatTransport, "sendChatMessage").mockRejectedValueOnce(
		new chatTransport.ChatTransportError("Transport rejected the message."),
	);

	const { user } = renderWithProviders(<ChatFeature />);
	await user.type(screen.getByTestId("chat-composer"), "please fail");
	await user.click(screen.getByTestId("chat-send"));

	await waitFor(() => {
		expect(screen.getByTestId("chat-transport-error")).toBeInTheDocument();
	});
	expect(screen.getByTestId("chat-retry")).toBeInTheDocument();
	expect(screen.getByTestId("chat-copy-error")).toBeInTheDocument();
});

test("shows thinking marker while awaiting reply", async () => {
	let resolveReply: (value: chatTransport.ChatMessage) => void = () => {};
	const pending = new Promise<chatTransport.ChatMessage>((resolve) => {
		resolveReply = resolve;
	});
	vi.spyOn(chatTransport, "sendChatMessage").mockReturnValueOnce(pending);

	const { user } = renderWithProviders(<ChatFeature />);
	await user.type(screen.getByTestId("chat-composer"), "hello");
	await user.click(screen.getByTestId("chat-send"));

	expect(screen.getByTestId("chat-thinking")).toBeInTheDocument();

	resolveReply({
		id: "assistant-1",
		role: "assistant",
		text: "ok",
	});

	await waitFor(() => {
		expect(screen.getByTestId("chat-message-assistant")).toBeInTheDocument();
	});
});

test("offline submit enqueues without calling the transport", async () => {
	onLine = false;
	const send = vi.spyOn(chatTransport, "sendChatMessage");

	const { user } = renderWithProviders(<ChatFeature />);
	await user.type(screen.getByTestId("chat-composer"), "queue me");
	await user.click(screen.getByTestId("chat-send"));

	await waitFor(() => {
		expect(screen.getByTestId("chat-queued-hint")).toBeInTheDocument();
	});
	expect(screen.getByTestId("chat-message-user")).toHaveTextContent("queue me");
	expect(send).not.toHaveBeenCalled();

	const queue = await listChatQueue();
	expect(queue).toHaveLength(1);
	expect(queue[0]?.text).toBe("queue me");
});

test("flushes a stored queued send on mount while online", async () => {
	await enqueueChatSend({ id: "q1", text: "stored offline" });
	const send = vi.spyOn(chatTransport, "sendChatMessage").mockResolvedValue({
		id: "assistant-1",
		role: "assistant",
		text: "flushed reply",
	});

	renderWithProviders(<ChatFeature />);

	await waitFor(() => {
		expect(send).toHaveBeenCalledTimes(1);
	});
	expect(send).toHaveBeenCalledWith("stored offline", undefined);
	await waitFor(() => {
		expect(screen.getByTestId("chat-message-assistant")).toBeInTheDocument();
	});
	expect(await listChatQueue()).toHaveLength(0);
});

test("flushes the full queue in createdAt order with a user bubble per record", async () => {
	await enqueueChatSend({ id: "q1", text: "first queued", createdAt: 1 });
	await enqueueChatSend({ id: "q2", text: "second queued", createdAt: 2 });
	const send = vi
		.spyOn(chatTransport, "sendChatMessage")
		.mockImplementation((text) =>
			Promise.resolve({
				id: `reply-${text}`,
				role: "assistant",
				text: `reply to ${text}`,
			}),
		);

	renderWithProviders(<ChatFeature />);

	await waitFor(() => {
		expect(screen.getAllByTestId("chat-message-assistant")).toHaveLength(2);
	});
	const bubbles = screen.getAllByTestId(/^chat-message-/);
	expect(bubbles.map((node) => node.getAttribute("data-testid"))).toEqual([
		"chat-message-user",
		"chat-message-assistant",
		"chat-message-user",
		"chat-message-assistant",
	]);
	expect(send.mock.calls.map(([text]) => text)).toEqual([
		"first queued",
		"second queued",
	]);
	expect(await listChatQueue()).toEqual([]);
	expect(screen.queryByTestId("chat-queued-hint")).not.toBeInTheDocument();
});

test("failed flush keeps the record and the queued hint visible while online", async () => {
	await enqueueChatSend({ id: "q1", text: "still queued", createdAt: 1 });
	vi.spyOn(chatTransport, "sendChatMessage").mockRejectedValue(
		new chatTransport.ChatTransportError("Connection dropped.", "network"),
	);

	renderWithProviders(<ChatFeature />);

	await waitFor(() => {
		expect(screen.getByTestId("chat-transport-error")).toBeInTheDocument();
	});
	expect(screen.getByTestId("chat-queued-hint")).toBeInTheDocument();
	expect((await listChatQueue()).map((entry) => entry.id)).toEqual(["q1"]);
});

test("a successful online send leaves other queued records visible", async () => {
	await enqueueChatSend({ id: "q1", text: "abandoned send", createdAt: 1 });
	vi.spyOn(chatTransport, "sendChatMessage").mockImplementation((text) => {
		if (text === "abandoned send") {
			return Promise.reject(
				new chatTransport.ChatTransportError("Connection dropped.", "network"),
			);
		}
		return Promise.resolve({
			id: "reply-fresh",
			role: "assistant",
			text: "reply to fresh",
		});
	});

	const { user } = renderWithProviders(<ChatFeature />);

	await waitFor(() => {
		expect(screen.getByTestId("chat-transport-error")).toBeInTheDocument();
	});

	await user.type(screen.getByTestId("chat-composer"), "fresh message");
	await user.click(screen.getByTestId("chat-send"));

	await waitFor(() => {
		expect(screen.getByText("reply to fresh")).toBeInTheDocument();
	});
	await waitFor(() => {
		expect(screen.getByTestId("chat-queued-hint")).toBeInTheDocument();
	});
	expect((await listChatQueue()).map((entry) => entry.id)).toEqual(["q1"]);
	const abandonedBubbles = screen
		.getAllByTestId("chat-message-user")
		.filter((node) => node.textContent === "abandoned send");
	expect(abandonedBubbles).toHaveLength(1);
});

test("two racing flushes send a queued record only once", async () => {
	await enqueueChatSend({ id: "solo", text: "only once", createdAt: 1 });
	let replies = 0;
	const send = vi
		.spyOn(chatTransport, "sendChatMessage")
		.mockImplementation(() => {
			replies += 1;
			return Promise.resolve({
				id: `reply-${replies}`,
				role: "assistant",
				text: "ok",
			});
		});

	let chain = Promise.resolve();
	const locks = {
		request: (_name: string, task: () => Promise<void>) => {
			const run = chain.then(() => task());
			chain = run.then(
				() => undefined,
				() => undefined,
			);
			return run;
		},
	};
	Object.defineProperty(window.navigator, "locks", {
		configurable: true,
		value: locks,
	});

	try {
		renderWithProviders(
			<>
				<ChatFeature />
				<ChatFeature />
			</>,
		);

		await waitFor(async () => {
			expect(await listChatQueue()).toEqual([]);
		});
		expect(send).toHaveBeenCalledTimes(1);
	} finally {
		delete (window.navigator as { locks?: unknown }).locks;
	}
});

test("reconnect flushes the queued send exactly once", async () => {
	onLine = false;
	await enqueueChatSend({ id: "q1", text: "stored offline" });

	let resolveReply: (value: chatTransport.ChatMessage) => void = () => {};
	const send = vi.spyOn(chatTransport, "sendChatMessage").mockImplementation(
		() =>
			new Promise<chatTransport.ChatMessage>((resolve) => {
				resolveReply = resolve;
			}),
	);

	renderWithProviders(<ChatFeature />);
	await waitFor(() => {
		expect(screen.getByTestId("chat-queued-hint")).toBeInTheDocument();
	});
	expect(send).not.toHaveBeenCalled();

	setOnline(true);
	await waitFor(() => {
		expect(send).toHaveBeenCalledTimes(1);
	});

	// An offline/online flap while the flush is in flight must not double-send.
	setOnline(false);
	setOnline(true);

	resolveReply({ id: "assistant-1", role: "assistant", text: "flushed reply" });
	await waitFor(() => {
		expect(screen.getByTestId("chat-message-assistant")).toBeInTheDocument();
	});
	expect(send).toHaveBeenCalledTimes(1);
	expect(await listChatQueue()).toHaveLength(0);
});
