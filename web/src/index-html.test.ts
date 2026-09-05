import { expect, test } from "vitest";

import indexHtml from "../index.html?raw";

test("keeps the English document language and static home copy", () => {
	expect(indexHtml).toContain('<html lang="en">');
	expect(indexHtml).toContain("Start design‑forward. Stay lean.");
});
