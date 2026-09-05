/** Optional SDKs: install when wiring the seam (`pnpm add <package>`). */
declare module "@workos-inc/authkit-react" {
	import type { ReactNode } from "react";

	export type User = {
		id: string;
		email: string;
		emailVerified: boolean;
		profilePictureUrl: string | null;
		firstName: string | null;
		lastName: string | null;
		createdAt: string;
		updatedAt: string;
		lastSignInAt: string | null;
		externalId: string | undefined;
	};

	export function AuthKitProvider(props: {
		clientId: string;
		apiHostname?: string;
		devMode?: boolean;
		onRedirectCallback?: (params: { state?: unknown }) => void;
		onRefresh?: (response: unknown) => void;
		onRefreshFailure?: (args: { signIn: () => Promise<void> }) => void;
		onBeforeAutoRefresh?: () => boolean;
		refreshBufferInterval?: number;
		children?: ReactNode;
	}): React.JSX.Element;

	export function useAuth(): {
		isLoading: boolean;
		user: User | null;
		organizationId: string | null;
		role: string | null;
		roles: string[] | null;
		permissions: string[];
		featureFlags: string[];
		impersonator: unknown;
		authenticationMethod: string | null;
		signIn: (opts?: {
			state?: unknown;
			organizationId?: string;
			loginHint?: string;
			invitationToken?: string;
			screenHint?: "sign-in" | "sign-up";
		}) => Promise<void>;
		signUp: (opts?: {
			state?: unknown;
			organizationId?: string;
			loginHint?: string;
			invitationToken?: string;
		}) => Promise<void>;
		signOut: (opts?: { returnTo?: string }) => void;
		getAccessToken: (opts?: unknown) => Promise<string>;
		getUser: () => User | null;
		switchToOrganization: (opts: {
			organizationId: string;
			signInOpts?: unknown;
		}) => Promise<void>;
		getSignInUrl: (opts?: unknown) => Promise<string>;
		getSignUpUrl: (opts?: unknown) => Promise<string>;
	};

	export function getClaims(accessToken: string): Record<string, unknown>;
}

declare module "@sentry/react" {
	export function init(options: {
		dsn: string;
		environment?: string;
		sendDefaultPii?: boolean;
	}): void;

	export function captureException(
		error: unknown,
		context?: { tags?: Record<string, string> },
	): void;
}

declare module "posthog-js" {
	interface PostHogClient {
		init(key: string, options: Record<string, unknown>): void;
		capture(event: string, properties?: Record<string, unknown>): void;
		identify(id: string, properties?: Record<string, unknown>): void;
		reset(): void;
	}

	const posthog: PostHogClient;
	export default posthog;
}
