import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

/**
 * The shipped surface stays ASCII. Interpuncts, bullets, em and en dashes,
 * Unicode ellipses, and arrows are the punctuation signature of generated
 * copy, and every fork inherits whatever this template ships.
 *
 * Do not widen `ALLOWED` to silence a failure: rewrite the string. A comma, a
 * semicolon, `...`, or the word "to" says the same thing in ASCII.
 */
const BANNED = /[—–·•…→]/;

const REPLACEMENTS: Record<string, string> = {
	"—": "a comma, semicolon, or colon",
	"–": "a plain hyphen",
	"·": "a comma or a separate element",
	"•": "a comma or a slash",
	"…": '"..."',
	"→": 'the word "to", or ">" in a breadcrumb',
};

/**
 * `hotkey.ts` maps keys to the glyphs macOS prints on the keycaps themselves,
 * and the two placeholder tests assert that `UNKNOWN_METRIC` is not a dash.
 * Both are semantic content, not decoration.
 */
const ALLOWED = new Set([
	"src/lib/hotkey.ts",
	"src/lib/view-state.test.ts",
	"src/components/metric-value.test.tsx",
]);

function trackedFiles(): string[] {
	const output = execFileSync(
		"git",
		["ls-files", "src", "server", "e2e", "public", "index.html"],
		{ encoding: "utf8" },
	);
	return output.split("\n").filter(Boolean);
}

test("the shipped surface carries no AI-tell punctuation", () => {
	const offenders: string[] = [];

	for (const file of trackedFiles()) {
		if (ALLOWED.has(file)) continue;
		if (/\.(woff2|png|jpg|svg|ico)$/.test(file)) continue;

		const lines = readFileSync(file, "utf8").split("\n");
		for (const [index, line] of lines.entries()) {
			const glyph = BANNED.exec(line)?.[0];
			if (!glyph) continue;
			offenders.push(
				`${file}:${index + 1} uses "${glyph}"; write ${REPLACEMENTS[glyph]} instead`,
			);
		}
	}

	expect(offenders).toEqual([]);
});
