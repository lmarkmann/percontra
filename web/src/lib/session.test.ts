import { afterEach, expect, test } from "vitest";

import {
	clearDemoSession,
	getSession,
	setDemoSession,
	setLiveSession,
} from "@/lib/session";

afterEach(() => {
	localStorage.clear();
	setLiveSession(null);
});

test("getSession returns null when storage is empty", () => {
	expect(getSession()).toBeNull();
});

test("setDemoSession round-trips through getSession", () => {
	setDemoSession({ userId: "user-1", email: "dev@example.com" });
	expect(getSession()).toEqual({ userId: "user-1", email: "dev@example.com" });
});

test("live session takes precedence over demo storage", () => {
	setDemoSession({ userId: "demo", email: "demo@example.com" });
	setLiveSession({ userId: "live", email: "live@example.com" });
	expect(getSession()).toEqual({ userId: "live", email: "live@example.com" });
});

test("getSession returns null for invalid JSON", () => {
	localStorage.setItem("demo-session", "not-json");
	expect(getSession()).toBeNull();
});

test("getSession normalizes stored data through the session contract", () => {
	localStorage.setItem(
		"demo-session",
		JSON.stringify({
			userId: "user-1",
			email: "dev@example.com",
			role: "admin",
		}),
	);
	expect(getSession()).toEqual({
		userId: "user-1",
		email: "dev@example.com",
	});
});

test("clearDemoSession removes the stored session", () => {
	setDemoSession({ userId: "user-1" });
	clearDemoSession();
	expect(getSession()).toBeNull();
});
