/* oxlint-disable react/hooks -- useAuth arrives from the dynamically imported AuthKit SDK, so it is passed as a value and called through a prop; that indirection is the optional-SDK seam itself */
import type { ReactNode } from "react";

import { useEffect } from "react";

import { env } from "@/env";
import { identify, reset as resetAnalytics } from "@/lib/analytics";
import { registerAccessTokenGetter } from "@/lib/api-auth";
import { authReturnFromState } from "@/lib/auth-return";
import { setLiveSession } from "@/lib/session";
import { registerWorkOsSignOut } from "@/lib/sign-out";
import { router } from "@/router";

type AuthKitModule = typeof import("@workos-inc/authkit-react");
let authKitModule: AuthKitModule | null = null;
const authKitReady = env.VITE_WORKOS_CLIENT_ID
	? import("@workos-inc/authkit-react").then((module) => {
			authKitModule = module;
		})
	: Promise.resolve();

export async function ensureAuthProviderReady(): Promise<void> {
	await authKitReady;
}

/**
 * WorkOS AuthKit (SPA), env-gated. Without `VITE_WORKOS_CLIENT_ID` this is a
 * passthrough. The optional SDK loads before React mounts so the router subtree
 * is born under one stable provider hierarchy.
 *
 * Per AuthKit React README:
 * - No server callback route; SDK handles OAuth client-side
 * - Redirect URI is configured in the WorkOS Dashboard (must match exactly)
 * - `/login` is the Dashboard **sign-in endpoint** (auto-starts OAuth there)
 */
export function AuthProvider({ children }: { children: ReactNode }) {
	if (!env.VITE_WORKOS_CLIENT_ID) return <>{children}</>;
	if (!authKitModule) {
		throw new Error("AuthProvider rendered before AuthKit was ready");
	}

	const { AuthKitProvider, useAuth } = authKitModule;

	return (
		<AuthKitProvider
			clientId={env.VITE_WORKOS_CLIENT_ID}
			{...(env.VITE_WORKOS_API_HOSTNAME
				? { apiHostname: env.VITE_WORKOS_API_HOSTNAME }
				: {})}
			onRedirectCallback={({ state }) => {
				router.history.replace(authReturnFromState(state));
			}}
			onRefreshFailure={({ signIn }: { signIn: () => Promise<void> }) => {
				void signIn();
			}}
		>
			<WorkOsSessionBridge useAuth={useAuth}>{children}</WorkOsSessionBridge>
		</AuthKitProvider>
	);
}

function WorkOsSessionBridge({
	children,
	useAuth,
}: {
	children: ReactNode;
	useAuth: AuthKitModule["useAuth"];
}) {
	const auth = useAuth() as {
		user?: { id: string; email?: string | null } | null;
		isLoading?: boolean;
		signOut?: (opts?: { returnTo?: string }) => void;
		getAccessToken?: () => Promise<string>;
	};
	const { user, isLoading = false, signOut, getAccessToken } = auth;

	useEffect(() => {
		if (signOut) {
			registerWorkOsSignOut(signOut);
			return () => {
				registerWorkOsSignOut(null);
			};
		}
		return undefined;
	}, [signOut]);

	useEffect(() => {
		if (!getAccessToken) {
			return undefined;
		}
		// AuthKit returns a fresh token and handles refresh internally; api-client
		// attaches it as Authorization: Bearer via the api-auth seam.
		registerAccessTokenGetter(() => getAccessToken());
		return () => {
			registerAccessTokenGetter(null);
		};
	}, [getAccessToken]);

	useEffect(() => {
		if (isLoading) {
			return;
		}
		if (user) {
			setLiveSession({
				userId: user.id,
				email: user.email ?? undefined,
			});
			identify(user.id, user.email ? { email: user.email } : undefined);
			return;
		}
		setLiveSession(null);
		resetAnalytics();
	}, [user, isLoading]);

	return <>{children}</>;
}
