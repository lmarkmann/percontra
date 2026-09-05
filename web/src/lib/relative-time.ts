const formatter = new Intl.RelativeTimeFormat("en", {
	numeric: "auto",
	style: "narrow",
});

export function formatRelativeTime(
	isoTimestamp: string,
	now = Date.now(),
): string {
	const seconds = (Date.parse(isoTimestamp) - now) / 1000;
	const absoluteSeconds = Math.abs(seconds);
	let value: number;
	let unit: Intl.RelativeTimeFormatUnit;

	if (absoluteSeconds < 45) {
		value = 0;
		unit = "second";
	} else if (absoluteSeconds < 90 * 60) {
		value = Math.round(seconds / 60);
		unit = "minute";
	} else if (absoluteSeconds < 36 * 60 * 60) {
		value = Math.round(seconds / (60 * 60));
		unit = "hour";
	} else {
		value = Math.round(seconds / (24 * 60 * 60));
		unit = "day";
	}

	return formatter.format(value, unit);
}
