const fallbackAuthReturn = "/dashboard";
const authReturnBase = "https://app.invalid";

export function normalizeAuthReturn(value: unknown): string {
	if (
		typeof value !== "string" ||
		!value.startsWith("/") ||
		value.startsWith("//")
	) {
		return fallbackAuthReturn;
	}

	const target = new URL(value, authReturnBase);
	if (target.origin !== authReturnBase) {
		return fallbackAuthReturn;
	}
	return `${target.pathname}${target.search}${target.hash}`;
}

export function authReturnFromState(state: unknown): string {
	if (typeof state !== "object" || state === null) {
		return fallbackAuthReturn;
	}
	return normalizeAuthReturn(Reflect.get(state, "returnTo"));
}

export function authReturnFromSearch(search: unknown): string {
	if (typeof search !== "object" || search === null) {
		return fallbackAuthReturn;
	}
	return normalizeAuthReturn(Reflect.get(search, "redirect"));
}
