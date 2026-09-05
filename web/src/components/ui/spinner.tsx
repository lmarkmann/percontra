import type { VariantProps } from "class-variance-authority";

import { Loader2Icon } from "lucide-react";

import { spinnerVariants } from "@/lib/sizes";
import { cn } from "@/lib/utils";

type SpinnerSize = NonNullable<VariantProps<typeof spinnerVariants>["size"]>;

function Spinner({
	className,
	size = "default",
	...props
}: React.ComponentProps<"svg"> & {
	size?: SpinnerSize;
}) {
	return (
		<Loader2Icon
			data-slot="spinner"
			role="status"
			aria-label="Loading"
			className={cn(spinnerVariants({ size }), className)}
			{...props}
		/>
	);
}

// oxlint-disable-next-line react/only-export-components
export { Spinner, spinnerVariants };
