import type { ReactNode } from "react";

import { AnimatePresence, m } from "motion/react";

import {
	MOTION_DURATION,
	MOTION_EASE,
	panelPresence,
	type ScrollRevealDirection,
	scrollRevealContainer,
	scrollRevealItem,
	scrollRevealViewport,
} from "@/lib/motion";

type FadeInProps = {
	className?: string;
	children?: ReactNode;
	/** Seconds - use for stagger within a section (30-80ms steps). */
	delay?: number;
	direction?: ScrollRevealDirection;
	/** Pixels - keep ≤ 12 for functional UI. */
	distance?: number;
	once?: boolean;
	margin?: string;
	/** Skip motion entirely (e.g. feature flag or Storybook static). */
	disabled?: boolean;
};

/**
 * Viewport reveal: fades and rises into place the first time it scrolls into
 * view. Marketing / showcase only (budget: one group per section). Not for
 * high-frequency or dashboard surfaces. Reduced motion is handled by
 * MotionConfig in MotionShell.
 *
 * @public - copied by projects that need a scroll reveal.
 */
export function FadeIn({
	delay = 0,
	direction = "up",
	distance = 8,
	once = scrollRevealViewport.once,
	margin = scrollRevealViewport.margin,
	disabled = false,
	className,
	children,
}: FadeInProps) {
	if (disabled) {
		return <div className={className}>{children}</div>;
	}

	const offset =
		direction === "none" ? 0 : direction === "up" ? distance : -distance;
	const hidden =
		direction === "none" ? { opacity: 0 } : { opacity: 0, y: offset };
	const visible = direction === "none" ? { opacity: 1 } : { opacity: 1, y: 0 };

	return (
		<m.div
			className={className}
			initial={hidden}
			whileInView={visible}
			viewport={{ once, margin }}
			transition={{
				duration: MOTION_DURATION.base,
				delay,
				ease: MOTION_EASE.out,
			}}
		>
			{children as ReactNode}
		</m.div>
	);
}

type FadeInGroupProps = {
	className?: string;
	children?: ReactNode;
	/** Seconds between sibling reveals - keep 0.03-0.08. */
	stagger?: number;
	once?: boolean;
	margin?: string;
	disabled?: boolean;
};

/**
 * Staggered scroll reveal for a section (hero headline  ->  subhead  ->  CTA).
 * Budget: one group per viewport section, ≤ 3 children on landers.
 *
 */
export function FadeInGroup({
	stagger = 0.05,
	once = scrollRevealViewport.once,
	margin = scrollRevealViewport.margin,
	disabled = false,
	className,
	children,
}: FadeInGroupProps) {
	if (disabled) {
		return <div className={className}>{children}</div>;
	}

	return (
		<m.div
			className={className}
			initial="hidden"
			whileInView="visible"
			viewport={{ once, margin }}
			variants={scrollRevealContainer(stagger)}
		>
			{children as ReactNode}
		</m.div>
	);
}

type FadeInItemProps = {
	className?: string;
	children?: ReactNode;
	direction?: ScrollRevealDirection;
	distance?: number;
	disabled?: boolean;
};

/** Child of `FadeInGroup` - inherits stagger timing from the parent. */
export function FadeInItem({
	direction = "up",
	distance = 8,
	disabled = false,
	className,
	children,
}: FadeInItemProps) {
	if (disabled) {
		return <div className={className}>{children}</div>;
	}

	return (
		<m.div
			className={className}
			variants={scrollRevealItem(distance, direction)}
		>
			{children as ReactNode}
		</m.div>
	);
}

type PresencePanelProps = {
	show: boolean;
	panelKey: string;
	children: ReactNode;
	className?: string;
};

/**
 * Cross-fades panel content on state change. `initial={false}` suppresses
 * entrance on first paint - animation runs only on later toggles.
 *
 * @public
 */
export function PresencePanel({
	show,
	panelKey,
	children,
	className,
}: PresencePanelProps) {
	return (
		<AnimatePresence mode="wait" initial={false}>
			{show ? (
				<m.div key={panelKey} className={className} {...panelPresence}>
					{children}
				</m.div>
			) : null}
		</AnimatePresence>
	);
}
