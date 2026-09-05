/** Optional SDKs: install when wiring the seam (`pnpm add <package>`). */
declare module "@sentry/react" {
	export function init(options: {
		dsn: string;
		environment?: string;
		sendDefaultPii?: boolean;
	}): void;

	export function captureException(
		error: unknown,
		context?: { tags?: Record<string, string> },
	): void;
}

declare module "posthog-js" {
	interface PostHogClient {
		init(key: string, options: Record<string, unknown>): void;
		capture(event: string, properties?: Record<string, unknown>): void;
		identify(id: string, properties?: Record<string, unknown>): void;
		reset(): void;
	}

	const posthog: PostHogClient;
	export default posthog;
}
