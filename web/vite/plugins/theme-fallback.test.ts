import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const themeCss = readFileSync("src/styles/theme-tokens.css", "utf8");
const fallbackHtml = readFileSync("public/404.html", "utf8");
const indexHtml = readFileSync("index.html", "utf8");
const themeProvider = readFileSync("src/components/theme-provider.tsx", "utf8");

function declarations(sourceBlock: string) {
	return Object.fromEntries(
		[...sourceBlock.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [
			match[1],
			match[2],
		]),
	);
}

function block(source: string, selector: string) {
	const match = source.match(new RegExp(`${selector}\\s*\\{([^}]+)\\}`));
	if (!match?.[1]) throw new Error(`Missing ${selector} block`);
	return declarations(match[1]);
}

/**
 * Semantic tokens reference the primitive ramps, so a literal comparison would
 * reject `var(--gray-50)` against the identical `oklch(...)` in the mirror.
 * Follow the chain to the value a browser would paint. Primitives live only in
 * `:root`, so the light block is the fallback scope for both themes.
 */
function resolve(
	value: string | undefined,
	theme: Record<string, string>,
	primitives: Record<string, string>,
): string {
	let current = value;
	for (let depth = 0; current && depth < 10; depth++) {
		const reference = current.match(/^var\(--([\w-]+)\)$/);
		if (!reference?.[1]) return current.trim();
		current = theme[reference[1]] ?? primitives[reference[1]];
	}
	throw new Error(`Unresolvable token chain: ${value}`);
}

/** OKLCH to sRGB hex, so the theme-color metas can be checked against a token. */
function oklchToHex(value: string): string {
	const parts = value.match(
		/^oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)$/,
	) as RegExpMatchArray | null;
	if (!parts) throw new Error(`Not a plain oklch() triple: ${value}`);
	const lightness = Number(parts[1]);
	const chroma = Number(parts[2]);
	const hueRadians = (Number(parts[3]) * Math.PI) / 180;
	const a = chroma * Math.cos(hueRadians);
	const b = chroma * Math.sin(hueRadians);
	const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
	const linear = [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
	];
	return `#${linear
		.map((channel) => {
			const gamma =
				channel <= 0.0031308
					? 12.92 * channel
					: 1.055 * channel ** (1 / 2.4) - 0.055;
			return Math.round(Math.min(1, Math.max(0, gamma)) * 255)
				.toString(16)
				.padStart(2, "0");
		})
		.join("")}`;
}

const lightTheme = block(themeCss, ":root");
const darkTheme = block(themeCss, "\\.dark");

test("the standalone 404 colors mirror the canonical theme", () => {
	const [lightFallback, darkFallback] = [
		...fallbackHtml.matchAll(/:root\s*\{([^}]+)\}/g),
	].map((match) => {
		if (!match[1]) throw new Error("Missing 404 theme block");
		return declarations(match[1]);
	});
	const tokenMap = {
		bg: "background",
		fg: "foreground",
		link: "primary",
		muted: "muted-foreground",
	};

	for (const [fallbackToken, themeToken] of Object.entries(tokenMap)) {
		expect(lightFallback?.[fallbackToken]).toBe(
			resolve(lightTheme[themeToken], lightTheme, lightTheme),
		);
		expect(darkFallback?.[fallbackToken]).toBe(
			resolve(darkTheme[themeToken], darkTheme, lightTheme),
		);
	}
});

test("every browser-chrome surface hex matches --background", () => {
	const expected = {
		light: oklchToHex(resolve(lightTheme.background, lightTheme, lightTheme)),
		dark: oklchToHex(resolve(darkTheme.background, darkTheme, lightTheme)),
	};

	for (const [scheme, hex] of Object.entries(expected)) {
		expect(indexHtml).toContain(
			`content="${hex}"\n\t\t\tmedia="(prefers-color-scheme: ${scheme})"`,
		);
	}
	const surfaceLiteral = `{ light: "${expected.light}", dark: "${expected.dark}" }`;
	expect(indexHtml).toContain(surfaceLiteral);
	expect(themeProvider).toContain(surfaceLiteral);
});
