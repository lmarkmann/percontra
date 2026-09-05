import type { Plugin } from "vite";

import { createRequire } from "node:module";
import { loadEnv } from "vite";

const require = createRequire(import.meta.url);

const OPTIONAL_SEAMS = {
	"@sentry/react": `export function init() {}
export function captureException() {}
`,
	"posthog-js": `export default {
  init() {},
  capture() {},
  identify() {},
  reset() {},
};`,
	"@workos-inc/authkit-react": `import { Fragment } from "react";
export function AuthKitProvider({ children }) {
  return children ?? null;
}
export function useAuth() {
  return {
    isLoading: false,
    user: null,
    organizationId: null,
    role: null,
    roles: null,
    permissions: [],
    featureFlags: [],
    impersonator: null,
    authenticationMethod: null,
    signIn: async () => {
      throw new Error(
        "Install @workos-inc/authkit-react (pnpm add @workos-inc/authkit-react) before enabling WorkOS.",
      );
    },
    signUp: async () => {
      throw new Error(
        "Install @workos-inc/authkit-react before enabling WorkOS.",
      );
    },
    signOut: () => {},
    getAccessToken: async () => {
      throw new Error(
        "Install @workos-inc/authkit-react before enabling WorkOS.",
      );
    },
    getUser: () => null,
    switchToOrganization: async () => {
      throw new Error(
        "Install @workos-inc/authkit-react before enabling WorkOS.",
      );
    },
    getSignInUrl: async () => "",
    getSignUpUrl: async () => "",
  };
}
export function getClaims() {
  return {};
}
`,
} as const;

// One row per seam: the env var that arms it. Env set + package missing is a misconfiguration (silent stubs would ship no-op analytics or a fake AuthKit), so the build fails loudly instead of stubbing. Env unset keeps the silent stub.
const SEAM_ENV_VARS: Record<keyof typeof OPTIONAL_SEAMS, string> = {
	"@sentry/react": "VITE_SENTRY_DSN",
	"posthog-js": "VITE_POSTHOG_KEY",
	"@workos-inc/authkit-react": "VITE_WORKOS_CLIENT_ID",
};

function isSeamPackage(source: string): source is keyof typeof OPTIONAL_SEAMS {
	return Object.hasOwn(OPTIONAL_SEAMS, source);
}

function isInstalled(id: keyof typeof OPTIONAL_SEAMS): boolean {
	try {
		require.resolve(id);
		return true;
	} catch {
		return false;
	}
}

/** Virtualize optional SDK imports when the package is not installed; fail the build when the seam's env var is set anyway. */
export function optionalSeamsPlugin(): Plugin {
	let seamEnv: Record<string, string> = {};
	return {
		name: "optional-seams",
		enforce: "pre",
		configResolved(config) {
			seamEnv = loadEnv(config.mode, config.envDir, "VITE_");
		},
		resolveId(source) {
			if (!isSeamPackage(source)) {
				return null;
			}
			const pkg = source;
			if (isInstalled(pkg)) {
				return null;
			}
			const envVar = SEAM_ENV_VARS[pkg];
			if (seamEnv[envVar]) {
				throw new Error(
					`${envVar} is set but ${pkg} is not installed. Run \`pnpm add ${pkg}\` or unset ${envVar}.`,
				);
			}
			return `\0optional-seam:${pkg}`;
		},
		load(id) {
			for (const [pkg, code] of Object.entries(OPTIONAL_SEAMS)) {
				if (id === `\0optional-seam:${pkg}`) {
					return code;
				}
			}
			return null;
		},
	};
}
