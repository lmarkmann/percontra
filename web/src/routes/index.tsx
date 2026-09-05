import { createFileRoute } from "@tanstack/react-router";

import { MigrationDesk } from "@/features/migration/migration-desk";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: "Percontra | Migration review" },
			{ name: "robots", content: "noindex,nofollow" },
		],
	}),
	component: MigrationDesk,
});
