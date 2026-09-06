import { useEffect, useState } from "react";

import { fetchSession, SIGN_OUT_PATH, type Session } from "@/lib/session";

/**
 * The signed-in identity and a way out of it.
 *
 * There is no login form to pair with this: Cloudflare Access authenticates
 * ahead of the Worker, so anyone who can see this header is already signed in.
 * The fallback covers every context where Access is not in front of the app,
 * which is where the label it replaces came from.
 */
export function SignedInAs({ fallback }: { fallback: string }) {
	const [session, setSession] = useState<Session | null>(null);

	useEffect(() => {
		let current = true;
		void fetchSession().then((found) => {
			if (current) setSession(found);
		});
		return () => {
			current = false;
		};
	}, []);

	if (!session) {
		return (
			<span className="text-caption text-muted-foreground">{fallback}</span>
		);
	}

	return (
		<span className="flex items-center gap-3 text-caption text-muted-foreground">
			<span className="max-w-[24ch] truncate" title={session.email}>
				{session.email}
			</span>
			<a
				href={SIGN_OUT_PATH}
				className="rounded-sm focus-ring underline underline-offset-4 hover:text-foreground"
			>
				Sign out
			</a>
		</span>
	);
}
