import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { ButtonSpinner } from "@/components/ui/button-spinner";
import { cn } from "@/lib/utils";

const hitArea =
	"relative after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-1/2 after:content-['']";

const buttonVariants = cva(
	"group/button inline-flex icon-default shrink-0 items-center justify-center rounded-lg border invalid-ring focus-ring border-transparent bg-clip-padding text-caption leading-ui font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-fast ease-out outline-none select-none active:not-aria-[haspopup]:scale-[0.96] disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground hover-fine:hover:bg-primary-hover",
				outline:
					"bg-background shadow-border aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-input/30 hover-fine:hover:bg-muted hover-fine:hover:text-foreground hover-fine:hover:shadow-border-hover dark:hover-fine:hover:bg-input/50",
				secondary:
					"bg-secondary text-secondary-foreground aria-expanded:bg-secondary aria-expanded:text-secondary-foreground hover-fine:hover:bg-secondary-hover",
				muted:
					"bg-muted text-foreground aria-expanded:bg-muted aria-expanded:text-foreground hover-fine:hover:bg-muted-hover",
				ghost:
					"aria-expanded:bg-muted aria-expanded:text-foreground hover-fine:hover:bg-muted hover-fine:hover:text-foreground dark:hover-fine:hover:bg-muted/50",
				destructive:
					"bg-destructive/10 text-destructive focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 hover-fine:hover:bg-destructive/20 dark:hover-fine:hover:bg-destructive/30",
				link: "text-primary underline-offset-4 hover-fine:hover:underline",
			},
			size: {
				default: cn(
					hitArea,
					"h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
				),
				xs: cn(
					hitArea,
					"h-6 gap-1 rounded-capped-sm px-2 text-label in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
				),
				sm: cn(
					hitArea,
					"h-7 gap-1 rounded-capped-md px-2.5 text-caption in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
				),
				lg: cn(
					hitArea,
					"h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
				),
				icon: cn(hitArea, "size-8"),
				"icon-xs": cn(
					hitArea,
					"size-6 rounded-capped-sm in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
				),
				"icon-sm": cn(
					hitArea,
					"size-7 rounded-capped-md in-data-[slot=button-group]:rounded-lg",
				),
				"icon-lg": cn(hitArea, "size-9"),
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

const spinnerForButtonSize = {
	default: "sm",
	xs: "xs",
	sm: "xs",
	lg: "default",
	icon: "sm",
	"icon-xs": "xs",
	"icon-sm": "xs",
	"icon-lg": "default",
} as const;

function Button({
	className,
	variant = "default",
	size = "default",
	loading = false,
	disabled,
	children,
	...props
}: ButtonPrimitive.Props &
	VariantProps<typeof buttonVariants> & {
		loading?: boolean;
	}) {
	const isDisabled = disabled || loading;
	const spinnerSize =
		spinnerForButtonSize[size ?? "default"] ?? spinnerForButtonSize.default;

	return (
		<ButtonPrimitive
			data-slot="button"
			data-loading={loading ? "" : undefined}
			disabled={isDisabled}
			aria-busy={loading || undefined}
			className={cn(
				buttonVariants({ variant, size, className }),
				loading && "relative",
			)}
			{...props}
		>
			{loading ? (
				<ButtonSpinner
					size={spinnerSize}
					className={cn(children != null && children !== "" && "absolute")}
				/>
			) : null}
			{loading ? (
				<span
					className={cn(children != null && children !== "" && "opacity-0")}
				>
					{children}
				</span>
			) : (
				children
			)}
		</ButtonPrimitive>
	);
}

// oxlint-disable-next-line react/only-export-components
export { Button, buttonVariants };
