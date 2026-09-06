import { createEnv } from "@t3-oss/env-core";
import * as z from "zod/mini";

// Single validated, typed surface for build-time env. Every var is optional so a fresh clone builds and runs with none set; the analytics and error-reporting modules stay inert until their keys appear. Fill values in .env.local (gitignored), documented in docs/reference/env.md. Client vars must be VITE_-prefixed to reach the browser bundle.
export const env = createEnv({
	clientPrefix: "VITE_",
	client: {
		VITE_POSTHOG_KEY: z.optional(z.string()),
		VITE_POSTHOG_HOST: z.optional(z.url()),
		/** Sentry DSN. Requires `pnpm add @sentry/react`; error reporting stays inert without it. */
		VITE_SENTRY_DSN: z.optional(z.url()),
		/** Public origin for absolute OG/Twitter image URLs (no trailing slash). */
		VITE_APP_URL: z.optional(z.url()),
		/** Overrides the same-origin default when the API is deployed apart from the SPA. */
		VITE_API_BASE_URL: z.optional(z.url()),
		/** Origin of the Piper bridge API (Xero/Zoho OAuth + migration). Unset hides the bridge's live controls. */
		VITE_PIPER_API_URL: z.optional(z.url()),
	},
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
});
