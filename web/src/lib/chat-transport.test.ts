import { afterEach, beforeEach, expect, test, vi } from "vitest";

import {
	ChatTransportError,
	nextAssistantReply,
	sendChatMessage,
} from "@/lib/chat-transport";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

test("nextAssistantReply handles attachment keyword", () => {
	expect(nextAssistantReply("How do attachments work?")).toContain(
		"Attachments render",
	);
});

test("sendChatMessage returns assistant message", async () => {
	const pending = sendChatMessage("hello");
	await vi.advanceTimersByTimeAsync(700);
	const message = await pending;
	expect(message.role).toBe("assistant");
	expect(message.text.length).toBeGreaterThan(0);
});

test("sendChatMessage throws ChatTransportError when message contains fail", async () => {
	const pending = sendChatMessage("please fail this");
	pending.catch(() => {});
	await vi.advanceTimersByTimeAsync(700);
	await expect(pending).rejects.toBeInstanceOf(ChatTransportError);
});
