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

test("the static theme toggle keeps a 44px hit area", () => {
	const html = readFileSync("index.html", "utf8");
	const toggle = html.match(
		/<button[\s\S]*?id="static-theme-toggle"[\s\S]*?>/,
	)?.[0];
	if (!toggle) throw new Error("Missing static theme toggle");
	expect(toggle).toContain("relative");
	expect(toggle).toContain("after:size-11");
});
