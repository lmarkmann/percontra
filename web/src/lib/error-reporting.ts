import { env } from "@/env";

type ErrorReportingClient = {
	captureException: (
		error: unknown,
		context?: { tags?: Record<string, string> },
	) => void;
};

let client: ErrorReportingClient | null = null;

// Error-only seam mirroring analytics.ts: @sentry/react is dynamically imported, so it stays out of the entry bundle and never loads until a DSN is set. Install with `pnpm add @sentry/react` before setting VITE_SENTRY_DSN. Tracing and session replay stay off; forks opt into more.
export async function initErrorReporting() {
	if (!env.VITE_SENTRY_DSN || client) return;
	const Sentry = await import("@sentry/react");
	Sentry.init({
		dsn: env.VITE_SENTRY_DSN,
		environment: import.meta.env.MODE,
		sendDefaultPii: false,
	});
	client = Sentry;
}

export function reportError(error: unknown, context?: { supportId?: string }) {
	if (!client) return;
	const supportId = context?.supportId;
	client.captureException(
		error,
		supportId ? { tags: { support_id: supportId } } : undefined,
	);
}
