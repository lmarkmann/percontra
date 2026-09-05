import { useOnlineStatus } from "@/hooks/use-online-status";

/**
 * App-shell offline strip. Communicates connection loss once at the shell
 * so features do not each invent their own banner (feature-local disable still applies).
 */
export function OfflineBanner() {
	const online = useOnlineStatus();

	if (online) {
		return null;
	}

	return (
		<div
			className="border-b border-border bg-muted/80 px-4 py-2 text-center text-label text-muted-foreground backdrop-blur-sm safe-top"
			role="status"
			aria-live="polite"
			data-testid="offline-banner"
		>
			<span className="font-medium text-foreground">Offline.</span> Queued
			writes stay on this device until you reconnect.
		</div>
	);
}
