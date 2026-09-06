import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchSession, SIGN_OUT_PATH, type Session } from "@/lib/session";
import { cn } from "@/lib/utils";

/**
 * The signed-in identity as the sidebar's user space.
 *
 * There is no login form to pair with this: Cloudflare Access authenticates
 * ahead of the Worker, so anyone who can see the app is already signed in.
 * Without Access in front of the app there is no identity to show, so this
 * renders nothing unless a caller supplies a fallback label.
 *
 * Access's identity carries the IdP display name in `name`; when the IdP did
 * not supply one the email stands in. When the rail collapses, only the avatar
 * persists on the lower-left bar; the name and the sign-out link leave the
 * footer so the collapsed rail stays just the user icon.
 */
export function SignedInAs({
	collapsed = false,
	fallback,
}: {
	collapsed?: boolean;
	fallback?: string;
}) {
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
		if (!fallback) return null;
		return (
			<span className="text-caption text-muted-foreground">{fallback}</span>
		);
	}

	const label = session.name ?? session.email;

	return (
		<div
			className={cn(
				"flex items-center gap-2.5 text-caption text-sidebar-foreground/70",
				!collapsed && "w-full px-2",
			)}
		>
			<Avatar>
				{/* Collapsed it is the whole identity, so it is exposed as the named image. */}
				<AvatarFallback
					role={collapsed ? "img" : undefined}
					aria-label={collapsed ? label : undefined}
				>
					<UserRound className="size-5" aria-hidden />
				</AvatarFallback>
			</Avatar>
			{!collapsed && (
				<span className="flex min-w-0 flex-1 items-center justify-between gap-2">
					<span className="truncate" title={label}>
						{label}
					</span>
					<a
						href={SIGN_OUT_PATH}
						className="rounded-sm focus-ring underline underline-offset-4 hover:text-foreground"
					>
						Sign out
					</a>
				</span>
			)}
		</div>
	);
}
