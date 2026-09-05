import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider, useTheme } from "@/components/theme-provider";

function ThemeReader() {
	const { theme } = useTheme();
	return <span data-testid="theme">{theme}</span>;
}

function addThemeColorMetas() {
	const light = document.createElement("meta");
	light.name = "theme-color";
	light.media = "(prefers-color-scheme: light)";
	light.content = "seed";
	const dark = document.createElement("meta");
	dark.name = "theme-color";
	dark.media = "(prefers-color-scheme: dark)";
	dark.content = "seed";
	document.head.append(light, dark);
	return { light, dark };
}

describe("ThemeProvider", () => {
	afterEach(() => {
		document.documentElement.classList.remove("light", "dark");
		document.documentElement.style.colorScheme = "";
		for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
			meta.remove();
		}
		localStorage.removeItem("ui-theme");
	});

	it("follows OS color-scheme changes while in system mode", () => {
		let changeListener: ((event: MediaQueryListEvent) => void) | null = null;
		const query: MediaQueryList = {
			matches: false,
			media: "(prefers-color-scheme: dark)",
			addEventListener: (
				_type: string,
				listener: (event: MediaQueryListEvent) => void,
			) => {
				changeListener = listener;
			},
			removeEventListener: () => {
				changeListener = null;
			},
			dispatchEvent: () => false,
			addListener: () => {},
			removeListener: () => {},
			onchange: null,
		} as unknown as MediaQueryList;

		vi.stubGlobal("matchMedia", () => query);

		render(
			<ThemeProvider>
				<ThemeReader />
			</ThemeProvider>,
		);

		expect(screen.getByTestId("theme")).toHaveTextContent("system");
		expect(document.documentElement.classList.contains("light")).toBe(true);

		// Simulate the OS switching to dark mode.
		changeListener!({ matches: true } as MediaQueryListEvent);

		expect(document.documentElement.classList.contains("dark")).toBe(true);
		expect(document.documentElement.classList.contains("light")).toBe(false);
		expect(document.documentElement.style.colorScheme).toBe("dark");
	});

	it("pins both theme-color metas to the resolved surface for an explicit theme", () => {
		const { light, dark } = addThemeColorMetas();
		localStorage.setItem("ui-theme", "dark");

		render(
			<ThemeProvider>
				<ThemeReader />
			</ThemeProvider>,
		);

		expect(light.content).toBe("#1a1a1a");
		expect(dark.content).toBe("#1a1a1a");
	});

	it("keeps the theme-color metas scheme-gated in system mode", () => {
		const { light, dark } = addThemeColorMetas();
		localStorage.setItem("ui-theme", "system");

		render(
			<ThemeProvider>
				<ThemeReader />
			</ThemeProvider>,
		);

		expect(light.content).toBe("#f5f2ed");
		expect(dark.content).toBe("#1a1a1a");
	});
});
