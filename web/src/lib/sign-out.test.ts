import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, test, vi } from "vitest";

import { clearDemoSession, getSession, setDemoSession } from "@/lib/session";
import { registerWorkOsSignOut, signOutApp } from "@/lib/sign-out";

afterEach(() => {
	clearDemoSession();
	registerWorkOsSignOut(null);
});

test("signOutApp clears the local session mirror", () => {
	setDemoSession({ userId: "u1", email: "a@b.co" });
	signOutApp();
	expect(getSession()).toBeNull();
});

test("signOutApp clears cached queries so data cannot leak across users", () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(["dashboard", null], { status: "ready" });
	setDemoSession({ userId: "u1" });
	signOutApp("/login", queryClient);
	expect(queryClient.getQueryData(["dashboard", null])).toBeUndefined();
	expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
});

test("signOutApp invokes a registered WorkOS signOut", () => {
	const workOsSignOut = vi.fn();
	registerWorkOsSignOut(workOsSignOut);
	setDemoSession({ userId: "u1" });
	signOutApp("/login");
	expect(getSession()).toBeNull();
	expect(workOsSignOut).toHaveBeenCalledWith({ returnTo: "/login" });
});
