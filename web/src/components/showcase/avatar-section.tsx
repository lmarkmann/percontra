import { ShowcaseSection } from "@/components/showcase/showcase-section";
import {
	Avatar,
	AvatarBadge,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
} from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

export function AvatarSection() {
	return (
		<ShowcaseSection
			slug="avatars"
			figure="05 / Identity"
			title="Avatars"
			description="Size scale, badge, and group composition."
		>
			<Card>
				<CardContent className="flex flex-wrap items-center gap-6 pt-(--card-spacing)">
					<Avatar size="sm">
						<AvatarFallback>SM</AvatarFallback>
					</Avatar>
					<Avatar>
						<AvatarFallback>MD</AvatarFallback>
						<AvatarBadge status="success" aria-label="Online" />
					</Avatar>
					<Avatar size="lg">
						<AvatarFallback>LG</AvatarFallback>
					</Avatar>
					<AvatarGroup>
						<Avatar size="sm">
							<AvatarFallback>A</AvatarFallback>
						</Avatar>
						<Avatar size="sm">
							<AvatarFallback>B</AvatarFallback>
						</Avatar>
						<AvatarGroupCount>+4</AvatarGroupCount>
					</AvatarGroup>
				</CardContent>
			</Card>
		</ShowcaseSection>
	);
}
