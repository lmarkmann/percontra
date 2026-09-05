/** Min-width for primary actions with variable copy (~1.3x typical label). */
export function actionClass(extra?: string): string {
	return ["min-w-[7.5rem]", extra].filter(Boolean).join(" ");
}
