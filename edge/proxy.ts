// percontra.dev terminates at Cloudflare and every request is forwarded to the
// single Cloud Run origin. Cloud Run routes on the Host header, which is why a
// plain DNS CNAME to the run.app hostname cannot do this job.
type Env = {
	ORIGIN: string;
	/**
	 * Set both to close the site. Leaving BOTH unset passes every request
	 * through, which is the deliberate default. Setting one and leaving the
	 * other blank is a misconfiguration and closes the site instead of opening
	 * it, for the reason in `gateState` below.
	 */
	ACCESS_USER?: string;
	ACCESS_PASSWORD?: string;
	/**
	 * Shared with the origin, which rejects anything without it. Cloud Run
	 * publishes its own URL and that URL is deterministic from the service name,
	 * project number and region, so it cannot be hidden: this is what stops the
	 * gate above from being bypassable by reading one line of the repo.
	 */
	EDGE_TOKEN?: string;
};

type GateState =
	| { tag: "open" }
	| { tag: "misconfigured"; missing: string }
	| { tag: "closed"; user: string; password: string };

/**
 * Compare without leaking length or position through timing.
 *
 * Not paranoia about a hackathon demo: it costs four lines and the alternative
 * teaches the wrong reflex. Length is compared first because the loop below
 * cannot run over mismatched lengths, and length alone is not the secret.
 */
function matches(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let difference = 0;
	for (let index = 0; index < a.length; index += 1) {
		difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
	}
	return difference === 0;
}

/**
 * A partially configured gate fails closed.
 *
 * This is not hypothetical. `op read ... | wrangler secret put` uploads an
 * empty string when the op lookup fails, and wrangler reports success either
 * way, so the site went live with a blank password. The previous version read
 * that as "no gate configured" and served everything. Absence and blankness
 * mean different things: nobody sets a secret to "" on purpose, so a blank one
 * means somebody meant to close the site and the pipeline ate the value.
 */
function gateState(env: Env): GateState {
	const user = env.ACCESS_USER;
	const password = env.ACCESS_PASSWORD;
	if (user === undefined && password === undefined) return { tag: "open" };

	const cleanUser = user?.trim() ?? "";
	const cleanPassword = password?.trim() ?? "";
	if (cleanUser === "" || cleanPassword === "") {
		return {
			tag: "misconfigured",
			missing: cleanUser === "" ? "ACCESS_USER" : "ACCESS_PASSWORD",
		};
	}
	return { tag: "closed", user: cleanUser, password: cleanPassword };
}

function authorized(request: Request, user: string, password: string): boolean {
	const header = request.headers.get("Authorization");
	if (!header?.startsWith("Basic ")) return false;

	let decoded: string;
	try {
		decoded = atob(header.slice("Basic ".length));
	} catch {
		return false;
	}

	// Only the first colon separates the pair; a password may contain more.
	const separator = decoded.indexOf(":");
	if (separator === -1) return false;

	return (
		matches(decoded.slice(0, separator), user) &&
		matches(decoded.slice(separator + 1), password)
	);
}

/**
 * A service worker and HTTP basic auth cannot both own a navigation.
 *
 * The app's worker answers navigations with `respondWith(fetch(request))`. A
 * 401 is a successful fetch, not a network error, so it is passed straight back
 * to the page; and a response delivered through `respondWith` never raises the
 * browser's auth dialog. The result is a blank page that can never prompt, and
 * it cannot self-heal, because fetching a corrected worker needs the very
 * credentials the worker is preventing anyone from entering.
 *
 * So this is served ahead of the gate, unauthenticated: any browser still
 * holding the old registration picks it up, tears itself down, and reloads into
 * a normal gated navigation. It carries no content, so serving it to an
 * unauthenticated client gives nothing away.
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

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// Ahead of the gate on purpose; see KILL_SWITCH_WORKER.
		if (new URL(request.url).pathname === "/sw.js") {
			return new Response(KILL_SWITCH_WORKER, {
				headers: {
					"Content-Type": "text/javascript; charset=utf-8",
					"Cache-Control": "no-store",
				},
			});
		}

		// The gate sits in front of the proxy, not behind it: an unauthorized
		// request never reaches Cloud Run, so neither the SPA bundle nor /api is
		// served to it. That is the difference between this and the in-app gate,
		// which can only hide a page whose code it has already handed over.
		const gate = gateState(env);

		if (gate.tag === "misconfigured") {
			return new Response(
				`Closed: ${gate.missing} is set but empty. Re-upload it, then redeploy.\n`,
				{
					status: 503,
					headers: {
						"Cache-Control": "no-store",
						"X-Robots-Tag": "noindex, nofollow",
					},
				},
			);
		}

		if (gate.tag === "closed" && !authorized(request, gate.user, gate.password)) {
			return new Response("Not open yet.", {
				status: 401,
				headers: {
					"WWW-Authenticate": 'Basic realm="Per Contra", charset="UTF-8"',
					"Cache-Control": "no-store",
					// A closed site must never be indexed, even at the 401.
					"X-Robots-Tag": "noindex, nofollow",
				},
			});
		}

		const url = new URL(request.url);
		const requestedHost = url.host;
		const origin = new URL(env.ORIGIN);
		url.protocol = origin.protocol;
		url.host = origin.host;
		const upstream = new Request(url, request);
		upstream.headers.set("X-Forwarded-Host", requestedHost);
		upstream.headers.set("X-Forwarded-Proto", "https");
		// Never forward the browser's credentials for our own gate: they are for
		// this Worker, the origin has no use for them, and Cloud Run inspects
		// Authorization for its own IAM.
		upstream.headers.delete("Authorization");
		if (env.EDGE_TOKEN) upstream.headers.set("X-Edge-Auth", env.EDGE_TOKEN);
		return fetch(upstream);
	},
};
