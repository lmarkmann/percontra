import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Custom text-size scale (text-display/title/body/caption/label, see src/index.css @theme) isn't known to tailwind-merge by default, so it falls back to treating text-caption etc. as text-color utilities and strips real color classes like text-primary-foreground that share a cn() call with them. Registering the scale here fixes the classification.
const twMerge = extendTailwindMerge({
	extend: {
		theme: {
			text: ["display", "title", "body", "caption", "label"],
		},
	},
});

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
