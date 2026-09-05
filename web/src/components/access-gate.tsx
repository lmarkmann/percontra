import type { ReactNode } from "react";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isUnlocked, submitAccessCode } from "@/lib/access-code";
import { site } from "@/lib/site";

/**
 * Holds the demo behind a shared code while it is publicly reachable.
 *
 * One field, not an email and a password. A mock sign-in form teaches whoever
 * meets it to type a real credential into a page that does nothing with it,
 * and this gate has no accounts to sign anyone into. A single shared code says
 * what it is.
 *
 * What this does not do is in `src/lib/access-code.ts`: the bundle ships to
 * everyone regardless, so this keeps out a passer-by and no one else.
 */
export function AccessGate({ children }: { children: ReactNode }) {
	const [unlocked, setUnlocked] = useState(isUnlocked);
	const [code, setCode] = useState("");
	const [rejected, setRejected] = useState(false);
	const [checking, setChecking] = useState(false);

	if (unlocked) return children;

	async function unlock() {
		setChecking(true);
		setRejected(false);
		const accepted = await submitAccessCode(code);
		setChecking(false);
		if (accepted) {
			setUnlocked(true);
			return;
		}
		setRejected(true);
		setCode("");
	}

	return (
		<div className="flex min-h-svh items-center justify-center bg-background px-6 safe-bottom safe-top">
			<main id="main" tabIndex={-1} className="w-full max-w-sm outline-none">
				<p className="font-mono text-label font-medium tracking-label text-muted-foreground uppercase">
					{site.name}
				</p>
				<h1 className="mt-3 text-title font-semibold tracking-title text-balance">
					This demo is not open yet
				</h1>
				<p className="mt-2 text-caption text-muted-foreground">
					It is a work in progress being shown to a few people. If you were
					given a code, enter it below.
				</p>

				<form
					onSubmit={(event) => {
						event.preventDefault();
						void unlock();
					}}
					className="mt-7 space-y-3"
					noValidate
				>
					<div className="space-y-1.5">
						<Label htmlFor="access-code">Access code</Label>
						<Input
							id="access-code"
							name="access-code"
							type="password"
							value={code}
							autoComplete="off"
							spellCheck={false}
							aria-invalid={rejected}
							aria-describedby={rejected ? "access-code-error" : undefined}
							onChange={(event) => {
								setCode(event.target.value);
								setRejected(false);
							}}
						/>
					</div>
					{rejected ? (
						<p
							id="access-code-error"
							role="alert"
							className="text-caption text-status-blocked-fg"
						>
							That code is not right. Check it with whoever sent you the link.
						</p>
					) : null}
					<Button type="submit" disabled={checking || code.length === 0}>
						{checking ? "Checking" : "Continue"}
					</Button>
				</form>
			</main>
		</div>
	);
}
