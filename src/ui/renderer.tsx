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
		if (key === "v") {
			return {
				...state,
				modal: { ...modal, currentMode: "visual", previousMode: "normal" },
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
	}

	if (modal.currentMode === "insert") {
		// Insert mode: text input
		if (key === "escape") {
			// Escape key
			return {
				...state,
				modal: { ...modal, currentMode: "normal", previousMode: "insert" },
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
 * Render buffer with cursor indicator
 * Shows cursor as an inverse character when in insert mode
 */
const renderBufferContent = (
	buffer: string,
	cursorPos: { line: number; column: number }
): string => {
	const lines = buffer.split("\n");
	const displayLines = lines.map((line, lineIdx) => {
		if (lineIdx === cursorPos.line) {
			const before = line.slice(0, cursorPos.column);
			const at = line[cursorPos.column] ?? " ";
			const after = line.slice(cursorPos.column + 1);
			// Show cursor character with inverse video (reverse colors)
			// Using ANSI escape codes: \x1b[7m for reverse, \x1b[27m to reset
			return `${before}\x1b[7m${at}\x1b[27m${after}`;
		}
		return line;
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
		state.modal.cursorPosition
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
