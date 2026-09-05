import type { MutationPhase } from "@/lib/view-state";

import { ArrowUp, MessageSquare, Paperclip, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import {
	type SubmitEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import { ErrorState } from "@/components/error-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Attachment,
	AttachmentAction,
	AttachmentActions,
	AttachmentContent,
	AttachmentDescription,
	AttachmentGroup,
	AttachmentMedia,
	AttachmentTitle,
	Bubble,
	BubbleContent,
	Marker,
	MarkerContent,
	MarkerIcon,
	Message,
	MessageAvatar,
	MessageContent,
	MessageGroup,
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from "@/components/ui/chat";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { StatusPill } from "@/components/ui/status-pill";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { actionClass } from "@/lib/action-class";
import {
	type ChatAttachment,
	type ChatMessage,
	ChatTransportError,
	createMessageId,
	sendChatMessage,
} from "@/lib/chat-transport";
import { panelPresence } from "@/lib/motion";
import {
	dequeueChatSend,
	enqueueChatSend,
	listChatQueue,
	type QueuedChatSend,
} from "@/lib/offline-queue";
import { toast } from "@/lib/toast";

type PendingAttachment = ChatAttachment & { id: string };

type QueueableSend = {
	id: string;
	text: string;
	attachment?: ChatAttachment;
	createdAt?: number;
};

type TransportPhase = MutationPhase<QueueableSend>;

// Serializes queue flushes across tabs; happy-dom and older engines have no Web Locks (navigator.locks is null there), so fall back to running unlocked.
async function withFlushLock(task: () => Promise<void>): Promise<void> {
	const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
	if (locks) {
		await locks.request("chat-queue-flush", task);
		return;
	}
	await task();
}

export function ChatFeature() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [draft, setDraft] = useState("");
	const [pendingAttachment, setPendingAttachment] =
		useState<PendingAttachment | null>(null);
	const [transport, setTransport] = useState<TransportPhase>({ type: "idle" });
	const [queued, setQueued] = useState<QueuedChatSend[]>([]);
	const online = useOnlineStatus();
	const composerRef = useRef<HTMLTextAreaElement>(null);
	const flushingRef = useRef(false);

	const isSubmitting = transport.type === "submitting";
	const sendDisabled = !draft.trim() || isSubmitting;
	const failKeyword = "fail";

	const refreshQueue = useCallback(async () => {
		setQueued(await listChatQueue());
	}, []);

	const deliver = useCallback(
		async (
			send: QueueableSend,
			preserveSupportId?: string,
		): Promise<boolean> => {
			setTransport({ type: "submitting" });

			try {
				const assistantMessage = await sendChatMessage(
					send.text,
					send.attachment,
				);
				setMessages((current) => [...current, assistantMessage]);
				setTransport({ type: "idle" });
				await dequeueChatSend(send.id);
				toast.success("Reply received");
				return true;
			} catch (error) {
				const failure =
					error instanceof ChatTransportError
						? error
						: new ChatTransportError(
								"Message failed. Check your connection, then try again.",
								"server",
								preserveSupportId,
							);

				if (failure.cause === "network") {
					// createdAt travels along, so re-enqueueing an already queued record keeps its position.
					await enqueueChatSend(send);
				}

				setTransport({
					type: "failed",
					supportId: failure.supportId,
					message: failure.message,
					retry: send,
				});
				return false;
			} finally {
				await refreshQueue();
			}
		},
		[refreshQueue],
	);

	const flushQueue = useCallback(async () => {
		if (flushingRef.current) {
			return;
		}
		flushingRef.current = true;
		try {
			await withFlushLock(async () => {
				// Re-list inside the lock: another tab may have flushed records while we waited.
				const queue = await listChatQueue();
				for (const record of queue) {
					setMessages((current) =>
						current.some((entry) => entry.id === record.id)
							? current
							: [
									...current,
									{
										id: record.id,
										role: "user",
										text: record.text,
										attachment: record.attachment,
									},
								],
					);
					// oxlint-disable-next-line no-await-in-loop -- FIFO delivery is the point; records must send one at a time.
					if (!(await deliver(record))) {
						return;
					}
				}
			});
		} finally {
			flushingRef.current = false;
			await refreshQueue();
		}
	}, [deliver, refreshQueue]);

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		const text = draft.trim();
		if (!text || isSubmitting) {
			return;
		}

		const attachment = pendingAttachment
			? {
					name: pendingAttachment.name,
					sizeLabel: pendingAttachment.sizeLabel,
				}
			: undefined;

		const userMessage: ChatMessage = {
			id: createMessageId(),
			role: "user",
			text,
			attachment,
		};

		setMessages((current) => [...current, userMessage]);
		setDraft("");
		setPendingAttachment(null);

		if (!online) {
			await enqueueChatSend({
				id: userMessage.id,
				text,
				attachment,
			});
			await refreshQueue();
			return;
		}

		await deliver({ id: userMessage.id, text, attachment });
	}

	async function handleRetry() {
		if (transport.type !== "failed" || !online || !transport.retry) {
			return;
		}
		const { retry, supportId } = transport;
		await deliver(retry, supportId);
	}

	useEffect(() => {
		// oxlint-disable-next-line react/set-state-in-effect -- initial read of the IndexedDB queue, which is the external system this effect exists to sync with
		void refreshQueue();
	}, [refreshQueue]);

	useEffect(() => {
		if (!online || queued.length === 0 || transport.type !== "idle") {
			return;
		}
		void flushQueue();
	}, [flushQueue, online, queued.length, transport.type]);

	function handleAttach() {
		setPendingAttachment({
			id: createMessageId(),
			name: "notes.md",
			sizeLabel: "4 KB",
		});
		toast.info("Attachment ready", {
			description: "Send the message to include the file.",
		});
	}

	function focusComposer() {
		composerRef.current?.focus();
	}

	return (
		<Card
			className="flex h-chat-panel flex-col shadow-elevated"
			data-testid="chat-feature"
		>
			<CardHeader className="gap-2">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 flex-1">
						<CardTitle>Chat feature</CardTitle>
						<CardDescription>
							Scripted transport demo with composer, attachments, and inline
							error recovery. Type {failKeyword} to simulate a server error.
						</CardDescription>
					</div>
					{!online ? (
						<StatusPill status="error" data-testid="chat-offline-pill">
							Offline
						</StatusPill>
					) : null}
				</div>
			</CardHeader>
			<CardContent className="min-h-0 flex-1 overflow-hidden p-0">
				<MessageScrollerProvider autoScroll>
					<MessageScroller>
						<MessageScrollerViewport>
							<MessageScrollerContent className="p-(--card-spacing)">
								{messages.length === 0 ? (
									<Empty className="border-0 bg-transparent p-4">
										<EmptyHeader>
											<EmptyMedia type="icon">
												<MessageSquare />
											</EmptyMedia>
											<EmptyTitle>No messages yet</EmptyTitle>
											<EmptyDescription>
												Send a first message to exercise the scripted transport.
												Attachments and error recovery are wired in the composer
												below.
											</EmptyDescription>
										</EmptyHeader>
										<EmptyContent>
											<Button
												size="sm"
												className={actionClass()}
												onClick={focusComposer}
											>
												Compose message
											</Button>
										</EmptyContent>
									</Empty>
								) : null}
								<MessageGroup>
									{messages.map((entry) => (
										<MessageScrollerItem
											key={entry.id}
											messageId={entry.id}
											scrollAnchor={entry.role === "user"}
											data-testid={`chat-message-${entry.role}`}
										>
											<Message align={entry.role === "user" ? "end" : "start"}>
												{entry.role === "assistant" ? (
													<MessageAvatar>
														<Avatar size="sm">
															<AvatarFallback className="text-label">
																AI
															</AvatarFallback>
														</Avatar>
													</MessageAvatar>
												) : null}
												<MessageContent>
													<Bubble
														variant={
															entry.role === "user" ? "default" : "muted"
														}
													>
														<BubbleContent className="whitespace-pre-wrap">
															{entry.text}
														</BubbleContent>
													</Bubble>
													{entry.attachment ? (
														<AttachmentGroup>
															<Attachment data-testid="chat-attachment">
																<AttachmentMedia>
																	<Paperclip />
																</AttachmentMedia>
																<AttachmentContent>
																	<AttachmentTitle
																		title={entry.attachment.name}
																	>
																		{entry.attachment.name}
																	</AttachmentTitle>
																	<AttachmentDescription>
																		{entry.attachment.sizeLabel}
																	</AttachmentDescription>
																</AttachmentContent>
															</Attachment>
														</AttachmentGroup>
													) : null}
												</MessageContent>
											</Message>
										</MessageScrollerItem>
									))}
									<AnimatePresence initial={false}>
										{transport.type === "submitting" ? (
											<MessageScrollerItem key="thinking" scrollAnchor={false}>
												<m.div layout={false} {...panelPresence}>
													<Marker role="status" data-testid="chat-thinking">
														<MarkerIcon>
															<Spinner />
														</MarkerIcon>
														<MarkerContent>Reply pending...</MarkerContent>
													</Marker>
												</m.div>
											</MessageScrollerItem>
										) : null}
									</AnimatePresence>
									{transport.type === "failed" ? (
										<MessageScrollerItem scrollAnchor={false}>
											<ErrorState
												layout="inline"
												title="Transport failed"
												message={transport.message}
												supportId={transport.supportId}
												copyToastMessage="Error ID copied"
												data-testid="chat-transport-error"
												retryTestId="chat-retry"
												copyTestId="chat-copy-error"
												retryDisabled={!online}
												onRetry={() => void handleRetry()}
											/>
										</MessageScrollerItem>
									) : null}
								</MessageGroup>
							</MessageScrollerContent>
						</MessageScrollerViewport>
						<MessageScrollerButton />
					</MessageScroller>
				</MessageScrollerProvider>
			</CardContent>
			<CardFooter className="sticky bottom-0 z-10 -mx-px flex flex-col gap-2 border-t border-border bg-card/95 px-(--card-spacing) py-4 backdrop-blur-sm supports-backdrop-filter:bg-card/80 max-sm:safe-bottom sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
				{queued.length > 0 ? (
					<p
						className="w-full text-label text-muted-foreground"
						data-testid="chat-queued-hint"
					>
						{queued.length === 1
							? "1 message queued - will send when you\u2019re back online."
							: `${queued.length} messages queued - will send when you\u2019re back online.`}
					</p>
				) : null}
				{pendingAttachment ? (
					<AttachmentGroup className="w-full">
						<Attachment state="idle" data-testid="chat-pending-attachment">
							<AttachmentMedia>
								<Paperclip />
							</AttachmentMedia>
							<AttachmentContent>
								<AttachmentTitle title={pendingAttachment.name}>
									{pendingAttachment.name}
								</AttachmentTitle>
								<AttachmentDescription>
									{pendingAttachment.sizeLabel}
								</AttachmentDescription>
							</AttachmentContent>
							<AttachmentActions>
								<AttachmentAction
									aria-label="Remove attachment"
									onClick={() => setPendingAttachment(null)}
								>
									<X />
								</AttachmentAction>
							</AttachmentActions>
						</Attachment>
					</AttachmentGroup>
				) : null}
				<form
					className="w-full"
					onSubmit={(event) => {
						void handleSubmit(event);
					}}
					id="chat-form"
				>
					<InputGroup>
						<InputGroupTextarea
							ref={composerRef}
							data-testid="chat-composer"
							placeholder={"Write a message\u2026"}
							className="min-h-10"
							value={draft}
							onChange={(event) => setDraft(event.target.value)}
							disabled={isSubmitting}
							aria-describedby={!online ? "chat-offline-hint" : undefined}
						/>
						<InputGroupAddon align="block-end" className="p-2">
							<InputGroupButton
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label="Attach file"
								data-testid="chat-attach"
								disabled={isSubmitting}
								onClick={handleAttach}
							>
								<Paperclip />
							</InputGroupButton>
							<InputGroupButton
								type="submit"
								variant="default"
								size="icon-sm"
								className="ml-auto"
								aria-label="Send message"
								data-testid="chat-send"
								disabled={sendDisabled}
							>
								<ArrowUp />
							</InputGroupButton>
						</InputGroupAddon>
					</InputGroup>
					{!online ? (
						<p
							id="chat-offline-hint"
							className="mt-2 text-label text-muted-foreground"
						>
							{
								"You\u2019re offline. Drafts stay on this device; queued messages send when you reconnect."
							}
						</p>
					) : null}
				</form>
			</CardFooter>
		</Card>
	);
}
