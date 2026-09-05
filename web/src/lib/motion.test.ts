import { expect, test } from "vitest";

import {
	cellCrossfade,
	cellSettle,
	character,
	collapsePresence,
	iconSwap,
	MOTION_DURATION,
	MOTION_EASE,
	panelPresence,
	scrollRevealContainer,
	spring,
	tween,
	viewPresence,
} from "@/lib/motion";

test("duration tokens match the skill scale in seconds", () => {
	expect(MOTION_DURATION.fast).toBe(0.12);
	expect(MOTION_DURATION.base).toBe(0.2);
	expect(MOTION_DURATION.medium).toBe(0.28);
	expect(MOTION_DURATION.slow).toBe(0.4);
	expect(MOTION_DURATION.slower).toBe(0.6);
});

test("ease-out is the decelerating enter curve, not emphasized", () => {
	expect(MOTION_EASE.out).toEqual([0.22, 1, 0.36, 1]);
	expect(MOTION_EASE.emphasized).toEqual([0.2, 0, 0, 1]);
	expect(MOTION_EASE.out).not.toEqual(MOTION_EASE.emphasized);
});

test("template default character is standard at base duration", () => {
	expect(character.standard).toEqual({
		duration: MOTION_DURATION.base,
		ease: MOTION_EASE.out,
	});
	expect(character.productive.duration).toBeLessThan(
		character.standard.duration as number,
	);
});

test("panel exit is shorter than enter (~75%)", () => {
	const enter = panelPresence.transition.duration;
	const exit = panelPresence.exit.transition.duration;
	expect(exit).toBeLessThan(enter);
	expect(exit).toBeCloseTo(enter * 0.75, 5);
});

test("tweens never use spring type; icon swap tweens its effects channels", () => {
	expect(tween.base).not.toHaveProperty("type");
	expect(iconSwap.transition).toEqual(tween.base);
	expect(spring).not.toHaveProperty("iconSwap");
	expect(iconSwap.initial).toMatchObject({
		opacity: 0,
		scale: 0.25,
		filter: "blur(4px)",
	});
});

test("collapse preset drives grid rows, never width or height", () => {
	expect(collapsePresence.initial).toEqual({
		gridTemplateRows: "0fr",
		opacity: 0,
	});
	expect(collapsePresence.animate).toEqual({
		gridTemplateRows: "1fr",
		opacity: 1,
	});
	expect(collapsePresence.animate).not.toHaveProperty("height");
});

test("in-slot presets: crossfade is opacity-only; settle uses 4px Y", () => {
	expect(viewPresence).toEqual(cellCrossfade);
	expect(cellCrossfade.initial).toEqual({ opacity: 0 });
	expect(cellSettle.initial).toEqual({ opacity: 0, y: 4 });
	const exit = cellSettle.exit.transition.duration;
	expect(exit).toBeCloseTo(cellSettle.transition.duration * 0.75, 5);
});

test("list stagger stays in the 30-80ms band", () => {
	const variants = scrollRevealContainer(0.05);
	expect(variants.visible).toMatchObject({
		transition: { staggerChildren: 0.05 },
	});
});
