/// <reference path="../../node_modules/@opentui/react/jsx-namespace.d.ts" />

/**
 * OpenTUI React Renderer
 * Main rendering engine for Ctrl editor using React and OpenTUI React binding
 */

import type React from "react";

import { createCliRenderer } from "@opentui/core";
import type { KeyEvent } from "@opentui/core/lib/KeyHandler";
import { createRoot } from "@opentui/react";

import type { KeybindsType, UIConfigType } from "../config/schema";
import { deleteRange, insertText } from "../core/buffer";
import { closeHelpMenu, toggleHelpMenu } from "../core/modal";
import type { AppState } from "../types/app";
import type { Position, Selection } from "../types/index";

/**
 * Type for keystroke handler function
 */
export type KeystrokeHandler = (
	state: AppState,
	key: string,
	keyEvent?: { ctrl?: boolean; shift?: boolean; meta?: boolean }
) => AppState;

/**
 * Handle a keystroke and update app state
 * Pure function: state → new state
 */
/**
 * Clamp cursor position to valid bounds within buffer
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
 * Get length of a specific line in the buffer
 */
const getLineLength = (buffer: string, line: number): number => {
	const lines = buffer.split("\n");
	return lines[line]?.length ?? 0;
};

/**
 * Normalize selection so start is before end
 */
const normalizeSelection = (sel: Selection): { start: Position; end: Position } => {
	const { anchor, active } = sel;
	if (anchor.line < active.line || (anchor.line === active.line && anchor.column <= active.column)) {
		return { start: anchor, end: active };
	}
	return { start: active, end: anchor };
};

/**
 * Check if mode is a visual variant
 */
const isVisualMode = (mode: string): boolean => {
	return mode === "visual" || mode === "visual-line" || mode === "visual-block";
};

/**
 * Extract text from a selection range
 */
const extractSelectionText = (buffer: string, sel: Selection): string => {
	const lines = buffer.split("\n");
	const { start, end } = normalizeSelection(sel);

	if (start.line === end.line) {
		// Single line selection
		return lines[start.line]?.slice(start.column, end.column) ?? "";
	}

	// Multi-line selection
	const selectedLines: string[] = [];

	// First line: from start column to end of line
	selectedLines.push(lines[start.line]?.slice(start.column) ?? "");

	// Middle lines: full lines
	for (let i = start.line + 1; i < end.line; i++) {
		selectedLines.push(lines[i] ?? "");
	}

	// Last line: from start to end column
	selectedLines.push(lines[end.line]?.slice(0, end.column) ?? "");

	return selectedLines.join("\n");
};

