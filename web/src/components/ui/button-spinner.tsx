import type { VariantProps } from "class-variance-authority";

import { spinnerVariants } from "@/lib/sizes";
import { cn } from "@/lib/utils";

type ButtonSpinnerProps = {
	className?: string;
	size?: NonNullable<VariantProps<typeof spinnerVariants>["size"]>;
};

/** CSS ring spinner for Button loading; avoids lucide on the entry path. */
export function ButtonSpinner({ className, size = "sm" }: ButtonSpinnerProps) {
	return (
		<span
			role="status"
			aria-label="Loading"
			data-slot="spinner"
			className={cn(
				spinnerVariants({ size }),
				"rounded-full border-2 border-current border-t-transparent",
				className,
			)}
		/>
	);
}
