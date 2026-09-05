// percontra.dev terminates at Cloudflare and every request is forwarded to the
// single Cloud Run origin. Cloud Run routes on the Host header, which is why a
// plain DNS CNAME to the run.app hostname cannot do this job.
type Env = {
	ORIGIN: string;
	/** Set both to close the site; leaving either unset passes every request through. */
	ACCESS_USER?: string;
	ACCESS_PASSWORD?: string;
};

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

function authorized(request: Request, env: Env): boolean {
	const { ACCESS_USER, ACCESS_PASSWORD } = env;
	if (!ACCESS_USER || !ACCESS_PASSWORD) return true;

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
		matches(decoded.slice(0, separator), ACCESS_USER) &&
		matches(decoded.slice(separator + 1), ACCESS_PASSWORD)
	);
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// The gate sits in front of the proxy, not behind it: an unauthorized
		// request never reaches Cloud Run, so neither the SPA bundle nor /api is
		// served to it. That is the difference between this and the in-app gate,
		// which can only hide a page whose code it has already handed over.
		if (!authorized(request, env)) {
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
		return fetch(upstream);
	},
};
