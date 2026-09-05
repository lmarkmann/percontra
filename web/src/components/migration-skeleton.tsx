import { Skeleton } from "@/components/ui/skeleton";

/**
 * Layout-matched placeholder for the migration overview.
 *
 * The boxes are the boxes: three batch cards over a six-row ledger, at the same
 * geometry the ready view uses. A skeleton that does not match its final layout
 * trades a blank screen for a layout shift, which is the worse of the two.
 */
export function MigrationSkeleton() {
	return (
		<div className="space-y-6">
			<div className="grid gap-3 md:grid-cols-3">
				{[0, 1, 2].map((card) => (
					<div key={card} className="space-y-3 rounded-xl border bg-card p-4">
						<Skeleton className="h-4 w-2/3" />
						<Skeleton className="h-3 w-1/3" />
						<Skeleton className="h-6 w-1/2" />
					</div>
				))}
			</div>
			<div className="rounded-xl border bg-card">
				<div className="flex gap-4 border-b px-4 py-2.5">
					<Skeleton className="h-3 w-40" />
					<Skeleton className="h-3 w-20" />
					<Skeleton className="ml-auto h-3 w-28" />
				</div>
				{[0, 1, 2, 3, 4, 5].map((row) => (
					<div key={row} className="flex items-center gap-4 border-b px-4 py-2">
						<Skeleton className="h-3 w-48" />
						<Skeleton className="h-3 w-16" />
						<Skeleton className="ml-auto h-3 w-24" />
					</div>
				))}
			</div>
		</div>
	);
}
