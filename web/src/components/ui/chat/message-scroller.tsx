import { ArrowDownIcon } from "lucide-react";
import {
	type ComponentProps,
	createContext,
	type ReactElement,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SCROLL_EDGE_THRESHOLD = 8;

type ScrollAlign = "start" | "center" | "end" | "nearest";
type ScrollOptions = {
	align?: ScrollAlign;
	behavior?: ScrollBehavior;
	scrollMargin?: number;
};

type ScrollableState = {
	start: boolean;
	end: boolean;
};

type VisibilityState = {
	currentAnchorId: string | null;
	visibleMessageIds: string[];
};

type MessageScrollerContextValue = {
	autoScroll: boolean;
	scrollMargin: number;
	viewportRef: React.RefObject<HTMLDivElement | null>;
	contentRef: React.RefObject<HTMLDivElement | null>;
	scrollable: ScrollableState;
	isAutoscrolling: boolean;
	scrollToStart: (options?: ScrollOptions) => boolean;
	scrollToEnd: (options?: ScrollOptions) => boolean;
	scrollToMessage: (messageId: string, options?: ScrollOptions) => boolean;
	markAutoscrolling: (active: boolean) => void;
	refreshScrollable: () => void;
	refreshVisibility: () => void;
	scheduleFollowBottom: () => void;
};

const MessageScrollerContext =
	createContext<MessageScrollerContextValue | null>(null);

function useMessageScrollerContext() {
	const context = useContext(MessageScrollerContext);
	if (!context) {
		throw new Error(
			"MessageScroller components must be used within MessageScrollerProvider.",
		);
	}
	return context;
}

function isNearEnd(
	viewport: HTMLDivElement,
	threshold = SCROLL_EDGE_THRESHOLD,
) {
	const distance =
		viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
	return distance <= threshold;
}

function isNearStart(
	viewport: HTMLDivElement,
	threshold = SCROLL_EDGE_THRESHOLD,
) {
	return viewport.scrollTop <= threshold;
}

function readScrollable(
	viewport: HTMLDivElement,
	threshold = SCROLL_EDGE_THRESHOLD,
): ScrollableState {
	return {
		start: isNearStart(viewport, threshold),
		end: isNearEnd(viewport, threshold),
	};
}

function readVisibility(
	content: HTMLDivElement,
	viewport: HTMLDivElement,
	scrollMargin: number,
): VisibilityState {
	const viewportRect = viewport.getBoundingClientRect();
	const anchorLine = viewportRect.top + scrollMargin;
	let currentAnchorId: string | null = null;
	const visibleMessageIds: string[] = [];

	for (const child of content.querySelectorAll<HTMLElement>(
		"[data-message-id]",
	)) {
		const messageId = child.dataset.messageId;
		if (!messageId) continue;

		const rect = child.getBoundingClientRect();
		if (rect.bottom > viewportRect.top && rect.top < viewportRect.bottom) {
			visibleMessageIds.push(messageId);
		}
		if (child.dataset.scrollAnchor === "true" && rect.top <= anchorLine + 0.5) {
			currentAnchorId = messageId;
		}
	}

	return { currentAnchorId, visibleMessageIds };
}

function scrollElementIntoView({
	element,
	viewport,
	align = "start",
	behavior = "auto",
	scrollMargin = 0,
}: {
	element: HTMLElement;
	viewport: HTMLDivElement;
	align?: ScrollAlign;
	behavior?: ScrollBehavior;
	scrollMargin?: number;
}) {
	const viewportRect = viewport.getBoundingClientRect();
	const elementRect = element.getBoundingClientRect();
	const elementTop = elementRect.top - viewportRect.top + viewport.scrollTop;

	let top = elementTop - scrollMargin;
	if (align === "center") {
		top =
			elementTop -
			scrollMargin -
			(viewport.clientHeight - elementRect.height) / 2;
	} else if (align === "end") {
		top =
			elementTop - viewport.clientHeight + elementRect.height + scrollMargin;
	} else if (align === "nearest") {
		const elementBottom = elementTop + elementRect.height;
		const visibleTop = viewport.scrollTop;
		const visibleBottom = viewport.scrollTop + viewport.clientHeight;
		if (elementTop >= visibleTop && elementBottom <= visibleBottom) {
			return;
		}
		if (elementTop < visibleTop) {
			top = elementTop - scrollMargin;
		} else {
			top = elementBottom - viewport.clientHeight + scrollMargin;
		}
	}

	viewport.scrollTo({ top: Math.max(0, top), behavior });
}

function MessageScrollerProvider({
	children,
	autoScroll = false,
	scrollMargin = 0,
}: {
	children?: ReactNode;
	autoScroll?: boolean;
	defaultScrollPosition?: "start" | "end" | "last-anchor";
	scrollEdgeThreshold?: number;
	scrollPreviousItemPeek?: number;
	scrollMargin?: number;
}) {
	const viewportRef = useRef<HTMLDivElement | null>(null);
	const contentRef = useRef<HTMLDivElement | null>(null);
	const followBottomRef = useRef(autoScroll);
	const autoscrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [scrollable, setScrollable] = useState<ScrollableState>({
		start: false,
		end: true,
	});
	const [isAutoscrolling, setIsAutoscrolling] = useState(false);

	useEffect(() => {
		followBottomRef.current = autoScroll || scrollable.end;
	}, [autoScroll, scrollable.end]);

	const markAutoscrolling = useCallback((active: boolean) => {
		setIsAutoscrolling(active);
		if (autoscrollTimerRef.current) {
			clearTimeout(autoscrollTimerRef.current);
			autoscrollTimerRef.current = null;
		}
		if (active) {
			autoscrollTimerRef.current = setTimeout(() => {
				setIsAutoscrolling(false);
				autoscrollTimerRef.current = null;
			}, 180);
		}
	}, []);

	const refreshScrollable = useCallback(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		setScrollable(readScrollable(viewport));
	}, []);

	const refreshVisibility = useCallback(() => {
		refreshScrollable();
	}, [refreshScrollable]);

	const scrollToStart = useCallback(
		({ behavior = "auto" }: ScrollOptions = {}) => {
			const viewport = viewportRef.current;
			if (!viewport) return false;
			followBottomRef.current = false;
			viewport.scrollTo({ top: 0, behavior });
			refreshScrollable();
			return true;
		},
		[refreshScrollable],
	);

	const scrollToEnd = useCallback(
		({ behavior = "auto" }: ScrollOptions = {}) => {
			const viewport = viewportRef.current;
			if (!viewport) return false;
			followBottomRef.current = true;
			markAutoscrolling(true);
			viewport.scrollTo({ top: viewport.scrollHeight, behavior });
			refreshScrollable();
			return true;
		},
		[markAutoscrolling, refreshScrollable],
	);

	const scrollToMessage = useCallback(
		(messageId: string, options: ScrollOptions = {}) => {
			const {
				align = "start",
				behavior = "auto",
				scrollMargin: margin = scrollMargin,
			} = options;
			const viewport = viewportRef.current;
			const content = contentRef.current;
			if (!viewport || !content) return false;

			const element = content.querySelector<HTMLElement>(
				`[data-message-id="${messageId}"]`,
			);
			if (!element) return false;

			followBottomRef.current = false;
			scrollElementIntoView({
				element,
				viewport,
				align,
				behavior,
				scrollMargin: margin,
			});
			refreshScrollable();
			return true;
		},
		[refreshScrollable, scrollMargin],
	);

	const scheduleFollowBottom = useCallback(() => {
		const viewport = viewportRef.current;
		if (!viewport || !followBottomRef.current) return;
		markAutoscrolling(true);
		viewport.scrollTop = viewport.scrollHeight;
		refreshScrollable();
	}, [markAutoscrolling, refreshScrollable]);

	useEffect(() => {
		return () => {
			if (autoscrollTimerRef.current) {
				clearTimeout(autoscrollTimerRef.current);
			}
		};
	}, []);

	const value = useMemo<MessageScrollerContextValue>(
		() => ({
			autoScroll,
			scrollMargin,
			viewportRef,
			contentRef,
			scrollable,
			isAutoscrolling,
			scrollToStart,
			scrollToEnd,
			scrollToMessage,
			markAutoscrolling,
			refreshScrollable,
			refreshVisibility,
			scheduleFollowBottom,
		}),
		[
			autoScroll,
			scrollMargin,
			scrollable,
			isAutoscrolling,
			scrollToStart,
			scrollToEnd,
			scrollToMessage,
			markAutoscrolling,
			refreshScrollable,
			refreshVisibility,
			scheduleFollowBottom,
		],
	);

	return (
		<MessageScrollerContext.Provider value={value}>
			{children}
		</MessageScrollerContext.Provider>
	);
}

