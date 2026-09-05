import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * Moves focus to the main landmark on client navigation so keyboard and
 * screen-reader users land in the new page instead of the top of the tab order.
 * Subscribing after mount skips the initial load, and the pathname guard means
 * search-only navigations (dashboard view/debug) don't steal focus. The focus is
 * deferred a frame so the new route's #main is committed first. Every route's
 * #main is already tabIndex={-1} + outline-none.
 */
export function RouteFocus() {
	const router = useRouter();

	useEffect(() => {
		let lastPath = router.state.location.pathname;
		return router.subscribe("onResolved", () => {
			const nextPath = router.state.location.pathname;
			if (nextPath === lastPath) {
				return;
			}
			lastPath = nextPath;
			requestAnimationFrame(() => {
				document.getElementById("main")?.focus();
			});
		});
	}, [router]);

	return null;
}
