import { Monitor, Moon, Sun } from "lucide-react";
import { useCallback } from "react";

import { IconSwap } from "@/components/icon-swap";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { nextTheme, type ThemeMode, themeLabel } from "@/lib/theme-cycle";

const themeIcons = {
	light: <Sun className="size-4" />,
	dark: <Moon className="size-4" />,
	system: <Monitor className="size-4" />,
} as const;

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const mode: ThemeMode = theme;

	const cycleTheme = useCallback(() => {
		setTheme(nextTheme(mode));
	}, [mode, setTheme]);

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							variant="outline"
							size="icon"
							data-testid="theme-toggle"
							aria-label={themeLabel(mode)}
							onClick={cycleTheme}
						/>
					}
				>
					<IconSwap activeKey={mode} icons={themeIcons} />
				</TooltipTrigger>
				<TooltipContent>{themeLabel(mode)}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
