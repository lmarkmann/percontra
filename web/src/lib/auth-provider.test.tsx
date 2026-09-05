import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { AuthProvider } from "@/lib/auth-provider";

test("AuthProvider renders children when WorkOS client ID is unset", () => {
	render(
		<AuthProvider>
			<span>auth child</span>
		</AuthProvider>,
	);

	expect(screen.getByText("auth child")).toBeInTheDocument();
});
