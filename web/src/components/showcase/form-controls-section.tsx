import { ShowcaseSection } from "@/components/showcase/showcase-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function FormControlsSection() {
	return (
		<ShowcaseSection
			slug="form-controls"
			figure="06 / Forms"
			title="Form controls"
			description="Labeled fields with focus, invalid, and helper copy patterns."
		>
			<Card>
				<CardContent className="pt-(--card-spacing)">
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="showcase-email">Email</FieldLabel>
							<Input
								id="showcase-email"
								type="email"
								placeholder="you@example.com"
							/>
							<FieldDescription>
								We never share your email with third parties.
							</FieldDescription>
						</Field>
						<Field data-invalid="true">
							<FieldLabel htmlFor="showcase-invalid">Work email</FieldLabel>
							<Input
								id="showcase-invalid"
								aria-invalid
								aria-describedby="showcase-invalid-error"
								defaultValue="bad@"
							/>
							<FieldError id="showcase-invalid-error">
								Enter a valid email address.
							</FieldError>
						</Field>
						<Field>
							<FieldLabel htmlFor="showcase-notes">Notes</FieldLabel>
							<Textarea id="showcase-notes" placeholder="Optional context..." />
						</Field>
						<Field>
							<FieldLabel htmlFor="showcase-disabled">Disabled</FieldLabel>
							<Input
								id="showcase-disabled"
								disabled
								defaultValue="Read-only value"
							/>
						</Field>
						<Button loading className="w-fit">
							Saving
						</Button>
					</FieldGroup>
				</CardContent>
			</Card>
		</ShowcaseSection>
	);
}
