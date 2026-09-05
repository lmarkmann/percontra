import type * as React from "react";

import { Input as InputPrimitive } from "@base-ui/react/input";

import { formControlInput } from "@/lib/form-control";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<InputPrimitive
			type={type}
			data-slot="input"
			className={cn(formControlInput, className)}
			{...props}
		/>
	);
}

export { Input };
