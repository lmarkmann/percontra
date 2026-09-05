// Adapted from kriasoft/react-starter-kit apps/api/worker.ts + apps/api/lib/app.ts (MIT), https://github.com/kriasoft/react-starter-kit, checked 2026-07-10.
import { Hono, type MiddlewareHandler } from "hono";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";

import {
	dashboardErrorMessage,
	parseDashboardView,
} from "@/contract/dashboard";
import { demoDashboardData } from "@/contract/dashboard-fixtures";
import { problemResponse } from "@/contract/problem";

import {
	type AppEnv,
	authNotConfigured,
	problemHeaders,
	requireSession,
} from "./auth";

const app = new Hono<AppEnv>();

app.use(requestId());
// Static assets get public/_headers; API responses get theirs here.
app.use("/api/*", secureHeaders());
app.use("/api/session", async (c, next) => {
	await next();
	c.header("Cache-Control", "no-store");
});

// CSRF backstop for same-origin cookie auth (the donors' trustedOrigins
// translated): mutations must prove their provenance, so a cross-origin Origin
// is rejected and so is a request carrying neither Origin nor Referer.
// SameSite cookies remain the primary defense; this catches the leftovers.
app.use("/api/*", async (c, next) => {
	const method = c.req.method;
	if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
		return next();
	}
	const origin = c.req.header("Origin");
	const referer = c.req.header("Referer");
	const id = c.get("requestId");
	if (origin === undefined && referer === undefined) {
		return problemResponse(
			{
				status: 403,
				title: "Forbidden",
				detail: "Mutations must carry an Origin or Referer header.",
				requestId: id,
			},
			problemHeaders(id),
		);
	}
	let sourceOrigin: string | null = null;
	try {
		sourceOrigin = new URL(origin ?? referer!).origin;
	} catch {
		// Invalid provenance is treated as cross-origin below.
	}
	if (sourceOrigin !== new URL(c.req.url).origin) {
		return problemResponse(
			{
				status: 403,
				title: "Forbidden",
				detail: "Cross-origin request rejected.",
				requestId: id,
			},
			problemHeaders(id),
		);
	}
	return next();
});

app.get("/api/session", requireSession, (c) => {
	const session = c.get("session");
	if (!session) {
		// Unreachable now that requireSession fails closed; kept as the typed guard.
		return authNotConfigured(c);
	}
	return c.json(session);
});

// Fail-open scoped to fixture data: without WORKOS_CLIENT_ID this route serves
// only the demo fixtures below, so the zero-config template keeps a working
// dashboard. Routes serving real data mount requireSession unconditionally.
const requireSessionForRealAuth: MiddlewareHandler<AppEnv> = (c, next) =>
	c.env.WORKOS_CLIENT_ID ? requireSession(c, next) : next();

app.get("/api/dashboard", requireSessionForRealAuth, (c) => {
	const view = parseDashboardView(c.req.query("view"));
	if (view === "error") {
		// Real 500 so the client exercises its transport-error path and supportId display.
		const id = c.get("requestId");
		return problemResponse(
			{
				status: 500,
				title: "Internal Server Error",
				detail: dashboardErrorMessage,
				requestId: id,
			},
			problemHeaders(id),
		);
	}
	return c.json(demoDashboardData(view, c.get("requestId")));
});

app.notFound((c) => {
	if (!c.req.path.startsWith("/api")) {
		// Cloudflare applies the SPA asset fallback only to Sec-Fetch-Mode:
		// navigate requests; everything else (curl, bots, programmatic fetches to
		// deep links) lands here, so proxy it to the assets binding, which serves
		// index.html per not_found_handling.
		return c.env.ASSETS.fetch(c.req.raw);
	}
	const id = c.get("requestId");
	return problemResponse(
		{
			status: 404,
			title: "Not Found",
			detail: "This endpoint does not exist.",
			requestId: id,
		},
		problemHeaders(id),
	);
});

app.onError((error, c) => {
	const id = c.get("requestId");
	console.error(`[request ${id}]`, error);
	return problemResponse(
		{
			status: 500,
			title: "Internal Server Error",
			detail: "Unexpected server error. Quote the request id when reporting.",
			requestId: id,
		},
		problemHeaders(id),
	);
});

export default app;