function MessageScroller({
	className,
	children,
	...props
}: ComponentProps<"div">) {
	return (
		<div
			data-slot="message-scroller"
			className={cn(
				"group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

function MessageScrollerViewport({
	className,
	onScroll,
	...props
}: ComponentProps<"div"> & { preserveScrollOnPrepend?: boolean }) {
	const {
		viewportRef,
		contentRef,
		isAutoscrolling,
		refreshScrollable,
		scheduleFollowBottom,
	} = useMessageScrollerContext();

	useLayoutEffect(() => {
		const content = contentRef.current;
		if (!content || typeof MutationObserver === "undefined") return;

		const observer = new MutationObserver(() => {
			scheduleFollowBottom();
		});
		observer.observe(content, { childList: true, subtree: true });
		return () => observer.disconnect();
	}, [contentRef, scheduleFollowBottom]);

	return (
		<div
			ref={viewportRef}
			data-slot="message-scroller-viewport"
			data-autoscrolling={isAutoscrolling ? "" : undefined}
			className={cn(
				"size-full min-h-0 min-w-0 scrollbar-thin scrollbar-gutter-stable overflow-y-auto overscroll-contain edge-fade-y contain-content data-autoscrolling:scrollbar-thumb-transparent data-autoscrolling:scrollbar-track-transparent",
				className,
			)}
			onScroll={(event) => {
				onScroll?.(event);
				refreshScrollable();
			}}
			{...props}
		/>
	);
}

function MessageScrollerContent({
	className,
	children,
	...props
}: ComponentProps<"div"> & { spacerClassName?: string }) {
	const { contentRef, scheduleFollowBottom } = useMessageScrollerContext();

	useLayoutEffect(() => {
		scheduleFollowBottom();
	}, [scheduleFollowBottom]);

	return (
		<div
			ref={contentRef}
			data-slot="message-scroller-content"
			className={cn(
				"flex h-max min-h-full flex-col gap-message-group",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

function MessageScrollerItem({
	className,
	messageId,
	scrollAnchor = false,
	...props
}: ComponentProps<"div"> & {
	messageId?: string;
	scrollAnchor?: boolean;
}) {
	return (
		<div
			data-slot="message-scroller-item"
			data-message-id={messageId}
			data-scroll-anchor={scrollAnchor ? "true" : "false"}
			className={cn(
				// content-visibility's paint containment clips at the padding box;
				// p-2/-m-2 keeps bubble/attachment shadow-border visible at flush edges.
				"-m-2 min-w-0 shrink-0 p-2 [contain-intrinsic-size:auto_14rem] [content-visibility:auto]",
				className,
			)}
			{...props}
		/>
	);
}

function MessageScrollerButton({
	direction = "end",
	className,
	children,
	render,
	variant = "secondary",
	size = "icon-sm",
	behavior = "smooth",
	onClick,
	...props
}: ComponentProps<"button"> & {
	direction?: "start" | "end";
	render?: ReactElement;
	variant?: ComponentProps<typeof Button>["variant"];
	size?: ComponentProps<typeof Button>["size"];
	behavior?: ScrollBehavior;
}) {
	const { scrollable, scrollToEnd, scrollToStart } =
		useMessageScrollerContext();
	const active = direction === "end" ? !scrollable.end : !scrollable.start;

	const handleClick: ComponentProps<"button">["onClick"] = (event) => {
		onClick?.(event);
		if (event.defaultPrevented) return;
		if (direction === "end") {
			scrollToEnd({ behavior });
			return;
		}
		scrollToStart({ behavior });
	};

	const buttonClassName = cn(
		"duration-normal data-[active=false]:duration-fast absolute inset-s-1/2 z-dropdown -translate-x-1/2 border-border bg-background text-foreground transition-[translate,scale,opacity] ease-enter hover:bg-muted hover:text-foreground data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=false]:ease-enter data-[active=true]:translate-y-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[direction=end]:bottom-4 data-[direction=end]:data-[active=false]:translate-y-full data-[direction=start]:top-4 data-[direction=start]:data-[active=false]:-translate-y-full rtl:translate-x-1/2 data-[direction=start]:[&_svg]:rotate-180",
		className,
	);

	if (render) {
		return (
			<button
				type="button"
				data-slot="message-scroller-button"
				data-direction={direction}
				data-active={active ? "true" : "false"}
				data-variant={variant}
				data-size={size}
				inert={!active}
				className={buttonClassName}
				onClick={handleClick}
				{...props}
			>
				{children ?? (
					<>
						<ArrowDownIcon />
						<span className="sr-only">
							{direction === "end" ? "Scroll to end" : "Scroll to start"}
						</span>
					</>
				)}
			</button>
		);
	}

	return (
		<Button
			type="button"
			variant={variant}
			size={size}
			data-slot="message-scroller-button"
			data-direction={direction}
			data-active={active ? "true" : "false"}
			inert={!active}
			className={buttonClassName}
			onClick={handleClick}
			{...props}
		>
			{children ?? (
				<>
					<ArrowDownIcon />
					<span className="sr-only">
						{direction === "end" ? "Scroll to end" : "Scroll to start"}
					</span>
				</>
			)}
		</Button>
	);
}

function useMessageScroller() {
	const { scrollToEnd, scrollToMessage, scrollToStart } =
		useMessageScrollerContext();
	return { scrollToEnd, scrollToMessage, scrollToStart };
}

function useMessageScrollerScrollable(): ScrollableState {
	return useMessageScrollerContext().scrollable;
}

function useMessageScrollerVisibility(): VisibilityState {
	const { contentRef, viewportRef, scrollMargin } = useMessageScrollerContext();
	const [visibility, setVisibility] = useState<VisibilityState>({
		currentAnchorId: null,
		visibleMessageIds: [],
	});

	useEffect(() => {
		const content = contentRef.current;
		const viewport = viewportRef.current;
		if (!content || !viewport) return;

		const update = () => {
			setVisibility(readVisibility(content, viewport, scrollMargin));
		};
		update();

		const observer = new MutationObserver(update);
		observer.observe(content, { childList: true, subtree: true });
		viewport.addEventListener("scroll", update, { passive: true });
		return () => {
			observer.disconnect();
			viewport.removeEventListener("scroll", update);
		};
	}, [contentRef, viewportRef, scrollMargin]);

	return visibility;
}

/* oxlint-disable react/only-export-components */
export {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
	useMessageScroller,
	useMessageScrollerScrollable,
	useMessageScrollerVisibility,
};
/* oxlint-enable react/only-export-components */
