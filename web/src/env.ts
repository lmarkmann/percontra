import { createEnv } from "@t3-oss/env-core";
import * as z from "zod/mini";

// Single validated, typed surface for build-time env. Every var is optional so a fresh clone builds and runs with none set; the analytics and auth modules stay inert until their keys appear. Fill values in .env.local (gitignored), documented in docs/reference/env.md. Client vars must be VITE_-prefixed to reach the browser bundle.
export const env = createEnv({
	clientPrefix: "VITE_",
	client: {
		VITE_POSTHOG_KEY: z.optional(z.string()),
		VITE_POSTHOG_HOST: z.optional(z.url()),
		/** WorkOS Client ID (`client_...`). Enables AuthKit SPA seam. */
		VITE_WORKOS_CLIENT_ID: z.optional(z.string()),
		/** Must match a Redirect URI in the WorkOS Dashboard exactly. AuthKit React handles the OAuth return client-side (no server callback). Typical local value: `http://localhost:5173` */
		VITE_WORKOS_REDIRECT_URI: z.optional(z.url()),
		/** Custom Authentication API hostname (e.g. auth.example.com). */
		VITE_WORKOS_API_HOSTNAME: z.optional(z.string()),
		/** Sentry DSN. Requires `pnpm add @sentry/react`; error reporting stays inert without it. */
		VITE_SENTRY_DSN: z.optional(z.url()),
		/** Public origin for absolute OG/Twitter image URLs (no trailing slash). */
		VITE_APP_URL: z.optional(z.url()),
		/** When set, api-client + session/dashboard use this origin (cookie credentials). */
		VITE_API_BASE_URL: z.optional(z.url()),
	},
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
});
