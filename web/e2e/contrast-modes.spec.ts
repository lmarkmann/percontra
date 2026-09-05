import { expect, test } from "@playwright/test";

// The two contrast modes beyond light and dark. Both are override layers in
// src/styles/theme-tokens.css and src/styles/utilities.css, and neither can be
// checked by a contrast calculator: forced-colors replaces the palette at the
// UA level, so the only way to know what survives is to render it.
test.describe("contrast modes", () => {
	test("forced-colors keeps focus and surface boundaries visible", async ({
		page,
	}) => {
		await page.emulateMedia({ forcedColors: "active" });
		await page.goto("/states");
		await page.getByRole("heading", { name: "States review" }).waitFor();

		const probe = await page.evaluate(() => {
			const button = document.querySelector("button");
			button?.focus();
			// classList, not className: the latter is an SVGAnimatedString on SVG
			// elements and querySelectorAll("*") returns those too.
			const boundary = [...document.querySelectorAll("*")].find((el) =>
				el.classList.contains("shadow-border"),
			);
			const focused = document.activeElement;
			return {
				active: matchMedia("(forced-colors: active)").matches,
				// The premise of the whole block: this mode drops box-shadow, so
				// anything expressing a boundary or a ring through it disappears.
				focusBoxShadow: focused && getComputedStyle(focused).boxShadow,
				focusOutlineStyle: focused && getComputedStyle(focused).outlineStyle,
				focusOutlineWidth: focused && getComputedStyle(focused).outlineWidth,
				boundaryOutlineStyle:
					boundary && getComputedStyle(boundary).outlineStyle,
			};
		});

		expect(probe.active).toBe(true);
		expect(probe.focusBoxShadow).toBe("none");
		expect(probe.focusOutlineStyle).toBe("solid");
		expect(probe.focusOutlineWidth).toBe("3px");
		expect(probe.boundaryOutlineStyle).toBe("solid");
	});

	test("prefers-contrast raises muted text and borders off their defaults", async ({
		page,
	}) => {
		await page.goto("/states");
		const read = () =>
			page.evaluate(() => {
				const style = getComputedStyle(document.documentElement);
				return {
					mutedForeground: style.getPropertyValue("--muted-foreground").trim(),
					border: style.getPropertyValue("--border").trim(),
				};
			});

		const normal = await read();
		await page.emulateMedia({ contrast: "more" });
		const more = await read();

		expect(more.mutedForeground).not.toBe(normal.mutedForeground);
		expect(more.border).not.toBe(normal.border);
	});
});
