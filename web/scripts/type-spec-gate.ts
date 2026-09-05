// Fail when a product ships a font family its type spec does not justify.
//
// Ported from scripts/type_spec_gate.py, whose canonical copy lives at
// ~/Documents/.parked/frontend-skills/tools/typography/type_spec_gate.py. The
// strike list below is inlined from that project's font_anti_list.md so this
// gate needs nothing outside the repo, and no Python.
//
// Holds docs/frontend/type-spec.md to lm-typography's iron rules 3 and 5: every
// family the CSS declares is named, with two runners-up and a loss reason each,
// plus an extra sentence for anything on the anti-list.
//
// What it does not know:
//   - Fonts injected from JavaScript, a CMS, or an inline <style> in HTML.
//   - A family reachable only through a Tailwind utility class or an arbitrary
//     value; it reads CSS declarations, not class usage.
//   - Whether the justification sentence is any good. It checks that a human
//     wrote one, which is the part a script can check.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const STRIKE_LIST = [
	"Inter",
	"Roboto",
	"Open Sans",
	"Lato",
	"Poppins",
	"Montserrat",
	"Raleway",
	"Playfair Display",
	"Merriweather",
	"Space Grotesk",
	"Satoshi",
	"DM Sans",
	"Manrope",
	"Geist",
	"Instrument Serif",
];

const SPEC_PATH = "docs/frontend/type-spec.md";

const SKIP_DIRS = new Set([
	"node_modules",
	".git",
	".claude",
	"vendor",
	"dist",
	"build",
	".next",
	".output",
	"storybook-static",
	"playwright-report",
	"test-results",
	"coverage",
	".wrangler",
	".tanstack",
]);

const GENERIC = new Set([
	"serif",
	"sans-serif",
	"monospace",
	"cursive",
	"fantasy",
	"system-ui",
	"ui-serif",
	"ui-sans-serif",
	"ui-monospace",
	"ui-rounded",
	"math",
	"emoji",
	"fangsong",
	"inherit",
	"initial",
	"unset",
	"revert",
	"revert-layer",
	"none",
]);

const COMMENT = /\/\*[\s\S]*?\*\//g;
const FONT_FACE = /@font-face\s*\{([\s\S]*?)\}/g;
const DECL = /(?:^|[;{])\s*(?:--font-[\w-]*|font-family)\s*:\s*([^;{}]+)/gm;
const FACE_FAMILY = /font-family\s*:\s*([^;}]+)/;
const FACE_SRC = /src\s*:\s*([^;}]+)/;
const SRC_LOCAL_ONLY = /^\s*local\([^)]*\)\s*(?:,\s*local\([^)]*\)\s*)*$/;
const HEADING = /^#{2,4}\s+(.+)$/gm;
const RUNNERS_UP = /^[ \t]*Runners-up:[ \t]*(.+)$/im;
const DEFAULTED = /\[DEFAULTED:[^\]]+\]/;
const WHY_NOT = /^[ \t]*Why this and not[ \t]+(.+?):[ \t]*(\S.*)$/im;

function stripQuotes(name: string) {
	return name
		.trim()
		.replace(/^["']|["']$/g, "")
		.trim();
}

/** Split a font stack on top-level commas, ignoring commas inside local(...). */
function splitStack(value: string) {
	const parts: string[] = [];
	let depth = 0;
	let current = "";
	for (const character of value) {
		if (character === "(") depth += 1;
		else if (character === ")") depth -= 1;
		if (character === "," && depth === 0) {
			parts.push(current);
			current = "";
		} else {
			current += character;
		}
	}
	parts.push(current);
	return parts.map(stripQuotes).filter(Boolean);
}

/** A `Foo Fallback` face over a local() src is metric matching, not a choice. */
function isMetricFallback(family: string, body: string) {
	if (family.toLowerCase().endsWith("fallback")) return true;
	const src = FACE_SRC.exec(body);
	return Boolean(src?.[1] && SRC_LOCAL_ONLY.test(src[1].trim()));
}

function isDecision(name: string) {
	return Boolean(
		name &&
		!GENERIC.has(name.toLowerCase()) &&
		!name.startsWith("var(") &&
		!name.startsWith("--"),
	);
}

/** Every family one stylesheet decides on, fallback stacks and generics excluded. */
export function familiesInCss(source: string) {
	const text = source.replace(COMMENT, "");
	const names: string[] = [];

	for (const face of text.matchAll(FONT_FACE)) {
		const body = face[1] ?? "";
		const family = FACE_FAMILY.exec(body);
		if (!family?.[1]) continue;
		const name = stripQuotes(family[1]);
		if (isDecision(name) && !isMetricFallback(name, body)) names.push(name);
	}

	// Only the head of a stack is a decision; the tail is the fallback chain.
	for (const declaration of text.replace(FONT_FACE, "").matchAll(DECL)) {
		const head = splitStack(declaration[1] ?? "")[0];
		if (head && isDecision(head)) names.push(head);
	}

	return names;
}

function stylesheets(root: string) {
	const found: string[] = [];
	const walk = (dir: string) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (entry.isDirectory()) {
				if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name));
			} else if (entry.name.endsWith(".css")) {
				found.push(path.join(dir, entry.name));
			}
		}
	};
	walk(root);
	return found.toSorted();
}

