// percontra.dev terminates at Cloudflare and every request is forwarded to the
// single Cloud Run origin. Cloud Run routes on the Host header, which is why a
// plain DNS CNAME to the run.app hostname cannot do this job.
type Env = {
	ORIGIN: string;
};

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
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
