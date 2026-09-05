/** Shared class recipes for input-shaped controls. */

const formControlBase =
	"rounded-lg border border-input bg-transparent outline-none transition-[border-color,background-color,box-shadow] duration-fast ease-out placeholder:text-muted-foreground focus-ring invalid-ring";

const formControlDisabled =
	"disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:disabled:bg-input/80";

export const formControlField = "dark:bg-input/30";

export const formControlInput = [
	formControlBase,
	formControlDisabled,
	formControlField,
	"h-8 w-full min-w-0 px-2.5 py-1 text-body md:text-caption",
	"file:inline-flex file:h-6 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-caption",
].join(" ");

export const formControlTextarea = [
	formControlBase,
	formControlField,
	"field-sizing-content flex min-h-16 w-full resize-none px-2.5 py-2 text-body md:text-caption",
	"disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:disabled:bg-input/80",
].join(" ");

export const formControlGroupFocus =
	"has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50";

export const formControlGroupInvalid =
	"has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40";
