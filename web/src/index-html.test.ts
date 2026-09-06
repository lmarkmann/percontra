import { expect, test } from "vitest";

import indexHtml from "../index.html?raw";

test("keeps the English document language", () => {
	expect(indexHtml).toContain('<html lang="en">');
});

test("the first paint is the desk's own header, not a gate", () => {
	// Cloudflare Access is the only gate, so the shell paints what React will
	// replace it with instead of a closed door with no way in.
	expect(indexHtml).toContain("Know what you are signing off.");
	expect(indexHtml).not.toContain("not open yet");
	expect(indexHtml).not.toContain("vite-template");
	expect(indexHtml).not.toMatch(/href="\/(showcase|login|review|release)"/);
});
