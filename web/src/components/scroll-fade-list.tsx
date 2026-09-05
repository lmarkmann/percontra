// Adapted from https://www.dqnamo.com/experiments/scroll-fade-list (dqnamo)
// Defaults use template surface tokens instead of hard-coded white.

import { type ReactNode, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type ScrollFadeListProps<TItem> = {
	getKey: (item: TItem) => string;
	items: readonly TItem[];
	renderItem: (item: TItem) => ReactNode;
	className?: string;
	maxFadeHeight?: number;
	scrollClassName?: string;
};

export function ScrollFadeList<TItem>({
	className,
	getKey,
	items,
	maxFadeHeight = 76,
	renderItem,
	scrollClassName,
}: ScrollFadeListProps<TItem>) {
	const frameRef = useRef<HTMLDivElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const frameElement = frameRef.current;
		const scrollElement = scrollRef.current;
		let animationFrame = 0;

		if (!frameElement || !scrollElement) {
			return () => {};
		}

		const updateFadeHeights = () => {
			const maxScrollTop = Math.max(
				0,
				scrollElement.scrollHeight - scrollElement.clientHeight,
			);
			const distanceFromTop = scrollElement.scrollTop;
			const distanceFromBottom = maxScrollTop - scrollElement.scrollTop;

			frameElement.style.setProperty(
				"--top-fade-height",
				`${Math.min(maxFadeHeight, Math.max(0, distanceFromTop))}px`,
			);
			frameElement.style.setProperty(
				"--bottom-fade-height",
				`${Math.min(maxFadeHeight, Math.max(0, distanceFromBottom))}px`,
			);
		};

		const scheduleFadeUpdate = () => {
			cancelAnimationFrame(animationFrame);
			animationFrame = requestAnimationFrame(updateFadeHeights);
		};

		updateFadeHeights();
		scrollElement.addEventListener("scroll", scheduleFadeUpdate, {
			passive: true,
		});

		const resizeObserver = new ResizeObserver(scheduleFadeUpdate);
		resizeObserver.observe(scrollElement);

		if (scrollElement.firstElementChild) {
			resizeObserver.observe(scrollElement.firstElementChild);
		}

		return () => {
			cancelAnimationFrame(animationFrame);
			scrollElement.removeEventListener("scroll", scheduleFadeUpdate);
			resizeObserver.disconnect();
		};
	}, [maxFadeHeight]);

	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-xl border border-border bg-background",
				"[--scroll-fade-list-bg:var(--background)] [--scrollbar-gutter-width:10px]",
				"[--bottom-fade-height:0px] [--top-fade-height:0px]",
				"before:pointer-events-none before:absolute before:top-0 before:right-[var(--scrollbar-gutter-width)] before:left-0 before:h-[var(--top-fade-height)] before:bg-linear-to-b before:from-[var(--scroll-fade-list-bg)] before:to-transparent before:content-['']",
				"after:pointer-events-none after:absolute after:right-[var(--scrollbar-gutter-width)] after:bottom-0 after:left-0 after:h-[var(--bottom-fade-height)] after:bg-linear-to-b after:from-transparent after:to-[var(--scroll-fade-list-bg)] after:content-['']",
				className,
			)}
			ref={frameRef}
		>
			<div
				className={cn(
					"h-80 [scrollbar-gutter:stable] overflow-y-auto overscroll-contain",
					scrollClassName,
				)}
				ref={scrollRef}
			>
				<ul className="p-2">
					{items.map((item) => (
						<li className="rounded-md px-3 py-2" key={getKey(item)}>
							{renderItem(item)}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
