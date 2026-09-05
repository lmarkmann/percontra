// Adapted from https://www.dqnamo.com/experiments/logo-trace-loader (dqnamo)
// Template: replace LOGO_VIEW_BOX / TRACE_PATH / FILL_PATHS with your logo SVG data.

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type LogoTraceLoaderProps = {
	loading?: boolean;
	isComplete?: boolean;
	size?: number;
	strokeWidth?: number;
	loopDurationSeconds?: number;
	fillFadeSeconds?: number;
	className?: string;
	ariaLabel?: string;
	onDone?: () => void;
};

/** Replace with your logo viewBox, e.g. "0 0 64 64". */
const LOGO_VIEW_BOX = "0 0 64 64";

/** Single clean outline path for the animated stroke. */
const TRACE_PATH =
	"M12 32c0-11 9-20 20-20s20 9 20 20-9 20-20 20-20-9-20-20zm8 0c0 6.6 5.4 12 12 12s12-5.4 12-12-5.4-12-12-12-12 5.4-12 12z";

/** Filled paths revealed after the trace completes. */
const FILL_PATHS = [
	"M32 14c-9.9 0-18 8.1-18 18s8.1 18 18 18 18-8.1 18-18-8.1-18-18-18zm0 28c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10z",
] as const;

type LoaderPhase = "loop" | "closingOutline" | "fadingFill" | "done";

// Only the completion sequence is timed; "loop" and "done" follow from the props.
type ClosingPhase = Exclude<LoaderPhase, "loop">;

export function LogoTraceLoader({
	loading = true,
	isComplete = false,
	size = 48,
	strokeWidth = 2,
	loopDurationSeconds = 1.2,
	fillFadeSeconds = 0.35,
	className,
	ariaLabel = "Loading",
	onDone,
}: LogoTraceLoaderProps) {
	const [closingPhase, setClosingPhase] =
		useState<ClosingPhase>("closingOutline");
	const [wasComplete, setWasComplete] = useState(isComplete);

	// Rearm the sequence during render rather than from an effect, so a restart
	// never paints one frame of the previous phase first.
	if (wasComplete !== isComplete) {
		setWasComplete(isComplete);
		setClosingPhase("closingOutline");
	}

	const phase: LoaderPhase = isComplete
		? closingPhase
		: loading
			? "loop"
			: "done";

	useEffect(() => {
		if (!isComplete) {
			return undefined;
		}

		let fillTimer = 0;
		let doneTimer = 0;
		const closingTimer = window.setTimeout(
			() => {
				setClosingPhase("fadingFill");
				fillTimer = window.setTimeout(() => {
					setClosingPhase("done");
					doneTimer = window.setTimeout(() => onDone?.(), 0);
				}, fillFadeSeconds * 1000);
			},
			loopDurationSeconds * 0.2 * 1000,
		);

		return () => {
			window.clearTimeout(closingTimer);
			window.clearTimeout(fillTimer);
			window.clearTimeout(doneTimer);
		};
	}, [isComplete, loopDurationSeconds, fillFadeSeconds, onDone]);

	return (
		<svg
			role="status"
			aria-label={ariaLabel}
			viewBox={LOGO_VIEW_BOX}
			width={size}
			height={size}
			className={cn("text-foreground", className)}
		>
			<style>{`
				@keyframes logo-trace-loader-loop {
					to { stroke-dashoffset: -1; }
				}
				@keyframes logo-trace-loader-fill {
					to { opacity: 1; }
				}
			`}</style>
			<g opacity="0.18">
				<path
					d={TRACE_PATH}
					fill="none"
					stroke="currentColor"
					strokeWidth={Math.max(1, strokeWidth / 2)}
					strokeLinejoin="round"
				/>
			</g>

			{phase === "loop" || phase === "closingOutline" ? (
				<path
					d={TRACE_PATH}
					fill="none"
					stroke="currentColor"
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeLinejoin="round"
					pathLength={1}
					strokeDasharray={phase === "loop" ? "0.16 0.84" : "1 0"}
					style={
						phase === "loop"
							? {
									animation: `logo-trace-loader-loop ${loopDurationSeconds}s linear infinite`,
								}
							: undefined
					}
				/>
			) : null}

			{phase === "fadingFill" || phase === "done"
				? FILL_PATHS.map((path) => (
						<path
							key={path}
							d={path}
							fill="currentColor"
							style={
								phase === "fadingFill"
									? {
											opacity: 0,
											animation: `logo-trace-loader-fill ${fillFadeSeconds}s ease-out forwards`,
										}
									: undefined
							}
						/>
					))
				: null}
		</svg>
	);
}
