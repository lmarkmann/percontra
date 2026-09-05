import { env } from "@/env";

type AccessTokenGetter = () => Promise<string>;

let accessTokenGetter: AccessTokenGetter | null = null;
let markAccessTokenReady: (() => void) | null = null;
const accessTokenReady = env.VITE_WORKOS_CLIENT_ID
	? new Promise<void>((resolve) => {
			markAccessTokenReady = resolve;
		})
	: Promise.resolve();

/**
 * Called from WorkOsSessionBridge when AuthKit is mounted; mirrors
 * registerWorkOsSignOut so api-client never imports the vendor SDK.
 * Demo mode registers nothing and sends nothing.
 */
export function registerAccessTokenGetter(fn: AccessTokenGetter | null): void {
	accessTokenGetter = fn;
	if (fn && markAccessTokenReady) {
		markAccessTokenReady();
		markAccessTokenReady = null;
	}
}

export async function getRegisteredAccessToken(): Promise<string | null> {
	await accessTokenReady;
	if (!accessTokenGetter) {
		return null;
	}
	try {
		return await accessTokenGetter();
	} catch {
		// Token refresh failed; send no header and let the server answer 401.
		return null;
	}
}
