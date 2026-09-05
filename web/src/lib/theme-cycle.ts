const THEME_CYCLE = ["light", "dark", "system"] as const;

export type ThemeMode = (typeof THEME_CYCLE)[number];

export function themeLabel(mode: ThemeMode): string {
	switch (mode) {
		case "light":
			return "Light theme";
		case "dark":
			return "Dark theme";
		case "system":
			return "System theme";
		default: {
			const exhaustive: never = mode;
			return exhaustive;
		}
	}
}

export function isThemeMode(
	value: string | null | undefined,
): value is ThemeMode {
	return value === "light" || value === "dark" || value === "system";
}

export function nextTheme(mode: ThemeMode): ThemeMode {
	const index = THEME_CYCLE.indexOf(mode);
	// non-null: modulo into a non-empty tuple is always in range
	return THEME_CYCLE[(index + 1) % THEME_CYCLE.length]!;
}

export function resolveThemeClass(
	theme: ThemeMode,
	prefersDark: boolean,
): "light" | "dark" {
	if (theme === "system") {
		return prefersDark ? "dark" : "light";
	}
	return theme;
}
