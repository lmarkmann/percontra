import type { Session } from "@/contract/session";
// One verification middleware sets the session on context; routes never call an auth SDK ad hoc.
// Provenance (kriasoft/react-starter-kit, mugnavo/tanstarter): README "Credits".
import type { Context, MiddlewareHandler } from "hono";
import type { RequestIdVariables } from "hono/request-id";

import { createRemoteJWKSet, errors, jwtVerify } from "jose";

import { problemResponse } from "@/contract/problem";

export type AppEnv = {
	Bindings: Pick<Env, "ASSETS" | "WORKOS_CLIENT_ID">;
	Variables: RequestIdVariables & { session?: Session };
};

// notFound/onError and early middleware returns bypass the secureHeaders
// middleware, so every error envelope carries its own nosniff; X-Request-Id
// lets clients read the id even when the body is discarded.
export function problemHeaders(requestId: string): HeadersInit {
	return {
		"X-Request-Id": requestId,
		"X-Content-Type-Options": "nosniff",
	};
}

export function authNotConfigured(c: Context<AppEnv>): Response {
	const requestId = c.get("requestId");
	return problemResponse(
		{
			status: 501,
			title: "Auth not configured",
			detail: "Set WORKOS_CLIENT_ID on the Worker to enable sessions.",
			requestId,
		},
		problemHeaders(requestId),
	);
}

// jose caches the fetched JWKS and refetches on an unknown kid, which covers
// WorkOS signing-key rotation (old and new keys are served during rotation).
const jwksByClientId = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwksFor(clientId: string) {
	let jwks = jwksByClientId.get(clientId);
	if (!jwks) {
		jwks = createRemoteJWKSet(
			new URL(`https://api.workos.com/sso/jwks/${clientId}`),
		);
		jwksByClientId.set(clientId, jwks);
	}
	return jwks;
}

/**
 * Verify an AuthKit access token; keyless, per the WorkOS docs pattern
 * (createRemoteJWKSet + jwtVerify). A custom auth domain changes the issuer.
 * `aud` is deliberately not enforced: WorkOS tokens have not always carried the
 * claim, and the per-client JWKS URL already binds a valid signature to this
 * client id. Add `audience: clientId` once your tokens verifiably carry `aud`.
 */
async function verifyWorkOsToken(
	token: string,
	clientId: string,
): Promise<Session> {
	const { payload } = await jwtVerify(token, jwksFor(clientId), {
		issuer: "https://api.workos.com",
		algorithms: ["RS256"],
		clockTolerance: "5s",
	});
	if (typeof payload.sub !== "string" || payload.sub === "") {
		throw new Error("Token carries no subject");
	}
	// No email claim exists in AuthKit access tokens; Session.email stays unset.
	return { userId: payload.sub };
}

function unauthorized(c: Context<AppEnv>): Response {
	const requestId = c.get("requestId");
	// Generic on purpose: no detail about why the token failed (no oracle).
	return problemResponse(
		{
			status: 401,
			title: "Unauthorized",
			requestId,
		},
		problemHeaders(requestId),
	);
}

export const requireSession: MiddlewareHandler<AppEnv> = async (c, next) => {
	const clientId = c.env.WORKOS_CLIENT_ID;
	if (!clientId) {
		// Fail closed: a route mounting this middleware expects real auth, so an
		// unconfigured Worker must not wave requests through. The demo fail-open
		// lives at the /api/dashboard route site, scoped to fixture data.
		return authNotConfigured(c);
	}
	const authorization = c.req.header("Authorization");
	if (!authorization?.startsWith("Bearer ")) {
		return unauthorized(c);
	}
	try {
		const token = authorization.slice("Bearer ".length);
		c.set("session", await verifyWorkOsToken(token, clientId));
	} catch (error) {
		const requestId = c.get("requestId");
		// Keep the jose taxonomy in the log (name + message), never the token.
		const cause =
			error instanceof Error
				? `${error.name}: ${error.message}`
				: String(error);
		console.error(`[request ${requestId}] token verification failed: ${cause}`);
		const bareJoseError =
			error instanceof errors.JOSEError &&
			error.constructor === errors.JOSEError;
		if (
			error instanceof errors.JWKSTimeout ||
			error instanceof TypeError ||
			bareJoseError
		) {
			// JWKS could not be fetched: an upstream outage must not read as bad
			// credentials, so answer 503 instead of the generic 401.
			return problemResponse(
				{
					status: 503,
					title: "Service Unavailable",
					detail: "Session verification is temporarily unavailable.",
					requestId,
				},
				problemHeaders(requestId),
			);
		}
		return unauthorized(c);
	}
	return next();
};
