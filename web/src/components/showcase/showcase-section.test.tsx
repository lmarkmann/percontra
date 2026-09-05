import { render } from "@testing-library/react";
import { expect, test } from "vitest";

import { ShowcaseSection } from "@/components/showcase/showcase-section";

test("uses the stable slug instead of translated title copy", () => {
	const { container } = render(
		<ShowcaseSection slug="type-scale" title="Typografie">
			content
		</ShowcaseSection>,
	);

	expect(container.querySelector("section")).toHaveAttribute(
		"id",
		"showcase-type-scale",
	);
});
