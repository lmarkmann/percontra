import { createSupportId } from "@/lib/support-id";

type ChatRole = "user" | "assistant";

export type ChatTransportErrorCause = "network" | "server";

export class ChatTransportError extends Error {
	readonly supportId: string;
	override readonly cause: ChatTransportErrorCause;

	constructor(
		message: string,
		cause: ChatTransportErrorCause = "server",
		supportId = createSupportId(),
	) {
		super(message);
		this.name = "ChatTransportError";
		this.supportId = supportId;
		this.cause = cause;
	}
}

export type ChatAttachment = {
	name: string;
	sizeLabel: string;
};

export type ChatMessage = {
	id: string;
	role: ChatRole;
	text: string;
	attachment?: ChatAttachment;
};

const replies = [
	"Message-scroller auto-follows new messages until you scroll away.",
	"Use attachments for idle, uploading, processing, error, and done states.",
	"Wire @ai-sdk/react or your API here - this demo uses a scripted transport.",
	"Markers separate days and show a pending reply while the transport runs.",
] as const;

let replyIndex = 0;

export function createMessageId(): string {
	return crypto.randomUUID();
}

export function nextAssistantReply(userText: string): string {
	const keyword = userText.toLowerCase();
	if (keyword.includes("attach")) {
		return "Attachments render beside the bubble. Remove them before send or ship with the message.";
	}
	if (keyword.includes("error")) {
		return "Surface transport errors inline with a retry action - the states panel shows the pattern.";
	}
	// non-null: modulo into a non-empty tuple is always in range
	const reply = replies[replyIndex % replies.length]!;
	replyIndex += 1;
	return reply;
}

export async function sendChatMessage(
	userText: string,
	attachment?: ChatAttachment,
): Promise<ChatMessage> {
	if (typeof navigator !== "undefined" && !navigator.onLine) {
		throw new ChatTransportError(
			"You’re offline. Check your connection, then try again.",
			"network",
		);
	}

	await delay(700);

	if (userText.toLowerCase().includes("fail")) {
		throw new ChatTransportError(
			"Transport rejected the message. Try again or copy the error ID for support.",
			"server",
		);
	}

	const base = nextAssistantReply(userText);
	const text = attachment
		? `${base} Received ${attachment.name} (${attachment.sizeLabel}).`
		: base;
	return {
		id: createMessageId(),
		role: "assistant",
		text,
	};
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
