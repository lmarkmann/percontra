import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

const uiRoot = "src/components/ui";
const uiSources = readdirSync(uiRoot, { recursive: true })
	.filter(
		(file): file is string =>
			typeof file === "string" &&
			file.endsWith(".tsx") &&
			!file.endsWith(".test.tsx"),
	)
	.map((file) => path.join(uiRoot, file));

test("UI primitives transition only the properties they change", () => {
	for (const sourcePath of uiSources) {
		expect(readFileSync(sourcePath, "utf8")).not.toMatch(/\btransition-all\b/);
	}
});
