// Structural gating pattern from satnaing/shadcn-admin src/routes/_authenticated/route.tsx (MIT, e16c87f, checked 2026-07-10), adapted to requireAuth and this router context.
// Pathless layout: protection is a property of where a route file lives. New
// protected pages drop into _authenticated/ and inherit the gate; URLs are unaffected.
import { createFileRoute } from "@tanstack/react-router";

import { requireAuth } from "@/lib/require-auth";

// No component: TanStack renders <Outlet /> by default for layout routes.
export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ context, location }) =>
		requireAuth(context.queryClient, location.href),
});
