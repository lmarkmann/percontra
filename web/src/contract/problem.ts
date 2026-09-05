/**
 * RFC 9457 Problem Details (application/problem+json).
 * Server responses should use these fields; the client normalizes unknowns.
 */
export type ApiProblemBody = {
	type?: string;
	title?: string;
	status: number;
	detail?: string;
	request_id?: string;
};

export function problemBody(init: {
	status: number;
	title?: string;
	detail?: string;
	requestId?: string;
	type?: string;
}): ApiProblemBody {
	return {
		type: init.type,
		title: init.title,
		status: init.status,
		detail: init.detail,
		request_id: init.requestId,
	};
}

/**
 * The one problem+json Response builder; Worker routes and MSW handlers share
 * it so the envelope (and its media type) exists exactly once. Pure web
 * standards only: identical under workerd, browsers, and happy-dom.
 */
export function problemResponse(
	init: Parameters<typeof problemBody>[0],
	headers?: HeadersInit,
): Response {
	const responseHeaders = new Headers(headers);
	responseHeaders.set("Content-Type", "application/problem+json");
	return new Response(JSON.stringify(problemBody(init)), {
		status: init.status,
		headers: responseHeaders,
	});
}
