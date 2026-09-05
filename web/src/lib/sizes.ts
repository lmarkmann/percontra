import { cva } from "class-variance-authority";

/** Spinners keep spinning under reduced motion (index.css floor + brief).
 * will-change promotes the svg to its own layer so the spin composites
 * instead of painting every frame (docs/adr/009). */
export const spinnerVariants = cva(
	"shrink-0 animate-spin text-current will-change-transform",
	{
		variants: {
			size: {
				xs: "size-3",
				sm: "size-3.5",
				default: "size-4",
				lg: "size-5",
			},
		},
		defaultVariants: {
			size: "default",
		},
	},
);

/** Skeleton pulse is decorative; suppressed when motion is reduced. */
export const skeletonVariants = cva("bg-muted motion-safe:animate-pulse", {
	variants: {
		variant: {
			line: "h-4 w-full rounded-md",
			text: "h-4 w-3/5 rounded-md",
			block: "h-16 w-full rounded-xl",
			circle: "size-8 rounded-full",
		},
	},
	defaultVariants: {
		variant: "line",
	},
});
