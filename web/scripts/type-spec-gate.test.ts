import { expect, test } from "vitest";

import { checkSpec, checkTypeSpec, familiesInCss } from "./type-spec-gate.ts";

function spec(body: string) {
	return `# Type Spec\n\n${body}\n`;
}

function declared(family: string) {
	return new Map([[family, ["src/styles/fixture.css"]]]);
}

const JUSTIFIED =
	"Runners-up: Alpha (lost because it ships no variable build); Beta (lost because its counters cost density).";

test("this repo justifies every family its CSS declares", () => {
	const { failures, families } = checkTypeSpec(process.cwd());

	expect(failures).toEqual([]);
	expect([...families.keys()].toSorted()).toEqual([
		"Charter",
		"Inter Variable",
	]);
});

test("a face is a decision, its fallback chain is not", () => {
	const css = `
    @font-face { font-family: "Inter Variable"; src: url(inter.woff2); }
    :root { --font-sans: "Inter Variable", Arial, sans-serif; }
  `;

	expect(familiesInCss(css)).toEqual(["Inter Variable", "Inter Variable"]);
});

test("metric-matched fallbacks are matching, not choosing", () => {
	const byName = `@font-face { font-family: "Inter Fallback"; src: local(Arial); }`;
	const bySrc = `@font-face { font-family: "Charter Clone"; src: local(Georgia), local(Times); }`;

	expect(familiesInCss(byName)).toEqual([]);
	expect(familiesInCss(bySrc)).toEqual([]);
});

test("generics, variables, and commented-out faces are not families", () => {
	const css = `
    /* @font-face { font-family: "Ghost"; src: url(ghost.woff2); } */
    :root { --font-mono: ui-monospace, monospace; --font-prose: var(--font-serif); }
  `;

	expect(familiesInCss(css)).toEqual([]);
});

test("a declared family with no spec section fails", () => {
	const { failures } = checkSpec(declared("Poppins"), spec("## Faces"));

	expect(failures).toEqual([
		"Poppins: no section in docs/frontend/type-spec.md (declared in src/styles/fixture.css)",
	]);
});

test("a spec section without runners-up fails", () => {
	const { failures } = checkSpec(
		declared("Charter"),
		spec("### Face: Charter\n\nIt looked nice."),
	);

	expect(failures).toEqual([
		"Charter: no `Runners-up:` line in its spec section",
	]);
});

test("runners-up must name two faces, each with a loss reason", () => {
	const one = checkSpec(
		declared("Charter"),
		spec("### Face: Charter\n\nRunners-up: Alpha (lost because it is wider)."),
	);
	const unexplained = checkSpec(
		declared("Charter"),
		spec(
			"### Face: Charter\n\nRunners-up: Alpha; Beta (lost because it is wider).",
		),
	);

	expect(one.failures).toEqual([
		"Charter: `Runners-up:` names 1 face(s), needs 2 (or the [DEFAULTED: ...] hatch)",
	]);
	expect(unexplained.failures).toEqual([
		"Charter: runner-up without a loss reason: Alpha",
	]);
});

test("the DEFAULTED hatch skips the runner-up arithmetic", () => {
	const { failures } = checkSpec(
		declared("Charter"),
		spec(
			"### Face: Charter\n\nRunners-up: [DEFAULTED: inherited from the starter]",
		),
	);

	expect(failures).toEqual([]);
});

test("an anti-list face owes a neighbour sentence on top of its runners-up", () => {
	const bare = checkSpec(
		declared("Inter"),
		spec(`### Face: Inter\n\n${JUSTIFIED}`),
	);
	const argued = checkSpec(
		declared("Inter"),
		spec(
			`### Face: Inter\n\n${JUSTIFIED}\n\nWhy this and not Switzer: it is the only candidate with published fallback metrics.`,
		),
	);

	expect(bare.failures).toEqual([
		"Inter: on the anti-list as Inter, needs a `Why this and not <neighbour>: <sentence>` line (iron rule 3)",
	]);
	expect(argued.failures).toEqual([]);
});

test("a spec section for a face no CSS declares warns rather than fails", () => {
	const { failures, warnings } = checkSpec(
		new Map(),
		spec(`### Face: Satoshi\n\n${JUSTIFIED}`),
	);

	expect(failures).toEqual([]);
	expect(warnings).toEqual([
		"Face: Satoshi: specified but no CSS declares it; drop the section or the face came back",
	]);
});
