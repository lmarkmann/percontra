// percontra.dev terminates at Cloudflare and every request is forwarded to the
// single Cloud Run origin. Cloud Run routes on the Host header, which is why a
// plain DNS CNAME to the run.app hostname cannot do this job.
type Env = {
	ORIGIN: string;
	/**
	 * Shared with the origin, which rejects anything without it. Cloud Run
	 * publishes its own URL and that URL is deterministic from the service name,
	 * project number and region, so it cannot be hidden: this is what stops the
	 * Access gate in front of this Worker from being bypassable by reading one
	 * line of the repo.
	 */
	EDGE_TOKEN?: string;
};

type AccessIdentity = { email?: string; name?: string };

/**
 * Populated by Cloudflare Access on every request it authenticated.
 *
 * Not in the wrangler types this project pins, so it is declared here rather
 * than asserted at each use site. `undefined` means Access did not run, which
 * is the honest reading of "the Access application was deleted": this Worker
 * does not re-implement the gate, it reports who came through it.
 */
type AccessContext = {
	aud: string;
	getIdentity: () => Promise<AccessIdentity | null>;
};

/**
 * A service worker and an Access redirect cannot both own a navigation.
 *
 * The app's worker answers navigations with `respondWith(fetch(request))`,
 * which swallows the login redirect: the page goes blank and can never send
 * anyone to the sign-in page. It cannot self-heal either, because fetching a
 * corrected worker needs the very session the worker is preventing anyone from
 * obtaining.
 *
 * So this is served in place of the app's own `/sw.js`: any browser still
 * holding the old registration picks it up, tears itself down, and reloads into
 * a normal navigation.
 */
const KILL_SWITCH_WORKER = `self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			const keys = await caches.keys();
			await Promise.all(keys.map((key) => caches.delete(key)));
			await self.registration.unregister();
			const windows = await self.clients.matchAll({ type: "window" });
			for (const client of windows) client.navigate(client.url);
		})(),
	);
});
`;

function json(body: unknown): Response {
	return new Response(JSON.stringify(body), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store",
		},
	});
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const access = (ctx as ExecutionContext & { access?: AccessContext }).access;
		const identity = access ? await access.getIdentity() : null;

		if (url.pathname === "/sw.js") {
			return new Response(KILL_SWITCH_WORKER, {
				headers: {
					"Content-Type": "text/javascript; charset=utf-8",
					"Cache-Control": "no-store",
				},
			});
		}

		// Answered here rather than proxied: Django knows nothing about Access,
		// and the identity is already in hand. Django's `api/<resource>` catch-all
		// would otherwise take this path.
		if (url.pathname === "/api/session") {
			return json({
				email: identity?.email ?? null,
				name: identity?.name ?? null,
			});
		}

		const requestedHost = url.host;
		const origin = new URL(env.ORIGIN);
		url.protocol = origin.protocol;
		url.host = origin.host;
		const upstream = new Request(url, request);
		upstream.headers.set("X-Forwarded-Host", requestedHost);
		upstream.headers.set("X-Forwarded-Proto", "https");
		// Cloud Run inspects Authorization for its own IAM, and the Access cookie
		// is for the edge, not the origin. Neither belongs upstream.
		upstream.headers.delete("Authorization");
		// Deleted before it is set, not only when there is nobody to set it to:
		// `new Request(url, request)` carries the caller's headers over, so a
		// client that sends this header itself would otherwise have it forwarded
		// verbatim whenever Access did not run. The origin must be able to read
		// this as "the edge verified this", or it is worth nothing.
		upstream.headers.delete("X-Access-Email");
		if (identity?.email) upstream.headers.set("X-Access-Email", identity.email);
		if (env.EDGE_TOKEN) upstream.headers.set("X-Edge-Auth", env.EDGE_TOKEN);
		return fetch(upstream);
	},
};
