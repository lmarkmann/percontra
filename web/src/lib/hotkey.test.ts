import { describe, expect, it } from "vitest";

import {
	codeToToken,
	formatAccelerator,
	formatHotkey,
	parseChord,
} from "@/lib/hotkey";

describe("parseChord", () => {
	it("parses canonical Super+Shift+K", () => {
		expect(parseChord("Super+Shift+K")).toEqual({
			mods: ["Shift", "Super"],
			key: "K",
		});
	});

	it("accepts aliases and glyph tokens", () => {
		expect(parseChord("Cmd+Option+1")).toEqual({
			mods: ["Alt", "Super"],
			key: "1",
		});
		expect(parseChord("⌘+⇧+A")).toEqual({
			mods: ["Shift", "Super"],
			key: "A",
		});
	});

	it("orders modifiers stably", () => {
		expect(parseChord("Super+Control+Alt+Shift+X").mods).toEqual([
			"Control",
			"Alt",
			"Shift",
			"Super",
		]);
	});
});

describe("codeToToken", () => {
	it("maps letters, digits, and named keys", () => {
		expect(codeToToken("KeyA")).toBe("A");
		expect(codeToToken("Digit9")).toBe("9");
		expect(codeToToken("Space")).toBe("Space");
		expect(codeToToken("F12")).toBe("F12");
		expect(codeToToken("Unidentified")).toBeNull();
	});
});

describe("formatAccelerator", () => {
	it("joins ordered mods and key", () => {
		expect(formatAccelerator(new Set(["Super", "Shift"]), "K")).toBe(
			"Shift+Super+K",
		);
	});
});

describe("formatHotkey", () => {
	it("returns a non-empty display string", () => {
		const display = formatHotkey("Control+Shift+Space");
		expect(display.length).toBeGreaterThan(0);
		expect(display.toLowerCase()).toContain("space");
	});
});
