/**
 * Temporary access gate for the hosted demo.
 *
 * This is a deterrent, not a security boundary, and the distinction matters:
 * the whole SPA, this module, and every /api route are served to anyone who
 * asks. Someone who opens devtools or curls the origin is not stopped by it.
 * It exists to keep the demo out of the hands of someone who wandered onto the
 * URL, and nothing stronger. Real protection is server-side, in front of
 * Django: Cloud Run IAM, Cloudflare Access, or basic auth on the origin.
 *
 * The expected value is a SHA-256 hash rather than the code itself, so the
 * code is not a plain string sitting in the bundle for anyone who searches it.
 * That is obfuscation, not encryption: a short code is trivially brute-forced
 * against a hash you already hold. Pick something long enough that guessing it
 * is not worth the trouble.
 *
 *   printf '%s' 'the code' | shasum -a 256
 *
 * Put the result in VITE_ACCESS_CODE_SHA256. Leaving it unset disables the
 * gate entirely, which is what local development wants.
 */
import { env } from "@/env";

const STORAGE_KEY = "percontra-access";

export function isGateEnabled(): boolean {
	return Boolean(env.VITE_ACCESS_CODE_SHA256);
}

/** True once the code has been accepted in this tab. */
export function isUnlocked(): boolean {
	if (!isGateEnabled()) return true;
	try {
		return sessionStorage.getItem(STORAGE_KEY) === env.VITE_ACCESS_CODE_SHA256;
	} catch {
		// Private mode or blocked storage: fail closed and ask again.
		return false;
	}
}

async function sha256Hex(value: string): Promise<string> {
	const bytes = new TextEncoder().encode(value);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

/**
 * Check a submitted code and remember it for the tab when it matches.
 * Session storage, not local: "temporary" should behave that way.
 */
export async function submitAccessCode(code: string): Promise<boolean> {
	const expected = env.VITE_ACCESS_CODE_SHA256;
	if (!expected) return true;

	const actual = await sha256Hex(code.trim());
	if (actual !== expected.trim().toLowerCase()) return false;

	try {
		sessionStorage.setItem(STORAGE_KEY, expected);
	} catch {
		// Unlocked for this render either way; a blocked store only costs a
		// re-entry on the next navigation.
	}
	return true;
}
