// Adapted from https://www.dqnamo.com/experiments/scramble-text (dqnamo)

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type ScrambleTextProps = {
	children: string;
	className?: string;
	intervalMs?: number;
};

const ENCRYPTED_TEXT_CHARS = "-_~`!@#$%^&*()+=[]{}|;:,.<>?";
const MAX_REVEAL_STEPS = 48;

function getTextSegments(text: string) {
	if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
		const segmenter = new Intl.Segmenter(undefined, {
			granularity: "grapheme",
		});
		return Array.from(segmenter.segment(text), ({ segment }) => segment);
	}
	return Array.from(text);
}

function getRandomEncryptedTextChar() {
	return ENCRYPTED_TEXT_CHARS[
		Math.floor(Math.random() * ENCRYPTED_TEXT_CHARS.length)
	];
}

function shouldPreserveSegment(segment: string) {
	return segment.trim() === "";
}

function scrambleSegments(segments: string[], revealedCount: number) {
	return segments
		.map((character, index) => {
			if (shouldPreserveSegment(character) || index < revealedCount) {
				return character;
			}
			return getRandomEncryptedTextChar();
		})
		.join("");
}

function getRevealStep(segmentCount: number) {
	return Math.max(1, Math.ceil(segmentCount / MAX_REVEAL_STEPS));
}

function shouldReduceMotion() {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ScrambleText({
	children,
	className,
	intervalMs = 32,
}: ScrambleTextProps) {
	// First paint shows the real string; scrambling starts after mount so
	// reduced-motion users (and non-JS paints) never see gibberish.
	const [displayText, setDisplayText] = useState(children);

	useEffect(() => {
		const segments = getTextSegments(children);
		if (segments.length === 0 || intervalMs <= 0 || shouldReduceMotion()) {
			// oxlint-disable-next-line react/set-state-in-effect -- the scramble is timer-driven, so its start and its reduced-motion opt-out both belong in the effect
			setDisplayText(children);
			return () => {};
		}

		let revealedCount = 0;
		const revealStep = getRevealStep(segments.length);
		setDisplayText(scrambleSegments(segments, revealedCount));

		const timer = window.setInterval(() => {
			revealedCount = Math.min(segments.length, revealedCount + revealStep);
			setDisplayText(scrambleSegments(segments, revealedCount));
			if (revealedCount >= segments.length) {
				window.clearInterval(timer);
			}
		}, intervalMs);

		return () => {
			window.clearInterval(timer);
		};
	}, [children, intervalMs]);

	return (
		<span className={cn("inline-block", className)}>
			<span aria-hidden="true">{displayText}</span>
			<span aria-atomic="true" aria-live="polite" className="sr-only">
				{children}
			</span>
		</span>
	);
}
