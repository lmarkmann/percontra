import { useEffect, useRef, useState } from "react";

/**
 * Skeleton anti-flash, one pattern with two halves: show only after `delayMs`
 * so fast responses never see it, and once shown keep it for `minVisibleMs`
 * so a response landing just past the delay does not flash it off again.
 */
export function useDelayedShow(
	active: boolean,
	delayMs = 200,
	minVisibleMs = 400,
): boolean {
	const [show, setShow] = useState(false);
	const shownAt = useRef<number | null>(null);

	useEffect(() => {
		if (active) {
			const timer = setTimeout(() => {
				shownAt.current = Date.now();
				setShow(true);
			}, delayMs);
			return () => clearTimeout(timer);
		}
		if (shownAt.current === null) {
			setShow(false);
			return undefined;
		}
		const remaining = minVisibleMs - (Date.now() - shownAt.current);
		if (remaining <= 0) {
			shownAt.current = null;
			setShow(false);
			return undefined;
		}
		const timer = setTimeout(() => {
			shownAt.current = null;
			setShow(false);
		}, remaining);
		return () => clearTimeout(timer);
	}, [active, delayMs, minVisibleMs]);

	return show;
}
