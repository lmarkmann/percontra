import type { VariantProps } from "class-variance-authority";

import { skeletonVariants } from "@/lib/sizes";
import { cn } from "@/lib/utils";

function Skeleton({
	className,
	variant,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof skeletonVariants>) {
	return (
		<div
			data-slot="skeleton"
			data-variant={variant}
			className={cn(skeletonVariants({ variant }), className)}
			{...props}
		/>
	);
}

// oxlint-disable-next-line react/only-export-components
export { Skeleton, skeletonVariants };
