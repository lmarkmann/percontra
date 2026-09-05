import { useCallback } from "react";

import { IconSwap } from "@/components/icon-swap";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { nextTheme, type ThemeMode, themeLabel } from "@/lib/theme-cycle";

function SunIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2" />
			<path d="M12 20v2" />
			<path d="m4.93 4.93 1.41 1.41" />
			<path d="m17.66 17.66 1.41 1.41" />
			<path d="M2 12h2" />
			<path d="M20 12h2" />
			<path d="m6.34 17.66-1.41 1.41" />
			<path d="m19.07 4.93-1.41 1.41" />
		</svg>
	);
}

function MoonIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			{/* Mirrors lucide-react's Moon exactly so the lean toggle matches the showcase toggle. */}
			<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
		</svg>
	);
}

function MonitorIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<rect width="20" height="14" x="2" y="3" rx="2" />
			<path d="M8 21h8" />
			<path d="M12 17v4" />
		</svg>
	);
}

const themeIcons = {
	light: <SunIcon />,
	dark: <MoonIcon />,
	system: <MonitorIcon />,
} as const;

/** Home-only toggle: no tooltip or lucide so entry stays lean. */
export function ThemeToggleLean() {
	const { theme, setTheme } = useTheme();
	const mode: ThemeMode = theme;

	const cycleTheme = useCallback(() => {
		setTheme(nextTheme(mode));
	}, [mode, setTheme]);

	return (
		<Button
			variant="outline"
			size="icon"
			data-testid="theme-toggle"
			aria-label={themeLabel(mode)}
			onClick={cycleTheme}
		>
			<IconSwap activeKey={mode} icons={themeIcons} />
		</Button>
	);
}
