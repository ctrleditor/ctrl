/**
 * Keybind Executor - Maps command names to action handlers
 * This is the single source of truth for what commands do
 *
 * Command names from config.toml keybinds:
 * {
 *   "normal": { "i": "enter_insert", "v": "enter_visual", ... },
 *   "insert": { "escape": "enter_normal", ... },
 *   ...
 * }
 */

import type { AppState } from "../../types/app";
import type { ModalState, Position } from "../../types/index";
import { deleteRange, insertText } from "../buffer";
import { closeHelpMenu, toggleHelpMenu } from "../modal";

/**
 * Command handler function type
 * Pure function: (state, context) → newState
 */
export type CommandHandler = (
	state: AppState,
	context: CommandContext
) => AppState;

/**
 * Context passed to command handlers
 */
export interface CommandContext {
	key: string;
	mode: string;
	ctrl?: boolean;
	shift?: boolean;
	meta?: boolean;
}

/**
 * All available commands with their handlers
 */
const commandHandlers: Record<string, CommandHandler> = {
	// Normal mode navigation and mode changes
	enter_insert: (state) => ({
		...state,
		modal: { ...state.modal, currentMode: "insert", previousMode: "normal" },
	}),

	enter_visual: (state) => ({
		...state,
		modal: { ...state.modal, currentMode: "visual", previousMode: "normal" },
		selection: {
			anchor: state.modal.cursorPosition,
			active: state.modal.cursorPosition,
		},
	}),

	enter_visual_line: (state) => {
		const lines = state.buffer.content.split("\n");
		const lineLength = lines[state.modal.cursorPosition.line]?.length ?? 0;
		return {
			...state,
			modal: { ...state.modal, currentMode: "visual-line", previousMode: "normal" },
			selection: {
				anchor: { line: state.modal.cursorPosition.line, column: 0 },
				active: { line: state.modal.cursorPosition.line, column: lineLength },
			},
		};
	},

	enter_visual_block: (state) => ({
		...state,
		modal: { ...state.modal, currentMode: "visual-block", previousMode: "normal" },
		selection: {
			anchor: state.modal.cursorPosition,
			active: state.modal.cursorPosition,
		},
	}),

	enter_command: (state) => ({
		...state,
		modal: {
			...state.modal,
			currentMode: "command",
			previousMode: "normal",
			commandBuffer: "",
		},
	}),

	// Navigation
	move_left: (state) => {
		const newPos = clampCursorPosition(
			{
				line: state.modal.cursorPosition.line,
				column: state.modal.cursorPosition.column - 1,
			},
			state.buffer.content
		);

		// Handle selection update in visual mode
		if (isVisualMode(state.modal.currentMode) && state.selection) {
			return {
				...state,
				modal: { ...state.modal, cursorPosition: newPos },
				selection: updateSelectionForMovement(
					state.selection,
					newPos,
					state.modal.currentMode,
					state.buffer.content
				),
			};
		}

		return {
			...state,
			modal: { ...state.modal, cursorPosition: newPos },
		};
	},

	move_right: (state) => {
		const newPos = clampCursorPosition(
			{
				line: state.modal.cursorPosition.line,
				column: state.modal.cursorPosition.column + 1,
			},
			state.buffer.content
		);

		// Handle selection update in visual mode
		if (isVisualMode(state.modal.currentMode) && state.selection) {
			return {
				...state,
				modal: { ...state.modal, cursorPosition: newPos },
				selection: updateSelectionForMovement(
					state.selection,
					newPos,
					state.modal.currentMode,
					state.buffer.content
				),
			};
		}

		return {
			...state,
			modal: { ...state.modal, cursorPosition: newPos },
		};
	},

	move_up: (state) => {
		const newPos = clampCursorPosition(
			{
				line: state.modal.cursorPosition.line - 1,
				column: state.modal.cursorPosition.column,
			},
			state.buffer.content
		);

		// Handle selection update in visual mode
		if (isVisualMode(state.modal.currentMode) && state.selection) {
			return {
				...state,
				modal: { ...state.modal, cursorPosition: newPos },
				selection: updateSelectionForMovement(
					state.selection,
					newPos,
					state.modal.currentMode,
					state.buffer.content
				),
			};
		}

		return {
			...state,
			modal: { ...state.modal, cursorPosition: newPos },
		};
	},

	move_down: (state) => {
		const newPos = clampCursorPosition(
			{
				line: state.modal.cursorPosition.line + 1,
				column: state.modal.cursorPosition.column,
			},
			state.buffer.content
		);

		// Handle selection update in visual mode
		if (isVisualMode(state.modal.currentMode) && state.selection) {
			return {
				...state,
				modal: { ...state.modal, cursorPosition: newPos },
				selection: updateSelectionForMovement(
					state.selection,
					newPos,
					state.modal.currentMode,
					state.buffer.content
				),
			};
		}

		return {
			...state,
			modal: { ...state.modal, cursorPosition: newPos },
		};
	},

	paste: (state) => {
		if (!state.clipboard) return state;

		const newBuffer = insertText(state.buffer, state.modal.cursorPosition, state.clipboard);
		return {
			...state,
			buffer: newBuffer,
			modal: {
				...state.modal,
				cursorPosition: {
					line: state.modal.cursorPosition.line,
					column: state.modal.cursorPosition.column + state.clipboard.length,
				},
			},
		};
	},

	// Insert mode commands
	enter_normal: (state) => ({
		...state,
		modal: { ...state.modal, currentMode: "normal", previousMode: "insert" },
		selection: null,
	}),

	delete_char: (state) => {
		const { cursorPosition } = state.modal;
		if (cursorPosition.column === 0 && cursorPosition.line === 0) {
			return state;
		}

		const deletePos =
			cursorPosition.column > 0
				? { line: cursorPosition.line, column: cursorPosition.column - 1 }
				: {
						line: cursorPosition.line - 1,
						column: state.buffer.content.split("\n")[cursorPosition.line - 1]?.length ?? 0,
					};

		const updatedBuffer = deleteRange(state.buffer, {
			start: deletePos,
			end: cursorPosition,
		});

		return {
			...state,
			buffer: updatedBuffer,
			modal: {
				...state.modal,
				cursorPosition: deletePos,
			},
		};
	},

	insert_newline: (state) => {
		const newBuffer = insertText(state.buffer, state.modal.cursorPosition, "\n");
		return {
			...state,
			buffer: newBuffer,
			modal: {
				...state.modal,
				cursorPosition: {
					line: state.modal.cursorPosition.line + 1,
					column: 0,
				},
			},
		};
	},

	// Visual mode commands
	exit_visual: (state) => ({
		...state,
		modal: { ...state.modal, currentMode: "normal", previousMode: state.modal.currentMode },
		selection: null,
	}),

	delete_selection: (state) => {
		if (!state.selection) return state;

		const { start, end } = normalizeSelection(state.selection);
		const updatedBuffer = deleteRange(state.buffer, { start, end });

		return {
			...state,
			buffer: updatedBuffer,
			modal: {
				...state.modal,
				currentMode: "normal",
				previousMode: state.modal.currentMode,
				cursorPosition: start,
			},
			selection: null,
		};
	},

	yank_selection: (state) => {
		if (!state.selection) return state;

		const lines = state.buffer.content.split("\n");
		const { start, end } = normalizeSelection(state.selection);
		let selectedText = "";

		if (start.line === end.line) {
			selectedText = lines[start.line]?.slice(start.column, end.column) ?? "";
		} else {
			const selectedLines: string[] = [];
			selectedLines.push(lines[start.line]?.slice(start.column) ?? "");
			for (let i = start.line + 1; i < end.line; i++) {
				selectedLines.push(lines[i] ?? "");
			}
			selectedLines.push(lines[end.line]?.slice(0, end.column) ?? "");
			selectedText = selectedLines.join("\n");
		}

		return {
			...state,
			clipboard: selectedText,
			modal: {
				...state.modal,
				currentMode: "normal",
				previousMode: state.modal.currentMode,
			},
			selection: null,
		};
	},

	// Command mode commands
	execute_command: (state) => {
		const command = state.modal.commandBuffer.trim();

		// Handle /theme <name> command
		if (command.startsWith("theme ")) {
			// Command executed - clear buffer and return to normal
			// Note: Theme switching is handled in main app loop via config hot-reload
		}

		// Default: just clear and return to normal
		return {
			...state,
			modal: {
				...state.modal,
				currentMode: "normal",
				previousMode: "command",
				commandBuffer: "",
			},
		};
	},

	exit_command: (state) => ({
		...state,
		modal: {
			...state.modal,
			currentMode: "normal",
			previousMode: "command",
			commandBuffer: "",
		},
	}),

	delete_command_char: (state) => ({
		...state,
		modal: {
			...state.modal,
			commandBuffer: state.modal.commandBuffer.slice(0, -1),
		},
	}),

	// Global commands
	toggle_help: (state) => ({
		...state,
		modal: toggleHelpMenu(state.modal),
	}),

	close_help: (state) => ({
		...state,
		modal: closeHelpMenu(state.modal),
	}),
};

