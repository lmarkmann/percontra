import { env } from "@/env";

type AnalyticsClient = {
	capture: (event: string, properties?: Record<string, unknown>) => void;
	identify: (id: string, properties?: Record<string, unknown>) => void;
	reset: () => void;
};

let client: AnalyticsClient | null = null;

// Cookieless by design: persistence "memory" holds state in RAM only, no cookies and no localStorage, so the site needs no consent banner (same stance as Cloudflare Web Analytics). The tradeoff is no cross-session identity for anonymous visitors; identified users are still tracked via identify() after sign-in. posthog-js is dynamically imported, so it stays out of the entry bundle and never loads until a key is set. Install with `pnpm add posthog-js` before setting VITE_POSTHOG_KEY. EU host by default for data residency; override with VITE_POSTHOG_HOST.
export async function initAnalytics() {
	if (!env.VITE_POSTHOG_KEY || client) return;
	const { default: posthog } = await import("posthog-js");
	posthog.init(env.VITE_POSTHOG_KEY, {
		api_host: env.VITE_POSTHOG_HOST ?? "https://eu.i.posthog.com",
		persistence: "memory",
		person_profiles: "identified_only",
		capture_pageview: true,
		disable_session_recording: true,
	});
	client = posthog;
}

/** @public - event capture for app code built on the template. */
export function capture(event: string, properties?: Record<string, unknown>) {
	client?.capture(event, properties);
}

export function identify(id: string, properties?: Record<string, unknown>) {
	client?.identify(id, properties);
}

export function reset() {
	client?.reset();
}