export const handleKeystroke = (
	state: AppState,
	key: string,
	keyEvent?: { ctrl?: boolean }
): AppState => {
	const { modal } = state;

	// Check for help menu toggle (Ctrl+P) - works in any mode
	if (keyEvent?.ctrl && key === "p") {
		return {
			...state,
			modal: toggleHelpMenu(modal),
		};
	}

	// Close help menu on Escape
	if (key === "escape" && modal.showHelpMenu) {
		return {
			...state,
			modal: closeHelpMenu(modal),
		};
	}

	// Route based on current mode
	if (modal.currentMode === "normal") {
		// Normal mode: commands and navigation
		if (key === "i") {
			return {
				...state,
				modal: { ...modal, currentMode: "insert", previousMode: "normal" },
			};
		}
		if (keyEvent?.ctrl && key === "v") {
			// Enter visual-block mode (Ctrl+V)
			return {
				...state,
				modal: { ...modal, currentMode: "visual-block", previousMode: "normal" },
				selection: {
					anchor: modal.cursorPosition,
					active: modal.cursorPosition,
				},
			};
		}
		if (key === "V") {
			// Enter visual-line mode (Shift+V)
			const lineLength = getLineLength(state.buffer.content, modal.cursorPosition.line);
			return {
				...state,
				modal: { ...modal, currentMode: "visual-line", previousMode: "normal" },
				selection: {
					anchor: { line: modal.cursorPosition.line, column: 0 },
					active: { line: modal.cursorPosition.line, column: lineLength },
				},
			};
		}
		if (key === "v" && !keyEvent?.ctrl) {
			// Enter visual mode (v)
			return {
				...state,
				modal: { ...modal, currentMode: "visual", previousMode: "normal" },
				selection: {
					anchor: modal.cursorPosition,
					active: modal.cursorPosition,
				},
			};
		}
		if (key === ":") {
			return {
				...state,
				modal: {
					...modal,
					currentMode: "command",
					previousMode: "normal",
					commandBuffer: "",
				},
			};
		}
		// Vim-style navigation in normal mode (hjkl)
		if (key === "k") {
			const newPos = clampCursorPosition(
				{ line: modal.cursorPosition.line - 1, column: modal.cursorPosition.column },
				state.buffer.content
			);
			return { ...state, modal: { ...modal, cursorPosition: newPos } };
		}
		if (key === "j") {
			const newPos = clampCursorPosition(
				{ line: modal.cursorPosition.line + 1, column: modal.cursorPosition.column },
				state.buffer.content
			);
			return { ...state, modal: { ...modal, cursorPosition: newPos } };
		}
		if (key === "h") {
			const newPos = clampCursorPosition(
				{ line: modal.cursorPosition.line, column: modal.cursorPosition.column - 1 },
				state.buffer.content
			);
			return { ...state, modal: { ...modal, cursorPosition: newPos } };
		}
		if (key === "l") {
			const newPos = clampCursorPosition(
				{ line: modal.cursorPosition.line, column: modal.cursorPosition.column + 1 },
				state.buffer.content
			);
			return { ...state, modal: { ...modal, cursorPosition: newPos } };
		}
		if (key === "p" && state.clipboard) {
			// Paste clipboard content at cursor position
			const newBuffer = insertText(state.buffer, modal.cursorPosition, state.clipboard);
			return {
				...state,
				buffer: newBuffer,
				modal: {
					...modal,
					cursorPosition: {
						line: modal.cursorPosition.line,
						column: modal.cursorPosition.column + state.clipboard.length,
					},
				},
			};
		}
	}

	// Visual mode: navigation expands selection
	if (isVisualMode(modal.currentMode)) {
		if (key === "escape") {
			// Exit visual mode and clear selection
			return {
				...state,
				modal: { ...modal, currentMode: "normal", previousMode: modal.currentMode },
				selection: null,
			};
		}

		// Delete selection with 'd'
		if (key === "d" && state.selection) {
			const { start, end } = normalizeSelection(state.selection);

			// Delete the selected range
			const updatedBuffer = deleteRange(state.buffer, { start, end });

			return {
				...state,
				buffer: updatedBuffer,
				modal: {
					...modal,
					currentMode: "normal",
					previousMode: modal.currentMode,
					cursorPosition: start, // Move cursor to start of deleted range
				},
				selection: null,
			};
		}

		// Yank (copy) selection with 'y'
		if (key === "y" && state.selection) {
			const selectedText = extractSelectionText(state.buffer.content, state.selection);

			return {
				...state,
				clipboard: selectedText,
				modal: {
					...modal,
					currentMode: "normal",
					previousMode: modal.currentMode,
				},
				selection: null,
			};
		}

		// hjkl navigation in visual mode
		let newCursor: Position | null = null;

		if (key === "h") {
			newCursor = clampCursorPosition(
				{ line: modal.cursorPosition.line, column: modal.cursorPosition.column - 1 },
				state.buffer.content
			);
		} else if (key === "l") {
			newCursor = clampCursorPosition(
				{ line: modal.cursorPosition.line, column: modal.cursorPosition.column + 1 },
				state.buffer.content
			);
		} else if (key === "j") {
			newCursor = clampCursorPosition(
				{ line: modal.cursorPosition.line + 1, column: modal.cursorPosition.column },
				state.buffer.content
			);
		} else if (key === "k") {
			newCursor = clampCursorPosition(
				{ line: modal.cursorPosition.line - 1, column: modal.cursorPosition.column },
				state.buffer.content
			);
		}

		// If cursor moved, update selection
		if (newCursor !== null) {
			let newSelection: Selection | null = state.selection;

			if (state.selection && modal.currentMode === "visual-line") {
				// Visual-line mode: always select full lines
				const anchorLine = state.selection.anchor.line;
				const newCursorLine = newCursor.line;
				const newLineLength = getLineLength(state.buffer.content, newCursorLine);

				newSelection = {
					anchor: { line: anchorLine, column: 0 },
					active: { line: newCursorLine, column: newLineLength },
				};
			} else if (state.selection && modal.currentMode === "visual-block") {
				// Visual-block mode: rectangular selection
				const startLine = Math.min(state.selection.anchor.line, newCursor.line);
				const endLine = Math.max(state.selection.anchor.line, newCursor.line);
				const startCol = Math.min(state.selection.anchor.column, newCursor.column);
				const endCol = Math.max(state.selection.anchor.column, newCursor.column);

				// Store block selection metadata in anchor/active (simplified for now)
				newSelection = {
					anchor: { line: startLine, column: startCol },
					active: { line: endLine, column: endCol },
				};
			} else if (state.selection) {
				// Regular visual mode
				newSelection = {
					anchor: state.selection.anchor,
					active: newCursor,
				};
			}

			return {
				...state,
				modal: { ...modal, cursorPosition: newCursor },
				selection: newSelection,
			};
		}
	}

	if (modal.currentMode === "insert") {
		// Insert mode: text input
		if (key === "escape") {
			// Escape key - exit insert mode and clear any selection
			return {
				...state,
				modal: { ...modal, currentMode: "normal", previousMode: "insert" },
				selection: null,
			};
		}
		// Vim-style navigation in insert mode with Ctrl prefix (Ctrl+hjkl)
		if (keyEvent?.ctrl && key === "k") {
			const newPos = clampCursorPosition(
				{ line: modal.cursorPosition.line - 1, column: modal.cursorPosition.column },
				state.buffer.content
			);
			return { ...state, modal: { ...modal, cursorPosition: newPos } };
		}
		if (keyEvent?.ctrl && key === "j") {
			const newPos = clampCursorPosition(
				{ line: modal.cursorPosition.line + 1, column: modal.cursorPosition.column },
				state.buffer.content
			);
			return { ...state, modal: { ...modal, cursorPosition: newPos } };
		}
		if (keyEvent?.ctrl && key === "h") {
			const newPos = clampCursorPosition(
				{ line: modal.cursorPosition.line, column: modal.cursorPosition.column - 1 },
				state.buffer.content
			);
			return { ...state, modal: { ...modal, cursorPosition: newPos } };
		}
		if (keyEvent?.ctrl && key === "l") {
			const newPos = clampCursorPosition(
				{ line: modal.cursorPosition.line, column: modal.cursorPosition.column + 1 },
				state.buffer.content
			);
			return { ...state, modal: { ...modal, cursorPosition: newPos } };
		}
		if (key === "backspace") {
			// Delete character before cursor
			const { cursorPosition } = modal;
			if (cursorPosition.column > 0 || cursorPosition.line > 0) {
				// Calculate position of character to delete
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
						...modal,
						cursorPosition: deletePos,
					},
				};
			}
			return state;
		}
		if (key === "return") {
			// Insert newline
			const newBuffer = insertText(state.buffer, modal.cursorPosition, "\n");
			return {
				...state,
				buffer: newBuffer,
				modal: {
					...modal,
					cursorPosition: { line: modal.cursorPosition.line + 1, column: 0 },
				},
			};
		}
		if (key.length === 1 && /^[a-zA-Z0-9\s\.\,\;\:\'\"\-_\[\]\{\}\(\)=/\\|!@#$%^&*~`]$/.test(key)) {
			// Regular character - insert into buffer at cursor position
			const newBuffer = insertText(state.buffer, modal.cursorPosition, key);
			return {
				...state,
				buffer: newBuffer,
				modal: {
					...modal,
					cursorPosition: {
						line: modal.cursorPosition.line,
						column: modal.cursorPosition.column + 1,
					},
				},
			};
		}
	}

	if (modal.currentMode === "command") {
		// Command mode
		if (key === "escape") {
			// Escape key - exit command mode
			return {
				...state,
				modal: {
					...modal,
					currentMode: "normal",
					previousMode: "command",
					commandBuffer: "",
				},
			};
		}
		if (key === "return") {
			// Execute command (for now, just clear and return to normal)
			return {
				...state,
				modal: {
					...modal,
					currentMode: "normal",
					previousMode: "command",
					commandBuffer: "",
				},
			};
		}
		if (key === "backspace") {
			// Remove last character from command buffer
			return {
				...state,
				modal: {
					...modal,
					commandBuffer: modal.commandBuffer.slice(0, -1),
				},
			};
		}
		if (key.length === 1 && /^[a-zA-Z0-9\s\.\,\;\:\'\"\-_]$/.test(key)) {
			// Add character to command buffer
			return {
				...state,
				modal: {
					...modal,
					commandBuffer: modal.commandBuffer + key,
				},
			};
		}
	}

	return state;
};

