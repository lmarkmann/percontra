import { describe, expect, it } from "vitest";

import { nextTheme, resolveThemeClass, themeLabel } from "./theme-cycle";

describe("theme-cycle", () => {
	it("cycles themes in order", () => {
		expect(nextTheme("light")).toBe("dark");
		expect(nextTheme("dark")).toBe("system");
		expect(nextTheme("system")).toBe("light");
	});

	it("resolves system against prefers-dark", () => {
		expect(resolveThemeClass("system", true)).toBe("dark");
		expect(resolveThemeClass("system", false)).toBe("light");
		expect(resolveThemeClass("light", true)).toBe("light");
	});

	it("labels modes for aria", () => {
		expect(themeLabel("dark")).toBe("Dark theme");
	});
});
