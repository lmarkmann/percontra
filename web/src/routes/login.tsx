import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import {
	lazy,
	Suspense,
	type SubmitEvent,
	useEffect,
	useRef,
	useState,
} from "react";
import * as z from "zod/mini";

import { CopyButton } from "@/components/copy-button";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { env } from "@/env";
import { actionClass } from "@/lib/action-class";
import { authReturnFromSearch } from "@/lib/auth-return";
import { routeSeo, seoHead } from "@/lib/seo";
import { setDemoSession } from "@/lib/session";
import { createSupportId } from "@/lib/support-id";

export const Route = createFileRoute("/login")({
	validateSearch: z.object({ redirect: z.optional(z.string()) }),
	head: () => seoHead(routeSeo.login),
	component: LoginRoute,
});

const WorkOsLoginButton = env.VITE_WORKOS_CLIENT_ID
	? lazy(() =>
			import("@/components/workos-login-button").then((m) => ({
				default: m.WorkOsLoginButton,
			})),
		)
	: null;

type LoginPhase =
	| { type: "idle" }
	| { type: "submitting" }
	| { type: "error"; supportId: string; message: string };

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function LoginRoute() {
	const navigate = useNavigate();
	const router = useRouter();
	const workosEnabled = Boolean(env.VITE_WORKOS_CLIENT_ID);
	const returnTo = authReturnFromSearch(Route.useSearch());

	const loginSchema = z.object({
		email: z
			.string()
			.check(
				z.minLength(1, "Email is required."),
				z.regex(z.regexes.email, "Enter a valid email address."),
			),
	});

	const [email, setEmail] = useState("");
	const [fieldError, setFieldError] = useState<string | null>(null);
	const [phase, setPhase] = useState<LoginPhase>({ type: "idle" });
	const emailInputRef = useRef<HTMLInputElement>(null);
	const mainRef = useRef<HTMLElement>(null);

	function showError(supportId: string) {
		setPhase({
			type: "error",
			supportId,
			message:
				"We couldn\u2019t start a session. Try again or copy the error ID.",
		});
	}

	async function handleDemoSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		setFieldError(null);

		const parsed = loginSchema.safeParse({ email: email.trim() });
		if (!parsed.success) {
			const issue = parsed.error.issues[0];
			setFieldError(issue?.message ?? "Enter a valid email address.");
			emailInputRef.current?.focus();
			return;
		}

		setPhase({ type: "submitting" });

		try {
			if (parsed.data.email.toLowerCase().includes("fail")) {
				throw new Error("Demo sign-in rejected");
			}

			await delay(700);
			setDemoSession({
				userId: parsed.data.email,
				email: parsed.data.email,
			});
			void navigate({ to: returnTo });
		} catch {
			showError(createSupportId());
		}
	}

	const isSubmitting = phase.type === "submitting";
	const retry = () => {
		setPhase({ type: "idle" });
		requestAnimationFrame(() => {
			(emailInputRef.current ?? mainRef.current)?.focus();
		});
	};

	useEffect(() => {
		void router.preloadRoute({ to: "/dashboard" });
	}, [router]);

	return (
		<div className="flex min-h-svh flex-col bg-background">
			<SiteHeader />

			<main
				ref={mainRef}
				id="main"
				tabIndex={-1}
				className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 border-x border-border/70 px-6 pt-8 pb-16 outline-none safe-bottom"
			>
				<div className="flex flex-col gap-2">
					<h1 className="text-title font-medium">Log in</h1>
					<p className="max-w-prose font-prose text-body text-muted-foreground">
						Sign in to open your workspace.
					</p>
					<p className="max-w-prose text-caption text-muted-foreground">
						{workosEnabled
							? "WorkOS AuthKit is configured. You will be redirected to the hosted sign-in page for enterprise SSO."
							: "Demo mode: any email starts a local session. WorkOS AuthKit adds enterprise SSO."}
					</p>
				</div>

				{phase.type === "error" ? (
					<div
						className="rounded-xl bg-destructive/5 p-4 shadow-border"
						role="alert"
					>
						<p className="text-body font-medium">Sign-in failed</p>
						<p className="mt-1 text-caption text-muted-foreground">
							{phase.message}
						</p>
						<p className="mt-2 text-label text-muted-foreground">
							Error ID: <code className="tabular-nums">{phase.supportId}</code>
						</p>
						<div className="mt-3 flex flex-wrap gap-2">
							<Button
								size="sm"
								variant="outline"
								className={actionClass()}
								data-testid="login-retry"
								onClick={retry}
							>
								<RefreshCw data-icon="inline-start" />
								Retry
							</Button>
							<CopyButton
								value={phase.supportId}
								label="Copy error ID"
								copiedLabel="Copied"
								announceCopied="Copied"
								toastMessage="Error details copied"
							>
								Copy error ID
							</CopyButton>
						</div>
					</div>
				) : null}

				{workosEnabled && WorkOsLoginButton ? (
					<Suspense fallback={null}>
						<WorkOsLoginButton onError={showError} returnTo={returnTo} />
					</Suspense>
				) : (
					<form
						className="flex max-w-md flex-col gap-3"
						noValidate
						onSubmit={(event) => {
							void handleDemoSubmit(event);
						}}
					>
						<label
							className="flex flex-col gap-1.5 text-caption"
							htmlFor="login-email"
						>
							Email
							<Input
								ref={emailInputRef}
								id="login-email"
								name="email"
								type="email"
								autoComplete="email"
								spellCheck={false}
								placeholder="you@example.com"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								disabled={isSubmitting}
								aria-invalid={fieldError ? true : undefined}
								aria-describedby={fieldError ? "login-email-error" : undefined}
								data-testid="login-email"
							/>
						</label>
						{fieldError ? (
							<p
								id="login-email-error"
								className="text-label text-destructive"
								role="alert"
							>
								{fieldError}
							</p>
						) : null}
						<Button
							type="submit"
							className={actionClass("w-fit")}
							loading={isSubmitting}
							data-testid="login-submit"
						>
							Start demo session
						</Button>
					</form>
				)}

				<p className="pt-2">
					<Link
						to="/"
						className="duration-fast text-caption text-muted-foreground underline-offset-4 transition-[color,text-decoration-color] ease-out hover-fine:hover:text-foreground hover-fine:hover:underline"
					>
						Back home
					</Link>
				</p>
			</main>
		</div>
	);
}
