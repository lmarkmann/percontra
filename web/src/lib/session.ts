import { sessionSchema, type Session } from "@/contract/session";

const DEMO_SESSION_KEY = "demo-session";

/**
 * Client-side session seam for `requireAuth` / TanStack `beforeLoad`
 * (runs outside React).
 *
 * Dual-mode (see `session-api.ts` `resolveSession`):
 * - No `VITE_API_BASE_URL`: demo `localStorage` via `getSession` /
 *   `setDemoSession` / `clearDemoSession`.
 * - With base URL: GET `/api/session` (cookie credentials) through the shared
 *   api-client; this module stays the demo store + WorkOS mirror.
 *
 * WorkOS AuthKit is the wired real-auth path. The Worker verifies access tokens
 * against WorkOS JWKS in one server-side middleware, while the optional client
 * provider mirrors the live session here for route guards. Without WorkOS
 * configuration, localStorage remains the zero-config demo session.
 *
 * Client route guards are UX only; real protection validates the session
 * server-side.
 */
export function getSession(): Session | null {
	if (typeof localStorage === "undefined") {
		return null;
	}
	const raw = localStorage.getItem(DEMO_SESSION_KEY);
	if (!raw) {
		return null;
	}
	try {
		const parsed = sessionSchema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

export function setDemoSession(session: Session): void {
	localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
}

/**
 * Mirror a live identity-provider session into the same localStorage key
 * `getSession` reads. Used by optional WorkOS bridge (or Better Auth client)
 * so route guards stay provider-agnostic.
 */
export function setLiveSession(session: Session | null): void {
	if (session == null) {
		clearDemoSession();
		return;
	}
	setDemoSession(session);
}

export function clearDemoSession(): void {
	localStorage.removeItem(DEMO_SESSION_KEY);
}
