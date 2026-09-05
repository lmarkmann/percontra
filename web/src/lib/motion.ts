/**
 * Motion foundation for the template.
 *
 * CSS tokens in `styles/theme-tokens.css` are the source of truth for durations
 * and easings. Values here are seconds for the Motion API and must stay in lockstep.
 *
 * Default character: **standard** (brief: motion is punctuation, not spectacle).
 * Swap `character.*` via MotionConfig on a layout when a product zone needs a
 * different register (productive shell, calm money, expressive marketing).
 */
import type { Transition, Variants } from "motion/react";

// --- Tokens (seconds; mirrors --motion-* / --ease-* in theme-tokens.css) ---

export const MOTION_DURATION = {
	fast: 0.12,
	base: 0.2,
	medium: 0.28,
	slow: 0.4,
	slower: 0.6,
} as const;

export const MOTION_EASE = {
	out: [0.22, 1, 0.36, 1] as const,
	inOut: [0.65, 0, 0.35, 1] as const,
	emphasized: [0.2, 0, 0, 1] as const,
	soft: [0.4, 0, 0.2, 1] as const,
} as const;

/** Exit runs at ~75% of entrance duration. */
function exitDuration(enterSeconds: number): number {
	return Math.round(enterSeconds * 0.75 * 1000) / 1000;
}

// --- Tweens and springs ---

/** Default tweens for effects properties (opacity, color, blur). */
/** @public */
export const tween = {
	fast: {
		duration: MOTION_DURATION.fast,
		ease: MOTION_EASE.out,
	},
	base: {
		duration: MOTION_DURATION.base,
		ease: MOTION_EASE.out,
	},
	medium: {
		duration: MOTION_DURATION.medium,
		ease: MOTION_EASE.out,
	},
} satisfies Record<string, Transition>;

/**
 * Springs for spatial properties only (position, scale, bounds).
 * Color / opacity / blur always use `tween`, never spring bounce.
 */
export const spring = {
	settle: { type: "spring" as const, stiffness: 300, damping: 30 },
	snappy: { type: "spring" as const, stiffness: 500, damping: 25 },
	entrance: { type: "spring" as const, stiffness: 350, damping: 28 },
} satisfies Record<string, Transition>;

/**
 * Character registers for `MotionConfig transition={character.standard}`.
 * Template default is standard; products pick per zone, not per component.
 */
export const character = {
	/** Developer tools, admin shell: fast tweens, no spring energy. */
	productive: { duration: 0.14, ease: MOTION_EASE.out },
	/** Neutral template default; matches the token scale. */
	standard: { duration: MOTION_DURATION.base, ease: MOTION_EASE.out },
	/** Money / destructive: calm, certain, never overshoots. */
	calm: { duration: 0.32, ease: MOTION_EASE.soft },
	/** Brand marketing: unhurried long tails. */
	luxurious: { duration: 0.7, ease: MOTION_EASE.out },
	/** Consumer / playful: springs on spatial properties only. */
	expressive: {
		type: "spring" as const,
		visualDuration: 0.3,
		bounce: 0.25,
	},
} satisfies Record<string, Transition>;

// --- Presence presets (occasional UI; not high-frequency shell) ---

/** Enter/exit for occasional panels (tabs, thinking markers, attachments). */
export const panelPresence = {
	initial: { opacity: 0, y: 4 },
	animate: { opacity: 1, y: 0 },
	exit: {
		opacity: 0,
		y: -4,
		transition: {
			duration: exitDuration(MOTION_DURATION.base),
			ease: MOTION_EASE.out,
		},
	},
	transition: { duration: MOTION_DURATION.base, ease: MOTION_EASE.out },
} as const;

/**
 * Contextual icon swap (copy/check, theme icons) on the base tween: opacity
 * and blur are effects channels, and effects always tween, never spring.
 * Opacity + scale 0.25 + blur 4px. Prefer CSS `IconSwap` when Motion is off the path.
 * Wrap Motion usage in AnimatePresence initial={false} mode="popLayout".
 */
/** @public */
export const iconSwap = {
	initial: { opacity: 0, scale: 0.25, filter: "blur(4px)" },
	animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
	exit: { opacity: 0, scale: 0.25, filter: "blur(4px)" },
	transition: tween.base,
} as const;

/**
 * In-slot presence vocabulary (preference: frame still, work moves).
 * Use inside a fixed content cell only; never on route chrome (rails, kickers,
 * theme controls, page headers). Pair with `ContentSlot`.
 *
 * - `cellCrossfade` / `viewPresence`: loading ↔ ready (opacity only).
 * - `cellSettle` / `panelPresence`: ready to empty/error (opacity + 4px Y).
 */
/** Opacity-only in-slot crossfade (loading to ready, tab panels). */
export const cellCrossfade = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: {
		opacity: 0,
		transition: {
			duration: exitDuration(MOTION_DURATION.base),
			ease: MOTION_EASE.out,
		},
	},
	transition: { duration: MOTION_DURATION.base, ease: MOTION_EASE.out },
} as const;

/** @public */
export const viewPresence = { ...cellCrossfade };

/**
 * In-slot settle for empty/error (and other non-ready resource states).
 * Same 4px Y as `panelPresence` so occasional panels and cells share the feel.
 */
export const cellSettle = {
	initial: { opacity: 0, y: 4 },
	animate: { opacity: 1, y: 0 },
	exit: {
		opacity: 0,
		y: 4,
		transition: {
			duration: exitDuration(MOTION_DURATION.base),
			ease: MOTION_EASE.out,
		},
	},
	transition: { duration: MOTION_DURATION.base, ease: MOTION_EASE.out },
} as const;

/**
 * Collapsing panel without animating height (never animate box dimensions).
 * Drives `grid-template-rows` 0fr -> 1fr; apply to a
 * `display: grid` wrapper whose single child sets `min-height: 0` and
 * `overflow: hidden`.
 */
/** @public */
export const collapsePresence = {
	initial: { gridTemplateRows: "0fr", opacity: 0 },
	animate: { gridTemplateRows: "1fr", opacity: 1 },
	exit: { gridTemplateRows: "0fr", opacity: 0 },
	transition: { duration: MOTION_DURATION.base, ease: MOTION_EASE.out },
} as const;

// --- Scroll reveal (marketing / showcase only; once per section) ---

export type ScrollRevealDirection = "up" | "down" | "none";

/** Default viewport for scroll reveals: once, slightly before fully in view. */
export const scrollRevealViewport = {
	once: true,
	margin: "-10% 0px",
} as const;

/** Item variant for staggered scroll reveals. GPU-only: opacity + translateY. */
export function scrollRevealItem(
	distance = 8,
	direction: ScrollRevealDirection = "up",
): Variants {
	const offset =
		direction === "none" ? 0 : direction === "up" ? distance : -distance;

	return {
		hidden: direction === "none" ? { opacity: 0 } : { opacity: 0, y: offset },
		visible: {
			opacity: 1,
			y: 0,
			transition: { duration: MOTION_DURATION.base, ease: MOTION_EASE.out },
		},
	};
}

/** Container variant; list siblings 30-80ms (default 50), hero groups ~100ms. */
export function scrollRevealContainer(stagger = 0.05): Variants {
	return {
		hidden: {},
		visible: {
			transition: { staggerChildren: stagger, delayChildren: 0 },
		},
	};
}
