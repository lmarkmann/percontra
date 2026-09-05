/**
 * Public site identity for SEO, social, and JSON-LD.
 * Forks: change `name` / `tagline` / `description` when product copy exists.
 * Absolute URLs come from `VITE_APP_URL` (see `getSiteOrigin`).
 */
import { env } from "@/env";

export const site = {
	name: "vite-template",
	tagline: "Start design-forward. Stay lean.",
	description:
		"Vite template with React, Tailwind v4, shadcn Base UI, and a design-system showcase.",
	defaultOgImage: "/og-image.svg",
	/** Public logo path for Organization JSON-LD when origin is set. */
	logoPath: "/favicon.svg",
} as const;

/** Origin without trailing slash, or undefined when `VITE_APP_URL` is unset. */
export function getSiteOrigin(
	appUrl: string | undefined = env.VITE_APP_URL,
): string | undefined {
	if (!appUrl) return undefined;
	return appUrl.replace(/\/$/, "");
}
