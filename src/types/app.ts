/**
 * Application state types
 */

import type { KeybindsType, UIConfigType } from "../config/schema";
import type { ModalState, Selection, TextBuffer } from "./index";
import type { SyntaxHighlighting } from "./syntax";

/**
 * Application command registry type
 * Returned by createRegistry
 */
export interface CommandRegistry {
	readonly commands: Map<string, unknown>;
}

/**
 * Complete application state
 * Immutable container of all app state
 */
export interface AppState {
	readonly buffer: TextBuffer;
	readonly modal: ModalState;
	readonly commandRegistry: CommandRegistry;
	readonly config: {
		readonly ui: UIConfigType;
		readonly keybinds: KeybindsType;
	};
	readonly selection: Selection | null;
	readonly clipboard: string; // Register for yank/paste
	readonly syntax: SyntaxHighlighting | null; // Syntax highlighting tokens
}
