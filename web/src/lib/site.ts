/**
 * Public site identity for SEO, social, and JSON-LD.
 * Forks: change `name` / `tagline` / `description` when product copy exists.
 * Absolute URLs come from `VITE_APP_URL` (see `getSiteOrigin`).
 */
import { env } from "@/env";

export const site = {
	name: "Per Contra",
	tagline: "Every posting shows its work.",
	description:
		"A sign-off workbench for fund migrations: every posting carries its source rows, the decisions it depends on, and whether it may leave.",
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
