import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

function normalize(text: string): string {
	return text.replace(/\s+/g, " ").trim();
}

test("the static home shell contains every inline home source string", () => {
	const routeSource = readFileSync("src/routes/index.tsx", "utf8");
	const html = readFileSync("index.html", "utf8");
	const shellSource = html.match(
		/<div data-static-shell[\s\S]*?<script type="module"/,
	)?.[0];
	if (!shellSource) throw new Error("Missing static home shell");
	const shellText = normalize(shellSource.replace(/<[^>]+>/g, " "));
	const sourceStrings = [
		...routeSource.matchAll(/\bgt\(\s*("(?:\\.|[^"\\])*")/g),
	]
		.map((match) => match[1])
		.filter((value): value is string => Boolean(value))
		.map((value) => JSON.parse(value) as string);

	for (const sourceString of sourceStrings) {
		expect(shellText).toContain(normalize(sourceString));
	}
});

test("a static theme toggle, if present, keeps a 44px hit area", () => {
	const html = readFileSync("index.html", "utf8");
	const toggle = html.match(
		/<button[\s\S]*?id="static-theme-toggle"[\s\S]*?>/,
	)?.[0];
	// The access-gate shell ships without one. The boot script guards for that
	// (`if (!button) return`), so absence is a valid shell, not a failure.
	if (!toggle) return;
	expect(toggle).toContain("relative");
	expect(toggle).toContain("after:size-11");
});

test("the theme boot script tolerates a shell with no toggle", () => {
	const html = readFileSync("index.html", "utf8");
	expect(html).toContain('getElementById("static-theme-toggle")');
	expect(html).toMatch(
		/getElementById\("static-theme-toggle"\);\s*if \(!button\) return;/,
	);
});