/**
 * Get mode-specific styling
 * Pure function: mode + config → style object
 */
const getModeStyle = (
	mode: string,
	uiConfig: UIConfigType
): { modeColor: string; backgroundColor: string; modeLabel: string } => {
	const colors = uiConfig.colors || {};
	const bgColor = colors.statusBarBg || "#1a1a1a";

	switch (mode) {
		case "normal":
			return {
				modeColor: colors.normalMode || "#88BB22",
				backgroundColor: bgColor,
				modeLabel: "NORMAL",
			};
		case "insert":
			return {
				modeColor: colors.insertMode || "#22AAFF",
				backgroundColor: bgColor,
				modeLabel: "INSERT",
			};
		case "visual":
			return {
				modeColor: colors.visualMode || "#FF9922",
				backgroundColor: bgColor,
				modeLabel: "VISUAL",
			};
		case "visual-line":
			return {
				modeColor: colors.visualMode || "#FF9922",
				backgroundColor: bgColor,
				modeLabel: "V-LINE",
			};
		case "visual-block":
			return {
				modeColor: colors.visualMode || "#FF9922",
				backgroundColor: bgColor,
				modeLabel: "V-BLOCK",
			};
		case "command":
			return {
				modeColor: colors.commandMode || "#FFFF00",
				backgroundColor: bgColor,
				modeLabel: "COMMAND",
			};
		default:
			return {
				modeColor: colors.textFg || "#FFFFFF",
				backgroundColor: bgColor,
				modeLabel: mode.toUpperCase(),
			};
	}
};

