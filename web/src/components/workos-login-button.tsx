import { useAuth } from "@workos-inc/authkit-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { actionClass } from "@/lib/action-class";
import { createSupportId } from "@/lib/support-id";

/**
 * Enterprise SSO entry (WorkOS AuthKit SPA).
 *
 * AuthKit React README: register `/login` as the Dashboard **sign-in endpoint**
 * and start OAuth from that path (impersonation and third-party login kicks).
 * We auto-start `signIn()` once on mount, and keep an explicit button if the
 * redirect was blocked or the user needs to retry.
 */
export function WorkOsLoginButton({
	onError,
	returnTo,
}: {
	onError: (supportId: string) => void;
	returnTo: string;
}) {
	const { signIn, isLoading, user } = useAuth();
	const [submitting, setSubmitting] = useState(false);
	const autoStarted = useRef(false);

	useEffect(() => {
		if (autoStarted.current || isLoading || user) {
			return;
		}
		autoStarted.current = true;
		void signIn({ state: { returnTo } }).catch(() => {
			onError(createSupportId());
		});
	}, [isLoading, user, signIn, onError, returnTo]);

	async function handleWorkOsSignIn() {
		setSubmitting(true);
		try {
			await signIn({ state: { returnTo } });
		} catch {
			onError(createSupportId());
		} finally {
			setSubmitting(false);
		}
	}

	const busy = submitting || isLoading;

	return (
		<div className="flex max-w-md flex-col gap-3">
			<p className="text-label text-muted-foreground">
				{"Opening WorkOS AuthKit\u2026"}
			</p>
			<Button
				type="button"
				className={actionClass("w-fit")}
				disabled={busy}
				data-testid="login-workos"
				onClick={() => void handleWorkOsSignIn()}
			>
				{busy ? "Signing in\u2026" : "Continue with WorkOS"}
			</Button>
		</div>
	);
}
