import { useCallback, useEffect, useRef, useState } from "react";

import { Keycap } from "@/components/chord";
import {
	type ModId,
	MODIFIER_ORDER,
	codeToToken,
	eventModifiers,
	formatAccelerator,
	isModifierKey,
	keyGlyph,
	modGlyph,
	modSubLabel,
	parseChord,
} from "@/lib/hotkey";
import { cn } from "@/lib/utils";

type HotkeyCommitResult = string | null | Promise<string | null>;

type HotkeyRecorderProps = {
	value: string;
	/** Return an error message to keep the prior binding and show it; null on success. */
	onCommit: (accelerator: string) => HotkeyCommitResult;
	label?: string;
	description?: string;
	/** Shown while recording and waiting for a non-modifier key. */
	recordingHint?: string;
	/** Shown when requireModifier is true and the user presses a bare key. */
	needsModifierHint?: string;
	/** Shown when idle. */
	idleHint?: string;
	ariaLabel?: string;
	/**
	 * When true (default), a bare key without modifiers is rejected.
	 * Use for global / OS-level hotkeys that would otherwise swallow single keys.
	 */
	requireModifier?: boolean;
	className?: string;
};

export function HotkeyRecorder({
	value,
	onCommit,
	label = "Keyboard shortcut",
	description = "Click the keys to record a new shortcut.",
	recordingHint = "listening...",
	needsModifierHint = "hold ⌘ ⌃ ⌥ or ⇧ + a key",
	idleHint = "click to change",
	ariaLabel,
	requireModifier = true,
	className,
}: HotkeyRecorderProps) {
	const bound = parseChord(value);
	const boundMods = new Set(bound.mods);
	const [recording, setRecording] = useState(false);
	const [liveMods, setLiveMods] = useState(new Set<ModId>());
	const [needsModifier, setNeedsModifier] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const rootRef = useRef<HTMLButtonElement>(null);

	const stop = useCallback(() => {
		setRecording(false);
		setLiveMods(new Set());
		setNeedsModifier(false);
	}, []);

	useEffect(() => {
		if (!recording) {
			return undefined;
		}

		const onKeyDown = (e: KeyboardEvent) => {
			e.preventDefault();
			e.stopPropagation();
			if (e.key === "Escape") {
				stop();
				return;
			}
			const mods = eventModifiers(e);
			setLiveMods(mods);
			if (isModifierKey(e.key)) return;
			const token = codeToToken(e.code);
			if (!token) return;
			if (requireModifier && mods.size === 0) {
				setNeedsModifier(true);
				return;
			}
			stop();
			void Promise.resolve(onCommit(formatAccelerator(mods, token))).then(
				setError,
			);
		};

		const onKeyUp = (e: KeyboardEvent) => {
			e.preventDefault();
			setLiveMods(eventModifiers(e));
		};

		const onPointerDown = (e: PointerEvent) => {
			const target = e.target;
			if (
				rootRef.current &&
				target instanceof Node &&
				!rootRef.current.contains(target)
			) {
				stop();
			}
		};

		window.addEventListener("keydown", onKeyDown, true);
		window.addEventListener("keyup", onKeyUp, true);
		window.addEventListener("pointerdown", onPointerDown, true);
		window.addEventListener("blur", stop);
		return () => {
			window.removeEventListener("keydown", onKeyDown, true);
			window.removeEventListener("keyup", onKeyUp, true);
			window.removeEventListener("pointerdown", onPointerDown, true);
			window.removeEventListener("blur", stop);
		};
	}, [recording, onCommit, stop, requireModifier]);

	const keyText = keyGlyph(bound.key);
	const accessibleLabel =
		ariaLabel ??
		`${label.replace(/ hotkey$/i, "")}: ${value.replaceAll("+", " ")}`;

	return (
		<div data-slot="hotkey-recorder" className={cn("px-3 py-2.5", className)}>
			<div className="flex items-baseline justify-between gap-2">
				<div className="text-caption font-medium">{label}</div>
				<span className="font-mono text-label text-muted-foreground">
					{recording
						? needsModifier
							? needsModifierHint
							: recordingHint
						: idleHint}
				</span>
			</div>
			<p
				role={error ? "alert" : undefined}
				className={cn(
					"mt-0.5 mb-2 text-label leading-snug",
					error ? "text-destructive" : "text-muted-foreground",
				)}
			>
				{error ?? description}
			</p>
			<button
				ref={rootRef}
				type="button"
				aria-label={accessibleLabel}
				aria-pressed={recording}
				onClick={() => {
					if (recording) {
						stop();
					} else {
						setError(null);
						setRecording(true);
					}
				}}
				className={cn(
					"flex w-full items-stretch gap-1.5 rounded-lg border p-1.5 transition-colors outline-none",
					"focus-visible:ring-2 focus-visible:ring-ring/50",
					recording
						? "border-primary bg-primary/5"
						: "border-border bg-background hover-fine:hover:bg-muted/40",
				)}
			>
				{MODIFIER_ORDER.map((m) => (
					<Keycap
						key={m}
						size="md"
						state={
							recording
								? liveMods.has(m)
									? "pressed"
									: "idle"
								: boundMods.has(m)
									? "active"
									: "idle"
						}
						glyph={modGlyph(m)}
						sub={modSubLabel(m)}
					/>
				))}
				<Keycap
					size="md"
					state={recording ? "awaiting" : keyText ? "active" : "idle"}
					glyph={recording ? "" : keyText || "-"}
					flexible
				/>
			</button>
		</div>
	);
}
