import { LogOut, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
 * not supply one the email stands in. The avatar opens a menu holding the
 * identity and the sign-out link. When the rail collapses, only the avatar
 * persists on the lower-left bar; the name leaves so the collapsed rail stays
 * just the user icon.
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
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label={collapsed ? `${label}, account menu` : "Account menu"}
				className={cn(
					"flex items-center gap-2.5 rounded-md focus-ring text-caption text-sidebar-foreground/70 hover:text-sidebar-foreground data-popup-open:text-sidebar-foreground",
					!collapsed && "w-full px-2 py-1",
				)}
			>
				<Avatar>
					<AvatarFallback>
						<UserRound className="size-5" aria-hidden />
					</AvatarFallback>
				</Avatar>
				{!collapsed && (
					<span className="min-w-0 flex-1 truncate text-left" title={label}>
						{label}
					</span>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent side="top" align="start" className="w-56">
				<DropdownMenuGroup>
					<DropdownMenuLabel className="text-caption font-medium text-foreground">
						<span className="block truncate">{label}</span>
						{session.name && (
							<span className="block truncate font-normal text-muted-foreground">
								{session.email}
							</span>
						)}
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					render={({ children, ...props }) => (
						<a {...props} href={SIGN_OUT_PATH}>
							{children}
						</a>
					)}
				>
					<LogOut aria-hidden />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
