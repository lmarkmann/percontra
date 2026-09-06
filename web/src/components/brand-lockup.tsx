import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const WORDMARK = "Per Contra";

/** Mark width and cap height as a fraction of the em, mirroring brand-lockup.css. */
const MARK_WIDTH_EM = 0.62;
const MARK_HEIGHT_EM = 0.34;
const CAP_HEIGHT_EM = 0.7;

export type BrandLockupProps = {
	state: "mark" | "word";
	className?: string;
};

/**
 * The Per Contra brand lockup: the mark resolves into the wordmark and back.
 * Geometry, states and timing live in `src/styles/brand-lockup.css`; this file
 * owns only the one measurement that CSS cannot take.
 */
export function BrandLockup({ state, className }: BrandLockupProps) {
	const lockupRef = useRef<HTMLSpanElement>(null);
	const wordRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const lockup = lockupRef.current;
		const word = wordRef.current;
		if (!lockup || !word) return undefined;
		let live = true;

		function measure() {
			if (!live || !lockup || !word) return;
			// The word span is stretched to the window, so the glyph run has to be
			// measured through a range. Whole pixels only: a fractional width leaves
			// the block's antialiased edge sitting on the window boundary.
			const range = document.createRange();
			range.selectNodeContents(word);
			const runWidth = Math.ceil(range.getBoundingClientRect().width);
			if (runWidth === 0) return;
			const em = Number.parseFloat(getComputedStyle(lockup).fontSize);
			lockup.style.setProperty("--brand-lockup-width", `${runWidth}px`);
			lockup.style.setProperty(
				"--brand-lockup-mark-scale-x",
				((MARK_WIDTH_EM * em) / runWidth).toFixed(4),
			);
			lockup.style.setProperty(
				"--brand-lockup-mark-scale-y",
				(MARK_HEIGHT_EM / CAP_HEIGHT_EM).toFixed(4),
			);
			lockup.dataset.measured = "true";
		}

		measure();
		// A second pass once the serif has loaded: `font-display: optional` means
		// the first pass may have measured the metric-matched fallback. happy-dom
		// has no font loading API, so the first pass is the only one under test.
		void document.fonts?.ready.then(measure);
		return () => {
			live = false;
		};
	}, []);

	return (
		<span
			ref={lockupRef}
			className={cn("brand-lockup", className)}
			data-state={state}
			role="img"
			aria-label={WORDMARK}
		>
			<span className="brand-lockup-rules" />
			<span className="brand-lockup-window brand-lockup-block-window">
				<span className="brand-lockup-slide">
					<span className="brand-lockup-block" />
				</span>
			</span>
			<span className="brand-lockup-window brand-lockup-word-window">
				<span ref={wordRef} className="brand-lockup-word" aria-hidden>
					{WORDMARK}
				</span>
			</span>
		</span>
	);
}