/**
 * Command palette component
 */
const CommandPalette: React.FC<{ commandBuffer: string }> = ({ commandBuffer }) => {
	return (
		<box width="100%" height={1} backgroundColor="#1a1a1a">
			<text>:{commandBuffer}_</text>
		</box>
	);
};

/**
 * Help menu component
 * Displays all configured keybindings
 */
const HelpMenu: React.FC<{ keybinds: KeybindsType }> = ({ keybinds }) => {
	const modeNames: Array<keyof KeybindsType> = ["normal", "insert", "visual", "command"];
	const lines: string[] = ["=== KEYBINDINGS (Ctrl+P to toggle, ESC to close) ===", ""];

	for (const modeName of modeNames) {
		const modeBinds = keybinds[modeName];
		if (Object.keys(modeBinds).length === 0) continue;

		lines.push(`[ ${modeName.toUpperCase()} MODE ]`);
		for (const [key, action] of Object.entries(modeBinds)) {
			lines.push(`  ${key.padEnd(12)} → ${action}`);
		}
		lines.push("");
	}

	return (
		<box width="100%" height="100%" flexDirection="column" backgroundColor="#1a1a1a">
			<text>{lines.join("\n")}</text>
		</box>
	);
};

/**
 * Render buffer with cursor and selection
 * Shows cursor as inverse character, selection with background highlight
 * Handles different selection modes (visual, visual-line, visual-block)
 */
const renderBufferContent = (
	buffer: string,
	cursorPos: Position,
	selection: Selection | null,
	mode: string = "normal"
): string => {
	const lines = buffer.split("\n");

	// Calculate normalized selection range if selection exists
	let selStart: Position | null = null;
	let selEnd: Position | null = null;
	if (selection) {
		const normalized = normalizeSelection(selection);
		selStart = normalized.start;
		selEnd = normalized.end;
	}

	const displayLines = lines.map((line, lineIdx) => {
		// Build line with selection and cursor, careful about character positions
		let result = "";

		for (let colIdx = 0; colIdx < line.length; colIdx++) {
			const char = line[colIdx];
			const isCursor = lineIdx === cursorPos.line && colIdx === cursorPos.column;

			// Determine if character is selected
			let isSelected = false;
			if (selStart && selEnd) {
				if (mode === "visual-block") {
					// Rectangular selection
					isSelected =
						lineIdx >= selStart.line &&
						lineIdx <= selEnd.line &&
						colIdx >= selStart.column &&
						colIdx <= selEnd.column;
				} else if (mode === "visual-line") {
					// Line selection
					isSelected = lineIdx >= selStart.line && lineIdx <= selEnd.line;
				} else {
					// Regular visual mode
					isSelected =
						lineIdx >= selStart.line &&
						lineIdx <= selEnd.line &&
						((lineIdx === selStart.line && colIdx >= selStart.column) ||
							(lineIdx > selStart.line && lineIdx < selEnd.line)) &&
						((lineIdx === selEnd.line && colIdx < selEnd.column) || lineIdx < selEnd.line);
				}
			}

			if (isCursor) {
				// Cursor has priority - show as inverse video
				result += `\x1b[7m${char}\x1b[27m`;
			} else if (isSelected) {
				// Selection - show with background color
				result += `\x1b[48;5;8m${char}\x1b[0m`;
			} else {
				// Normal character
				result += char;
			}
		}

		// Handle cursor at end of line (beyond last character)
		if (lineIdx === cursorPos.line && cursorPos.column >= line.length) {
			result += `\x1b[7m \x1b[27m`;
		}

		return result;
	});

	return displayLines.join("\n");
};

