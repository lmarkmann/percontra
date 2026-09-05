/**
 * Chord parsing and keyboard token helpers for shortcut UI.
 * Canonical form is Mod+Mod+Key (e.g. Super+Shift+K, Control+1).
 * Tolerant of aliases (Cmd/Meta/Option/Ctrl) and bare glyphs (⌘1).
 */

export type ModId = "Control" | "Alt" | "Shift" | "Super";

export const MODIFIER_ORDER: readonly ModId[] = [
	"Control",
	"Alt",
	"Shift",
	"Super",
] as const;

function isMacPlatform(): boolean {
	if (typeof navigator === "undefined") return false;
	return /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
}

export function modGlyph(mod: ModId): string {
	if (mod === "Control") return "⌃";
	if (mod === "Alt") return "⌥";
	if (mod === "Shift") return "⇧";
	return isMacPlatform() ? "⌘" : "⊞";
}

export function modSubLabel(mod: ModId): string {
	if (mod === "Control") return "ctrl";
	if (mod === "Alt") return isMacPlatform() ? "opt" : "alt";
	if (mod === "Shift") return "shift";
	return isMacPlatform() ? "cmd" : "win";
}

const KEY_GLYPH: Record<string, string> = {
	SPACE: "space",
	ENTER: "return",
	TAB: "⇥",
	BACKSPACE: "⌫",
	DELETE: "⌦",
	ARROWUP: "↑",
	ARROWDOWN: "↓",
	ARROWLEFT: "←",
	ARROWRIGHT: "→",
};

const GLYPH_MOD: Record<string, ModId> = {
	"⌃": "Control",
	"⌥": "Alt",
	"⇧": "Shift",
	"⌘": "Super",
	"⊞": "Super",
};

const NAMED_KEYS = new Set([
	"Space",
	"Enter",
	"Tab",
	"Backspace",
	"Delete",
	"ArrowUp",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
]);

const PUNCTUATION = new Set([
	"Minus",
	"Equal",
	"BracketLeft",
	"BracketRight",
	"Semicolon",
	"Quote",
	"Backquote",
	"Backslash",
	"Comma",
	"Period",
	"Slash",
]);

export function keyGlyph(token: string | null): string {
	if (!token) return "";
	const upper = token.toUpperCase();
	if (KEY_GLYPH[upper]) return KEY_GLYPH[upper];
	if (upper.startsWith("KEY")) return upper.slice(3);
	if (upper.startsWith("DIGIT")) return upper.slice(5);
	return token.length === 1 ? upper : token;
}

export function parseChord(value: string): {
	mods: ModId[];
	key: string | null;
} {
	const present = new Set<ModId>();
	let key: string | null = null;
	for (const raw of value.split("+")) {
		const token = raw.trim();
		if (!token) continue;
		if (GLYPH_MOD[token]) {
			present.add(GLYPH_MOD[token]);
			continue;
		}
		switch (token.toUpperCase()) {
			case "CONTROL":
			case "CTRL":
				present.add("Control");
				break;
			case "ALT":
			case "OPTION":
				present.add("Alt");
				break;
			case "SHIFT":
				present.add("Shift");
				break;
			case "COMMAND":
			case "CMD":
			case "SUPER":
			case "META":
			case "COMMANDORCONTROL":
			case "COMMANDORCTRL":
			case "CMDORCTRL":
			case "CMDORCONTROL":
				present.add("Super");
				break;
			default:
				key = token;
		}
	}
	return {
		mods: MODIFIER_ORDER.filter((m) => present.has(m)),
		key,
	};
}

export function eventModifiers(e: KeyboardEvent): Set<ModId> {
	const mods = new Set<ModId>();
	if (e.ctrlKey) mods.add("Control");
	if (e.altKey) mods.add("Alt");
	if (e.shiftKey) mods.add("Shift");
	if (e.metaKey) mods.add("Super");
	return mods;
}

/** Maps a physical KeyboardEvent.code to a chord token. */
export function codeToToken(code: string): string | null {
	if (/^Key[A-Z]$/.test(code)) return code.slice(3);
	if (/^Digit[0-9]$/.test(code)) return code.slice(5);
	if (/^F\d{1,2}$/.test(code)) return code;
	if (NAMED_KEYS.has(code) || PUNCTUATION.has(code)) return code;
	return null;
}

export function isModifierKey(key: string): boolean {
	return (
		key === "Shift" || key === "Control" || key === "Alt" || key === "Meta"
	);
}

/** Canonical accelerator string: Super+Shift+K. */
export function formatAccelerator(mods: Iterable<ModId>, key: string): string {
	const ordered = MODIFIER_ORDER.filter((m) =>
		mods instanceof Set ? mods.has(m) : [...mods].includes(m),
	);
	return [...ordered, key].join("+");
}

/** Compact display string for menus (⌘⇧K on Mac, Ctrl+Shift+K elsewhere). */
export function formatHotkey(canonical: string): string {
	const { mods, key } = parseChord(canonical);
	const mac = isMacPlatform();
	const parts = mods.map((m) => {
		if (mac) return modGlyph(m);
		if (m === "Control") return "Ctrl";
		if (m === "Alt") return "Alt";
		if (m === "Shift") return "Shift";
		return "Win";
	});
	if (key) parts.push(keyGlyph(key) || key);
	return parts.join(mac ? "" : "+");
}
