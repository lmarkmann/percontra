import { expect, test } from "vitest";

import indexHtml from "../index.html?raw";

test("keeps the English document language", () => {
	expect(indexHtml).toContain('<html lang="en">');
});

test("the first paint is the access gate, not product content", () => {
	// The shell is served to anyone who loads the origin, so it may not carry
	// anything the gate exists to withhold.
	expect(indexHtml).toContain("This demo is not open yet");
	expect(indexHtml).not.toContain("vite-template");
	expect(indexHtml).not.toMatch(/href="\/(showcase|login|review|release)"/);
});