/**
 * App component - renders the editor UI
 */
const AppComponent: React.FC<{ state: AppState; uiConfig: UIConfigType }> = ({
	state,
	uiConfig,
}) => {
	// If help menu is open, show it instead of the editor
	if (state.modal.showHelpMenu) {
		return <HelpMenu keybinds={state.config.keybinds} />;
	}

	const modeStyle = getModeStyle(state.modal.currentMode, uiConfig);
	const bufferContent = renderBufferContent(
		state.buffer.content || "// Welcome to Ctrl Editor\n",
		state.modal.cursorPosition,
		state.selection,
		state.modal.currentMode
	);

	return (
		<box width="100%" height="100%" flexDirection="column">
			<box flexGrow={1} width="100%">
				<text>{bufferContent}</text>
			</box>

			{/* Status bar with mode indicator and cursor position */}
			<box width="100%" height={1} backgroundColor={modeStyle.backgroundColor}>
				<text fg={modeStyle.modeColor}>{modeStyle.modeLabel}</text>
				<text> | {state.buffer.filePath}</text>
				<text fg="#888888">
					{" "}
					| {state.modal.cursorPosition.line}:{state.modal.cursorPosition.column}
				</text>
			</box>

			{/* Command palette - only show in command mode */}
			{state.modal.currentMode === "command" && (
				<CommandPalette commandBuffer={state.modal.commandBuffer} />
			)}
		</box>
	);
};

/**
 * Run the application with React rendering
 * Returns a promise that resolves when the app should exit
 */
export const runApp = async (
	initialState: AppState,
	handleKeystroke: KeystrokeHandler,
	uiConfig: UIConfigType,
	setupConfigReload?: (
		callback: (newConfig: {
			ui: UIConfigType;
			keybinds: import("../config/schema").KeybindsType;
		}) => void
	) => void
): Promise<void> => {
	let currentState = initialState;
	let shouldExit = false;

	// Create the CLI renderer
	const renderer = await createCliRenderer({
		exitOnCtrlC: false,
		useKittyKeyboard: {},
	});

	// Create React root and render component
	const root = createRoot(renderer);
	let currentUiConfig = uiConfig;

	const render = () => {
		root.render(<AppComponent state={currentState} uiConfig={currentUiConfig} />);
	};

	render();

	// Handle config reload
	if (setupConfigReload) {
		setupConfigReload(newConfig => {
			currentState = {
				...currentState,
				config: newConfig,
			};
			currentUiConfig = newConfig.ui;
			console.log("✓ Config reloaded");
			render();
		});
	}

	// Handle keyboard input
	renderer.keyInput.on("keypress", (keyEvent: KeyEvent) => {
		const key = keyEvent.name;

		// Exit on Ctrl+C, Ctrl+D, or 'q' (standard terminal exit keys)
		// Ctrl+C handling inspired by: https://github.com/anomalyco/opencode
		if ((keyEvent.ctrl && (key === "c" || key === "d")) || key === "q") {
			shouldExit = true;
			return;
		}

		// Handle keystroke for other keys
		const newState = handleKeystroke(currentState, key, keyEvent);

		if (newState !== currentState) {
			currentState = newState;
			render();
		}
	});

	// Event loop - wait until user exits (Ctrl+C, Ctrl+D, or 'q')
	while (!shouldExit) {
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	// CRITICAL: Exit cleanup sequence - DO NOT MODIFY
	// This exact sequence ensures clean terminal state restoration without shell artifacts
	// - Call renderer.destroy() to restore terminal state (handles raw mode, etc)
	// - Do NOT use setTimeout/race conditions - just await synchronously
	// - Call process.exit(0) immediately after cleanup completes
	try {
		await renderer.destroy?.();
	} catch {
		// Ignore cleanup errors
	}

	// Exit cleanly
	process.exit(0);
};
