import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

import { DEFERRED_CHUNK_PREFIXES } from "./filter-modulepreload";

test("the home JS aggregate excludes exactly the deferred preload prefixes", () => {
	const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
		"size-limit": Array<{ name: string; path: string | string[] }>;
	};
	const aggregate = pkg["size-limit"].find(
		(entry) => entry.name === "js (home boot aggregate)",
	);
	expect(aggregate).toBeDefined();
	expect(aggregate?.path).toEqual([
		"dist/client/assets/*.js",
		...DEFERRED_CHUNK_PREFIXES.map(
			(prefix) => `!dist/client/assets/${prefix}*.js`,
		),
	]);
});
