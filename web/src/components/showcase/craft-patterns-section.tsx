import { useEffect, useState } from "react";

import { DocsButton } from "@/components/docs-button";
import { LogoTraceLoader } from "@/components/logo-trace-loader";
import { OrbitBadge } from "@/components/orbit-badge";
import { ScrambleText } from "@/components/scramble-text";
import { ScrollFadeList } from "@/components/scroll-fade-list";
import { ShowcaseSection } from "@/components/showcase/showcase-section";
import { SuccessConfirm } from "@/components/success-confirm";
import { Button } from "@/components/ui/button";

const fadeItems = [
	"Scrollbar edge mask softens hard boxes on overflow.",
	"Success motion is a small check pulse, not confetti.",
	"Docs button opens with a restrained book press.",
	"Scramble text decodes on enter; reduced-motion shows final copy.",
	"Logo trace loader is an optional brand loading path.",
	"Superellipse is opt-in via rounded-superellipse, not the default radius.",
	"Primitive gray and accent ramps support multi-tenant products.",
	"Offline chat queue persists through IndexedDB when available.",
] as const;

export function CraftPatternsSection() {
	const [saved, setSaved] = useState(false);
	const [traceComplete, setTraceComplete] = useState(false);

	// Demo cycle so the loader's payoff (trace closes, fill fades in) actually
	// plays: loop ~2.6s, complete, hold the filled mark ~2.2s, loop again.
	useEffect(() => {
		const timer = window.setTimeout(
			() => setTraceComplete(!traceComplete),
			traceComplete ? 2200 : 2600,
		);
		return () => window.clearTimeout(timer);
	}, [traceComplete]);

	return (
		<ShowcaseSection
			slug="bookmark-craft-patterns"
			figure="15 / Craft patterns"
			title="Bookmark craft patterns"
			description="Edge masks, success check, docs CTA, scramble text, orbit badge, and logo trace when you need extras."
		>
			<div className="flex flex-col gap-8">
				<div className="flex flex-wrap items-center gap-3">
					<Button
						size="sm"
						onClick={() => {
							setSaved(true);
							window.setTimeout(() => setSaved(false), 1600);
						}}
						data-testid="craft-save"
					>
						Save changes
					</Button>
					<SuccessConfirm show={saved} label="Saved" />
					<DocsButton href="https://github.com/lmarkmann/vite-template" />
					<div className="rounded-superellipse bg-card px-3 py-2 text-caption text-muted-foreground shadow-border">
						superellipse chip
					</div>
				</div>

				<p className="font-mono text-title font-medium tracking-title">
					<ScrambleText>Design-forward, stay lean</ScrambleText>
				</p>

				<div className="flex flex-wrap items-center gap-6">
					<OrbitBadge text="MADE TO LAST" />
					<LogoTraceLoader
						loading
						isComplete={traceComplete}
						size={40}
						ariaLabel="Brand loading trace"
					/>
					<div className="min-w-0 flex-1">
						<p className="mb-2 font-mono text-label tracking-label text-muted-foreground uppercase">
							scroll fade list
						</p>
						<ScrollFadeList
							items={[...fadeItems]}
							getKey={(item) => item}
							renderItem={(item) => (
								<span className="text-caption text-foreground">{item}</span>
							)}
							className="max-w-md"
							scrollClassName="h-40"
						/>
					</div>
				</div>
			</div>
		</ShowcaseSection>
	);
}