/**
 * Execute a command by name
 */
export const executeCommand = (
	commandName: string,
	state: AppState,
	context: CommandContext
): AppState => {
	const handler = commandHandlers[commandName];
	if (!handler) {
		// Unknown command - return state unchanged
		return state;
	}

	return handler(state, context);
};

/**
 * Get all available commands (for help menu, etc.)
 */
export const getAvailableCommands = (): string[] => {
	return Object.keys(commandHandlers);
};

// ============================================================================
// Helper functions (copied from renderer.tsx for use in handlers)
// ============================================================================

/**
 * Clamp cursor position to valid bounds
 */
const clampCursorPosition = (
	pos: { line: number; column: number },
	buffer: string
): { line: number; column: number } => {
	const lines = buffer.split("\n");
	const line = Math.max(0, Math.min(pos.line, lines.length - 1));
	const column = Math.max(0, Math.min(pos.column, lines[line]?.length ?? 0));
	return { line, column };
};

/**
 * Check if mode is a visual variant
 */
const isVisualMode = (mode: string): boolean => {
	return mode === "visual" || mode === "visual-line" || mode === "visual-block";
};

/**
 * Get length of a specific line in the buffer
 */
const getLineLength = (buffer: string, line: number): number => {
	const lines = buffer.split("\n");
	return lines[line]?.length ?? 0;
};

