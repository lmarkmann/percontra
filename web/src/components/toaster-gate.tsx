import { lazy, Suspense, useEffect, useState } from "react";

import { onToasterMount } from "@/lib/toast";

const LazyToaster = lazy(() =>
	import("@/components/ui/sonner").then((module) => ({
		default: module.Toaster,
	})),
);

/** Mounts the themed Toaster only after the first `toast()` call. */
export function ToasterGate() {
	const [mounted, setMounted] = useState(false);

	useEffect(() => onToasterMount(() => setMounted(true)), []);

	if (!mounted) return null;

	return (
		<Suspense fallback={null}>
			<LazyToaster richColors closeButton />
		</Suspense>
	);
}
