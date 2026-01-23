/**
 * Keybind matcher - Parses and matches keybind strings
 * Handles format like "ctrl+c", "shift+v", "escape", "return", etc.
 */

export interface ParsedKeybind {
	key: string;
	ctrl: boolean;
	shift: boolean;
	meta: boolean;
}

/**
 * Parse a keybind string into its components
 * Examples:
 *   "c" → { key: "c", ctrl: false, shift: false, meta: false }
 *   "ctrl+c" → { key: "c", ctrl: true, shift: false, meta: false }
 *   "shift+v" → { key: "v", ctrl: false, shift: true, meta: false }
 *   "ctrl+shift+s" → { key: "s", ctrl: true, shift: true, meta: false }
 */
export const parseKeybind = (bindStr: string): ParsedKeybind => {
	const parts = bindStr.toLowerCase().trim().split("+");
	const modifiers = {
		ctrl: false,
		shift: false,
		meta: false,
	};

	let key = "";

	for (const part of parts) {
		if (part === "ctrl") {
			modifiers.ctrl = true;
		} else if (part === "shift") {
			modifiers.shift = true;
		} else if (part === "meta") {
			modifiers.meta = true;
		} else if (part) {
			// Last part is the key
			key = part;
		}
	}

	return {
		key,
		...modifiers,
	};
};

/**
 * Check if a key + modifiers match a keybind pattern
 * Pattern can be simple (single key) or with modifiers
 */
export const matchesKeybind = (
	pattern: string,
	key: string,
	keyEvent?: { ctrl?: boolean; shift?: boolean; meta?: boolean }
): boolean => {
	const parsed = parseKeybind(pattern);
	const normalizedKey = key.toLowerCase();

	// Handle special keys that are often written out
	const specialKeys: Record<string, string> = {
		escape: "escape",
		return: "return",
		enter: "return",
		backspace: "backspace",
		tab: "tab",
		delete: "delete",
		" ": " ",
		"space": " ",
	};

	// Check key match (with special key handling)
	const patternKey = specialKeys[parsed.key] || parsed.key;
	const incomingKey = specialKeys[normalizedKey] || normalizedKey;

	if (patternKey !== incomingKey) {
		return false;
	}

	// Check modifiers
	const ctrl = keyEvent?.ctrl ?? false;
	const shift = keyEvent?.shift ?? false;
	const meta = keyEvent?.meta ?? false;

	return parsed.ctrl === ctrl && parsed.shift === shift && parsed.meta === meta;
};

/**
 * Find which command in keybinds matches the current keystroke
 * Returns the command name if found, undefined otherwise
 */
export const findCommand = (
	keybinds: Record<string, string>,
	key: string,
	keyEvent?: { ctrl?: boolean; shift?: boolean; meta?: boolean }
): string | undefined => {
	for (const [pattern, command] of Object.entries(keybinds)) {
		if (matchesKeybind(pattern, key, keyEvent)) {
			return command;
		}
	}
	return undefined;
};

/**
 * Build a human-readable keybind string
 * Useful for help menu, etc.
 * Example: { key: "c", ctrl: true } → "Ctrl+C"
 */
export const formatKeybind = (parsed: ParsedKeybind): string => {
	const parts: string[] = [];

	if (parsed.ctrl) parts.push("Ctrl");
	if (parsed.shift) parts.push("Shift");
	if (parsed.meta) parts.push("Meta");

	// Special key names
	const specialKeys: Record<string, string> = {
		escape: "Esc",
		return: "Enter",
		enter: "Enter",
		backspace: "Backspace",
		tab: "Tab",
		delete: "Delete",
		" ": "Space",
	};

	const keyName = specialKeys[parsed.key] || parsed.key.toUpperCase();
	parts.push(keyName);

	return parts.join("+");
};

/**
 * Generate a help string for a keybind
 * Example: "Ctrl+P" for help toggle
 */
export const getKeybindHelp = (pattern: string): string => {
	return formatKeybind(parseKeybind(pattern));
};