/** Family name -> the files that declare it. */
export function declaredFamilies(root: string) {
	const found = new Map<string, string[]>();
	for (const file of stylesheets(root)) {
		const relative = path.relative(root, file);
		for (const name of familiesInCss(readFileSync(file, "utf8"))) {
			const files = found.get(name) ?? [];
			if (!files.includes(relative)) files.push(relative);
			found.set(name, files);
		}
	}
	return found;
}

function onAntiList(family: string) {
	const tokens = new Set(family.toLowerCase().split(/[\s\-_]+/));
	return STRIKE_LIST.find((strike) =>
		strike
			.toLowerCase()
			.split(/[\s\-_]+/)
			.every((token) => tokens.has(token)),
	);
}

/** Heading text -> the body under it, up to the next heading of any depth. */
function specSections(text: string) {
	const sections = new Map<string, string>();
	const marks = [...text.matchAll(HEADING)];
	marks.forEach((mark, index) => {
		const start = mark.index + mark[0].length;
		const end = marks[index + 1]?.index ?? text.length;
		sections.set((mark[1] ?? "").trim(), text.slice(start, end));
	});
	return sections;
}

function sectionFor(family: string, sections: Map<string, string>) {
	const target = stripQuotes(family).toLowerCase();
	for (const [heading, body] of sections) {
		if (stripQuotes(heading).toLowerCase().includes(target)) return body;
	}
	return undefined;
}

function checkRunnersUp(family: string, body: string, failures: string[]) {
	const runners = RUNNERS_UP.exec(body);
	if (!runners?.[1]) {
		failures.push(`${family}: no \`Runners-up:\` line in its spec section`);
		return;
	}
	if (DEFAULTED.test(runners[1])) return;

	const entries = runners[1].split(";").filter((entry) => entry.trim());
	if (entries.length !== 2) {
		failures.push(
			`${family}: \`Runners-up:\` names ${entries.length} face(s), needs 2 (or the [DEFAULTED: ...] hatch)`,
		);
		return;
	}
	const unexplained = entries
		.filter((entry) => !entry.toLowerCase().includes("lost because"))
		.map((entry) => entry.trim());
	if (unexplained.length > 0) {
		failures.push(
			`${family}: runner-up without a loss reason: ${unexplained.join("; ")}`,
		);
	}
}

// Codepoint order, so the report reads the same on every machine.
function byFamily([a]: [string, string[]], [b]: [string, string[]]) {
	if (a === b) return 0;
	return a < b ? -1 : 1;
}

/** The spec half of the gate, pure so it can be exercised on fixture strings. */
export function checkSpec(families: Map<string, string[]>, specText: string) {
	const failures: string[] = [];
	const warnings: string[] = [];
	const sections = specSections(specText);

	for (const [family, files] of [...families].toSorted(byFamily)) {
		const body = sectionFor(family, sections);
		if (body === undefined) {
			failures.push(
				`${family}: no section in ${SPEC_PATH} (declared in ${files.join(", ")})`,
			);
			continue;
		}

		checkRunnersUp(family, body, failures);

		const strike = onAntiList(family);
		if (strike && !WHY_NOT.test(body)) {
			failures.push(
				`${family}: on the anti-list as ${strike}, needs a \`Why this and not <neighbour>: <sentence>\` line (iron rule 3)`,
			);
		}
	}

	for (const heading of sections.keys()) {
		const clean = stripQuotes(heading);
		const declared = [...families.keys()].some((family) =>
			clean.toLowerCase().includes(stripQuotes(family).toLowerCase()),
		);
		if (clean.toLowerCase().startsWith("face:") && !declared) {
			warnings.push(
				`${clean}: specified but no CSS declares it; drop the section or the face came back`,
			);
		}
	}

	return { failures, warnings };
}

export function checkTypeSpec(root: string) {
	const families = declaredFamilies(root);
	const specFile = path.join(root, SPEC_PATH);

	if (!existsSync(specFile)) {
		const failures = [...families]
			.toSorted(byFamily)
			.map(
				([family, files]) =>
					`${family}: unjustified, no ${SPEC_PATH} (declared in ${files.join(", ")})`,
			);
		return { failures, warnings: [], families };
	}

	const { failures, warnings } = checkSpec(
		families,
		readFileSync(specFile, "utf8"),
	);
	return { failures, warnings, families };
}

function main() {
	const { failures, warnings, families } = checkTypeSpec(process.cwd());

	if (families.size === 0) {
		console.log("No font family declared in CSS; nothing to justify.");
		return 0;
	}

	console.log(
		`Declared families: ${[...families.keys()].toSorted().join(", ")}`,
	);
	for (const warning of warnings) console.log(`  warn  ${warning}`);

	if (failures.length === 0) {
		console.log(`OK: ${SPEC_PATH} justifies every declared family.`);
		return 0;
	}

	console.log(`\n${failures.length} unjustified:`);
	for (const failure of failures) console.log(`  FAIL  ${failure}`);
	console.log(
		"\nFill the spec from the template in lm-typography's references/spec.md. " +
			"A face that ships without one is unjustified by definition: nobody can " +
			"tell later whether it was chosen or defaulted into.",
	);
	return 1;
}

if (import.meta.main) process.exit(main());
