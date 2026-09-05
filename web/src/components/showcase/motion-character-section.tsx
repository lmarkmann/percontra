import { AnimatePresence, MotionConfig, m } from "motion/react";
import { useState } from "react";

import { ShowcaseSection } from "@/components/showcase/showcase-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { character, panelPresence } from "@/lib/motion";

type Register = "standard" | "productive";

/**
 * Demonstrates product-zone character registers without putting Motion on the
 * entry path. Lives only under MotionShell on /showcase.
 */
export function MotionCharacterSection() {
	const [register, setRegister] = useState<Register>("standard");
	const [pulse, setPulse] = useState(0);

	return (
		<ShowcaseSection
			slug="motion-character"
			figure="11 / Motion"
			title="Motion character"
			description="Standard motion for product UI; productive is denser and faster for admin shells."
		>
			<Card>
				<CardContent className="flex flex-col gap-4 pt-(--card-spacing)">
					<fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0">
						<legend className="sr-only">Motion character</legend>
						{(["standard", "productive"] as const).map((key) => (
							<Button
								key={key}
								size="sm"
								variant={register === key ? "default" : "outline"}
								onClick={() => {
									setRegister(key);
									setPulse((n) => n + 1);
								}}
							>
								{key}
							</Button>
						))}
					</fieldset>

					<MotionConfig reducedMotion="user" transition={character[register]}>
						<div className="min-h-24 rounded-xl border border-dashed p-4">
							<AnimatePresence mode="wait" initial={false}>
								<m.div
									key={`${register}-${pulse}`}
									className="rounded-lg bg-surface-tinted px-4 py-3 text-caption"
									{...panelPresence}
								>
									Register <span className="font-medium">{register}</span>:
									panel enter uses the active MotionConfig transition.
								</m.div>
							</AnimatePresence>
						</div>
					</MotionConfig>
				</CardContent>
			</Card>
		</ShowcaseSection>
	);
}
