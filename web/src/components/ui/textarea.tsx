import type * as React from "react";

import { formControlTextarea } from "@/lib/form-control";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(formControlTextarea, className)}
			{...props}
		/>
	);
}

export { Textarea };
