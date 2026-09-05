import type { ExternalToast } from "sonner";

type SonnerToast = typeof import("sonner").toast;

const mountListeners = new Set<() => void>();

let api: SonnerToast | null = null;
let loading: Promise<SonnerToast> | null = null;
let mountPromise: Promise<void> | null = null;
let resolveMount: (() => void) | null = null;

/** Subscribe to mount the lazy Toaster (see `ToasterGate` in main.tsx). */
export function onToasterMount(listener: () => void): () => void {
	mountListeners.add(listener);
	if (api) listener();
	return () => {
		mountListeners.delete(listener);
	};
}

function requestToasterMount() {
	for (const listener of mountListeners) listener();
}

function waitForToasterMount(): Promise<void> {
	mountPromise ??= new Promise((resolve) => {
		resolveMount = resolve;
	});
	return mountPromise;
}

/** Called by `ToasterGate` once the lazy `<Toaster />` has committed. */
export function resolveToasterMounted(): void {
	resolveMount?.();
	resolveMount = null;
}

async function getToast(): Promise<SonnerToast> {
	if (api) return api;
	if (!loading) {
		requestToasterMount();
		loading = Promise.all([import("sonner"), waitForToasterMount()]).then(
			([mod]) => {
				api = mod.toast;
				return api;
			},
		);
	}
	return loading;
}

function enqueue(
	method: "success" | "error" | "info" | "warning" | "message",
	message: string,
	data?: ExternalToast,
) {
	void getToast().then((toast) => {
		toast[method](message, data);
	});
}

/** Lazy sonner facade: loads `sonner` (and its `react-dom` flushSync use) on first toast. */
export const toast = Object.assign(
	(message: string, data?: ExternalToast) => {
		void getToast().then((t) => t(message, data));
	},
	{
		success: (message: string, data?: ExternalToast) =>
			enqueue("success", message, data),
		error: (message: string, data?: ExternalToast) =>
			enqueue("error", message, data),
		info: (message: string, data?: ExternalToast) =>
			enqueue("info", message, data),
		warning: (message: string, data?: ExternalToast) =>
			enqueue("warning", message, data),
		message: (message: string, data?: ExternalToast) =>
			enqueue("message", message, data),
		dismiss: (id?: string | number) => {
			void getToast().then((t) => t.dismiss(id));
		},
	},
);
