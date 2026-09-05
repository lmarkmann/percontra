import { expect, test } from "vitest";

import { cn } from "@/lib/utils";

test("joins truthy class names and drops falsy ones", () => {
	expect(cn("a", false, "b", undefined, null, "c")).toBe("a b c");
});

test("merges conflicting Tailwind utilities, last wins", () => {
	expect(cn("px-2", "px-4")).toBe("px-4");
	expect(cn("text-sm", "text-lg")).toBe("text-lg");
});

test("resolves conditional objects and arrays", () => {
	expect(cn(["p-2", { hidden: false, block: true }])).toBe("p-2 block");
});
