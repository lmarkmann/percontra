import { Copy, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { actionClass } from "@/lib/action-class";
import { reportError } from "@/lib/error-reporting";
import { createSupportId } from "@/lib/support-id";
import { toast } from "@/lib/toast";

type ErrorBoundaryState = {
	error: Error | null;
	supportId: string | null;
};

// Class component because React has no hook equivalent for error boundaries. Catches render-time throws below it and shows a styled fallback instead of a blank page. Wrap the app in main.tsx; add granular boundaries per route later.
export class ErrorBoundary extends Component<
	{ children: ReactNode },
	ErrorBoundaryState
> {
	override state: ErrorBoundaryState = { error: null, supportId: null };

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { error, supportId: createSupportId() };
	}

	override componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("ErrorBoundary caught:", error, info.componentStack);
		reportError(error, { supportId: this.state.supportId ?? undefined });
	}

	// Raw message and stack leave the browser only in DEV; production copies the support ID, which keys the full detail in the error aggregate once the reporting seam is wired.
	handleCopy = () => {
		const { error, supportId } = this.state;
		if (!error || !supportId) {
			return;
		}
		const details = [
			`Error ID: ${supportId}`,
			...(import.meta.env.DEV
				? [error.message, error.stack ?? ""]
				: ["Something unexpected happened while rendering this view."]),
		].join("\n");
		void navigator.clipboard.writeText(details);
		toast.success("Error details copied");
	};

	override render() {
		if (!this.state.error) return this.props.children;

		const { error, supportId } = this.state;

		return (
			<main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
				<h1 className="font-heading text-title font-semibold tracking-title">
					This page hit an error
				</h1>
				<p className="max-w-prose text-caption text-muted-foreground">
					{import.meta.env.DEV && error.message
						? error.message
						: "Something unexpected happened while rendering this view."}
				</p>
				{supportId ? (
					<p className="text-label text-muted-foreground">
						Error ID: <code className="tabular-nums">{supportId}</code>
					</p>
				) : null}
				<div className="flex flex-wrap justify-center gap-2">
					<Button
						className={actionClass()}
						onClick={() => window.location.reload()}
					>
						<RefreshCw data-icon="inline-start" />
						Reload page
					</Button>
					<Button variant="outline" onClick={this.handleCopy}>
						<Copy data-icon="inline-start" />
						Copy error details
					</Button>
				</div>
			</main>
		);
	}
}
