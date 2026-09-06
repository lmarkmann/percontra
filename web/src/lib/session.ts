/**
 * Who Cloudflare Access let through, as reported by the edge Worker.
 *
 * `/api/session` is answered by `edge/proxy.ts`, never by Django, so this
 * returns null everywhere the Worker is not in front of the app: local `just
 * dev`, the Cloud Run URL, and any deployment where the Access application has
 * been removed. Null is "nobody signed in here", not an error, which is why
 * this uses `fetch` directly rather than `apiRequest`: a 404 from Django's
 * `api/<resource>` catch-all is the expected local answer, and routing it
 * through the shared client would report it to Sentry and throw.
 */
export type Session = { email: string; name: string | null };

function readSession(body: unknown): Session | null {
	if (typeof body !== "object" || body === null) return null;
	const { email, name } = body as { email?: unknown; name?: unknown };
	if (typeof email !== "string" || email === "") return null;
	return { email, name: typeof name === "string" ? name : null };
}

export async function fetchSession(): Promise<Session | null> {
	try {
		const response = await fetch("/api/session", {
			headers: { Accept: "application/json" },
		});
		if (!response.ok) return null;
		return readSession(await response.json());
	} catch {
		return null;
	}
}

/**
 * Cloudflare serves this path on every Access-protected hostname, ahead of the
 * Worker, and it clears the session cookie for this application only. The
 * org-wide equivalent is `https://<team>.cloudflareaccess.com/logout`.
 */
export const SIGN_OUT_PATH = "/cdn-cgi/access/logout";
