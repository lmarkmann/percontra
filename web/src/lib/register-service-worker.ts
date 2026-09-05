/** Install the build-emitted precache worker in production only. */
export function registerServiceWorker() {
	if (!import.meta.env.PROD) return;
	if (!("serviceWorker" in navigator)) return;

	window.addEventListener("load", () => {
		void navigator.serviceWorker.register("/sw.js").catch(() => {
			// Non-fatal: repeat visits fall back to normal HTTP cache.
		});
	});
}
