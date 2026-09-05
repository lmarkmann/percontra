import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import {
	isThemeMode,
	resolveThemeClass,
	type ThemeMode,
} from "@/lib/theme-cycle";

type Theme = ThemeMode;

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState>({
	theme: "system",
	setTheme: () => null,
});

// Approximate token surfaces for browser chrome (theme-color), mirrored in the
// index.html boot script. System follows the OS via the media-gated metas; an
// explicit choice pins both to the resolved surface so the chrome matches even
// when the OS scheme disagrees. No-ops when the metas are absent (tests).
const THEME_SURFACE = { light: "#f5f2ec", dark: "#1b1a16" } as const;

function syncThemeColor(theme: Theme, resolved: "light" | "dark") {
	const metas = document.querySelectorAll<HTMLMetaElement>(
		'meta[name="theme-color"]',
	);
	for (const meta of metas) {
		const scheme = meta.media.includes("dark") ? "dark" : "light";
		meta.content =
			theme === "system" ? THEME_SURFACE[scheme] : THEME_SURFACE[resolved];
	}
}

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "ui-theme",
}: {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
}) {
	const [theme, setThemeState] = useState<Theme>(() => {
		const stored = localStorage.getItem(storageKey);
		return isThemeMode(stored) ? stored : defaultTheme;
	});

	const setTheme = useCallback(
		(next: Theme) => {
			localStorage.setItem(storageKey, next);
			setThemeState(next);
		},
		[storageKey],
	);

	// initial paint is handled by the inline script in index.html; this effect handles theme changes and OS-level switches while running
	useEffect(() => {
		const root = window.document.documentElement;
		const apply = (resolved: "light" | "dark") => {
			root.classList.remove("light", "dark");
			root.classList.add(resolved);
			root.style.colorScheme = resolved;
			syncThemeColor(theme, resolved);
		};
		const query = window.matchMedia("(prefers-color-scheme: dark)");
		apply(resolveThemeClass(theme, query.matches));
		if (theme !== "system") {
			return undefined;
		}
		const onChange = (e: MediaQueryListEvent) =>
			apply(e.matches ? "dark" : "light");
		query.addEventListener("change", onChange);
		return () => query.removeEventListener("change", onChange);
	}, [theme]);

	const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

	return (
		<ThemeProviderContext.Provider value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeProviderContext);
}
