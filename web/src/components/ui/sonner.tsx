import {
	CircleCheckIcon,
	InfoIcon,
	Loader2Icon,
	OctagonXIcon,
	TriangleAlertIcon,
} from "lucide-react";
import { useEffect } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { useTheme } from "@/components/theme-provider";
import { resolveToasterMounted } from "@/lib/toast";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme } = useTheme();

	useEffect(() => {
		resolveToasterMounted();
	}, []);

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			icons={{
				success: <CircleCheckIcon className="size-4" />,
				info: <InfoIcon className="size-4" />,
				warning: <TriangleAlertIcon className="size-4" />,
				error: <OctagonXIcon className="size-4" />,
				loading: (
					<Loader2Icon className="size-4 animate-spin will-change-transform" />
				),
			}}
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					"--border-radius": "var(--radius)",
					"--success-bg": "var(--popover)",
					"--success-text": "var(--success)",
					"--success-border": "var(--border)",
					"--info-bg": "var(--popover)",
					"--info-text": "var(--info)",
					"--info-border": "var(--border)",
					"--warning-bg": "var(--popover)",
					"--warning-text": "var(--warning)",
					"--warning-border": "var(--border)",
					"--error-bg": "var(--popover)",
					"--error-text": "var(--destructive)",
					"--error-border": "var(--border)",
				} as React.CSSProperties
			}
			toastOptions={{
				classNames: {
					toast: "cn-toast",
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
