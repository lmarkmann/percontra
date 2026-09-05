import {
	type ModId,
	keyGlyph,
	modGlyph,
	modSubLabel,
	parseChord,
} from "@/lib/hotkey";
import { cn } from "@/lib/utils";

export type KeycapState = "idle" | "active" | "pressed" | "awaiting";
export type KeycapSize = "sm" | "md";

const LOOK: Record<KeycapState, string> = {
	idle: "border-transparent bg-muted text-muted-foreground",
	active:
		"border-border bg-card text-foreground shadow-[0_var(--keycap-lip)_0_0_var(--color-input)]",
	pressed: "border-primary/40 bg-primary/10 text-primary",
	awaiting: "border-primary/40 bg-card text-primary/70 animate-pulse",
};

export function Keycap({
	state,
	size,
	glyph,
	sub,
	flexible,
	className,
}: {
	state: KeycapState;
	size: KeycapSize;
	glyph: string;
	sub?: string;
	flexible?: boolean;
	className?: string;
}) {
	const md = size === "md";
	return (
		<div
			data-slot="keycap"
			data-state={state}
			className={cn(
				"duration-fast relative flex flex-col items-center justify-center border ease-out",
				"motion-safe:transition-[transform,box-shadow,background-color,color,border-color]",
				md
					? "h-11 rounded-md [--keycap-lip:2px]"
					: "h-5 rounded [--keycap-lip:1.5px]",
				md
					? flexible
						? "min-w-0 flex-1"
						: "w-12 shrink-0"
					: "min-w-5 shrink-0 px-1",
				state === "pressed" &&
					"motion-safe:translate-y-[var(--keycap-lip)] motion-safe:scale-[0.97]",
				LOOK[state],
				className,
			)}
		>
			<span
				className={cn(
					"leading-none",
					md ? "text-[15px]" : "text-[10px]",
					!sub && "font-medium",
				)}
			>
				{glyph}
			</span>
			{sub ? (
				<span className="mt-1 text-[8.5px] tracking-wide opacity-70">
					{sub}
				</span>
			) : null}
		</div>
	);
}

/** Read-only visualization of a chord; renders only keys present in the value. */
export function Chord({
	value,
	size = "sm",
	className,
}: {
	value: string;
	size?: KeycapSize;
	className?: string;
}) {
	const { mods, key } = parseChord(value);
	return (
		<span
			data-slot="chord"
			className={cn("inline-flex items-center gap-1 align-middle", className)}
		>
			{mods.map((m: ModId) => (
				<Keycap
					key={m}
					state="active"
					size={size}
					glyph={modGlyph(m)}
					sub={size === "md" ? modSubLabel(m) : undefined}
				/>
			))}
			{key ? <Keycap state="active" size={size} glyph={keyGlyph(key)} /> : null}
		</span>
	);
}
