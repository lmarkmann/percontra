import { createFileRoute } from "@tanstack/react-router";

import { MigrationDesk } from "@/features/migration/migration-desk";
import { routeSeo, seoHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
	head: () => seoHead(routeSeo.home),
	component: MigrationDesk,
});