/**
 * Normalize selection so start is before end
 */
const normalizeSelection = (sel: {
	anchor: Position;
	active: Position;
}): { start: Position; end: Position } => {
	const { anchor, active } = sel;
	if (anchor.line < active.line || (anchor.line === active.line && anchor.column <= active.column)) {
		return { start: anchor, end: active };
	}
	return { start: active, end: anchor };
};

/**
 * Update selection when cursor moves in visual mode
 */
const updateSelectionForMovement = (
	selection: { anchor: Position; active: Position },
	newCursor: Position,
	mode: string,
	buffer: string
): { anchor: Position; active: Position } => {
	if (mode === "visual-line") {
		// Visual-line mode: always select full lines
		const anchorLine = selection.anchor.line;
		const newLineLength = getLineLength(buffer, newCursor.line);

		return {
			anchor: { line: anchorLine, column: 0 },
			active: { line: newCursor.line, column: newLineLength },
		};
	}

	if (mode === "visual-block") {
		// Visual-block mode: rectangular selection
		const startLine = Math.min(selection.anchor.line, newCursor.line);
		const endLine = Math.max(selection.anchor.line, newCursor.line);
		const startCol = Math.min(selection.anchor.column, newCursor.column);
		const endCol = Math.max(selection.anchor.column, newCursor.column);

		return {
			anchor: { line: startLine, column: startCol },
			active: { line: endLine, column: endCol },
		};
	}

	// Regular visual mode
	return {
		anchor: selection.anchor,
		active: newCursor,
	};
};
