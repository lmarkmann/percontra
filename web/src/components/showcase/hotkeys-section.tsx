import { useCallback, useState } from "react";

import { Chord } from "@/components/chord";
import { HotkeyRecorder } from "@/components/hotkey-recorder";
import { ShowcaseSection } from "@/components/showcase/showcase-section";
import { Card, CardContent } from "@/components/ui/card";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { formatHotkey } from "@/lib/hotkey";

export function HotkeysSection() {
	const [summon, setSummon] = useState("Super+Shift+Space");
	const [local, setLocal] = useState("Super+K");

	const commitSummon = useCallback(async (accelerator: string) => {
		setSummon(accelerator);
		return null;
	}, []);

	const commitLocal = useCallback(async (accelerator: string) => {
		if (accelerator === "Super+Shift+Space") {
			return "Already used by the summon hotkey.";
		}
		setLocal(accelerator);
		return null;
	}, []);

	return (
		<ShowcaseSection
			slug="keyboard-shortcuts"
			figure="14 / Hotkeys"
			title="Keyboard shortcuts"
			description="Chord visualization for menus and tooltips, plus a click-to-record control for settings."
		>
			<div className="flex flex-col gap-4">
				<Card>
					<CardContent className="flex flex-col gap-4 pt-(--card-spacing)">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<p className="text-caption text-muted-foreground">
								Read-only chords (history slots, menus)
							</p>
							<div className="flex flex-wrap items-center gap-3">
								<Chord value="Super+1" size="sm" />
								<Chord value="Super+2" size="sm" />
								<Chord value="Control+Shift+P" size="sm" />
							</div>
						</div>
						<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
							<p className="text-caption text-muted-foreground">
								Compact menu string via{" "}
								<span className="font-mono text-foreground">formatHotkey</span>
							</p>
							<KbdGroup>
								<Kbd>{formatHotkey(summon)}</Kbd>
							</KbdGroup>
						</div>
					</CardContent>
				</Card>

				<Card size="sm">
					<CardContent className="p-0">
						<div className="divide-y divide-border">
							<HotkeyRecorder
								value={summon}
								onCommit={commitSummon}
								label="Summon hotkey"
								description="Show or hide the panel from anywhere."
								requireModifier
							/>
							<HotkeyRecorder
								value={local}
								onCommit={commitLocal}
								label="Command palette"
								description="In-app shortcut. Try Super+Shift+Space to see a conflict error."
								requireModifier
							/>
						</div>
					</CardContent>
				</Card>
			</div>
		</ShowcaseSection>
	);
}
