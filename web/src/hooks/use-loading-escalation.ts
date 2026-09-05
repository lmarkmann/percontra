import { useEffect, useState } from "react";

import { useDelayedShow } from "@/hooks/use-delayed-show";

type Options = {
	delayMs?: number;
	minVisibleMs?: number;
	slowMs?: number;
};

/** Skeleton after ~200ms, held >=400ms once shown; slow message after 5s. */
export function useLoadingEscalation(active: boolean, options?: Options) {
	const showSkeleton = useDelayedShow(
		active,
		options?.delayMs ?? 200,
		options?.minVisibleMs ?? 400,
	);
	const [isSlow, setIsSlow] = useState(false);

	useEffect(() => {
		if (!active) {
			// oxlint-disable-next-line react/set-state-in-effect -- clears the escalation the same place the timer that set it is torn down
			setIsSlow(false);
			return undefined;
		}
		const timer = setTimeout(() => setIsSlow(true), options?.slowMs ?? 5000);
		return () => clearTimeout(timer);
	}, [active, options?.slowMs]);

	return { showSkeleton, isSlow };
}
