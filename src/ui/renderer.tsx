/// <reference path="../../node_modules/@opentui/react/jsx-namespace.d.ts" />

/**
 * OpenTUI React Renderer
 * Main rendering engine for Ctrl editor using React and OpenTUI React binding
 */

import type React from "react";

import { createCliRenderer } from "@opentui/core";
import type { KeyEvent } from "@opentui/core/lib/KeyHandler";
import { createRoot } from "@opentui/react";

import type { KeybindsType, SyntaxColorsType, UIConfigType } from "../config/schema";
import { deleteRange, insertText } from "../core/buffer";
import { closeHelpMenu, toggleHelpMenu } from "../core/modal";
import { parseFileForHighlighting } from "../core/syntax/parser";
import { executeCommand, findCommand } from "../core/commands";
import type { AppState } from "../types/app";
import type { Position, Selection } from "../types/index";
import type { SyntaxHighlighting } from "../types/syntax";

/**
 * Text segment with optional color
 * Used for rendering buffer with syntax highlighting
 */
interface TextSegment {
	text: string;
	fg?: string; // hex color, undefined for default
}

/**
 * Type for keystroke handler function
 */
export type KeystrokeHandler = (
	state: AppState,
	key: string,
	keyEvent?: { ctrl?: boolean; shift?: boolean; meta?: boolean }
) => AppState;

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
	keyEvent?: { ctrl?: boolean; shift?: boolean; meta?: boolean }
): AppState => {
	const { modal } = state;

	// Global commands (work in any mode)
	const globalCommands = {
		"ctrl+p": "toggle_help",
		escape: modal.showHelpMenu ? "close_help" : undefined,
	};

	// Check global commands
	for (const [pattern, command] of Object.entries(globalCommands)) {
		if (command && findCommand({ [pattern]: command }, key, keyEvent) === command) {
			return executeCommand(command, state, {
				key,
				mode: modal.currentMode,
				...keyEvent,
			});
		}
	}

	// Get keybinds for current mode
	const modeKeybinds = state.config.keybinds?.[modal.currentMode as keyof typeof state.config.keybinds] ?? {};

	// Try to find a command for this keystroke
	const command = findCommand(modeKeybinds, key, keyEvent);

	if (command) {
		// Execute the command
		return executeCommand(command, state, {
			key,
			mode: modal.currentMode,
			...keyEvent,
		});
	}

	// Handle text input (only in insert and command modes)
	if (modal.currentMode === "insert") {
		return handleInsertModeInput(state, key);
	}

	if (modal.currentMode === "command") {
		return handleCommandModeInput(state, key);
	}

	// No command matched and no text input - return state unchanged
	return state;
};

/**
 * Handle text input in insert mode
 */
const handleInsertModeInput = (state: AppState, key: string): AppState => {
	// Regular character - insert into buffer at cursor position
	if (key.length === 1 && /^[a-zA-Z0-9\s.,;:'"\-_[\]{}()=/\\|!@#$%^&*~`]$/.test(key)) {
		const newBuffer = insertText(state.buffer, state.modal.cursorPosition, key);
		return {
			...state,
			buffer: newBuffer,
			modal: {
				...state.modal,
				cursorPosition: {
					line: state.modal.cursorPosition.line,
					column: state.modal.cursorPosition.column + 1,
				},
			},
		};
	}

	return state;
};

/**
 * Handle text input in command mode
 */
const handleCommandModeInput = (state: AppState, key: string): AppState => {
	// Add character to command buffer
	if (key.length === 1 && /^[a-zA-Z0-9\s.,;:'"\-_]$/.test(key)) {
		return {
			...state,
			modal: {
				...state.modal,
				commandBuffer: state.modal.commandBuffer + key,
			},
		};
	}

	return state;
};

/**
 * Convert hex color to RGB components for ANSI codes
 * Example: "#569CD6" → "86;156;214"
 */
const hexToRgb = (hex: string): string => {
	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);
	return `${r};${g};${b}`;
};

/**
 * Parse buffer for syntax highlighting
 * Writes buffer to temp file and invokes tree-sitter
 */
const parseBufferSyntax = async (buffer: string, filePath: string, language: string): Promise<SyntaxHighlighting | null> => {
	if (language !== "typescript" && language !== "javascript" && language !== "tsx" && language !== "jsx") {
		return null; // Only support TS/JS initially
	}

	try {
		// Write buffer to temp file for tree-sitter parsing
		const tempFile = `/tmp/ctrl-${Date.now()}.${language === "typescript" ? "ts" : language === "tsx" ? "tsx" : language === "jsx" ? "jsx" : "js"}`;
		await Bun.write(tempFile, buffer);

		// Parse with tree-sitter
		const result = await parseFileForHighlighting(tempFile, language);

		if (!result) return null;

		return {
			tokens: result.tokens,
			lastParsed: Date.now(),
		};
	} catch {
		return null;
	}
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
			<text>/{commandBuffer}_</text>
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
 * Render buffer with cursor, selection, and syntax highlighting
 * Returns array of text segments with optional colors
 *
 * Segments are rendered by AppComponent as individual <text fg={color}> elements
 * This enables syntax highlighting with OpenTUI's color properties
 */
const renderBufferContent = (
	buffer: string,
	cursorPos: Position,
	selection: Selection | null,
	mode: string = "normal",
	syntax: SyntaxHighlighting | null = null,
	syntaxColors: SyntaxColorsType | undefined = undefined
): TextSegment[] => {
	const lines = buffer.split("\n");

	// Build token lookup map for future use when rendering with React elements
	// (currently unused - colors require per-token <text> elements instead of ANSI codes)
	const tokenMap = new Map<string, string>();
	if (syntax && syntaxColors) {
		for (const token of syntax.tokens) {
			// Map all positions covered by this token
			if (token.startLine === token.endLine) {
				// Single-line token
				for (let col = token.startColumn; col < token.endColumn; col++) {
					tokenMap.set(`${token.startLine}:${col}`, token.tokenType);
				}
			} else {
				// Multi-line token (strings, comments)
				// Handle first line
				for (let col = token.startColumn; col < (lines[token.startLine]?.length ?? 0); col++) {
					tokenMap.set(`${token.startLine}:${col}`, token.tokenType);
				}
				// Handle middle lines
				for (let line = token.startLine + 1; line < token.endLine; line++) {
					for (let col = 0; col < (lines[line]?.length ?? 0); col++) {
						tokenMap.set(`${line}:${col}`, token.tokenType);
					}
				}
				// Handle last line
				for (let col = 0; col < token.endColumn; col++) {
					tokenMap.set(`${token.endLine}:${col}`, token.tokenType);
				}
			}
		}
	}

	// Calculate normalized selection range if selection exists
	let selStart: Position | null = null;
	let selEnd: Position | null = null;
	if (selection) {
		const normalized = normalizeSelection(selection);
		selStart = normalized.start;
		selEnd = normalized.end;
	}

	// Build segments for rendering
	const segments: TextSegment[] = [];

	lines.forEach((line, lineIdx) => {
		// Process each character in the line
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

			// Get token type for syntax highlighting
			const tokenType = tokenMap.get(`${lineIdx}:${colIdx}`);

			// Determine color and style
			let color: string | undefined;
			if (isCursor) {
				// Cursor: inverse video (using ANSI code embedded in text)
				segments.push({
					text: `\x1b[7m${char}\x1b[27m`,
					fg: undefined, // ANSI code handles rendering
				});
			} else if (isSelected) {
				// Selection: highlight color (using ANSI background code)
				segments.push({
					text: `\x1b[48;5;8m${char}\x1b[0m`,
					fg: undefined, // ANSI code handles rendering
				});
			} else if (tokenType && syntaxColors) {
				// Syntax highlighting: apply token color
				const colorKey = tokenType as keyof typeof syntaxColors;
				color = syntaxColors[colorKey];
				segments.push({
					text: char,
					fg: color,
				});
			} else {
				// Normal text: default color
				segments.push({
					text: char,
					fg: undefined,
				});
			}
		}

		// Handle cursor at end of line (beyond last character)
		if (lineIdx === cursorPos.line && cursorPos.column >= line.length) {
			segments.push({
				text: `\x1b[7m \x1b[27m`,
				fg: undefined,
			});
		}

		// Add newline between lines (except after last line)
		if (lineIdx < lines.length - 1) {
			segments.push({
				text: "\n",
				fg: undefined,
			});
		}
	});

	return segments;
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
	const syntaxColors = uiConfig.colors?.syntax;

	const bufferSegments = renderBufferContent(
		state.buffer.content || "// Welcome to Ctrl Editor\n",
		state.modal.cursorPosition,
		state.selection,
		state.modal.currentMode,
		state.syntax,
		syntaxColors
	);

	// Build the buffer content from segments
	// Group segments by line for proper rendering
	const lineSegments: TextSegment[][] = [];
	let currentLine: TextSegment[] = [];
	for (const segment of bufferSegments) {
		if (segment.text === "\n") {
			lineSegments.push(currentLine);
			currentLine = [];
		} else {
			currentLine.push(segment);
		}
	}
	if (currentLine.length > 0) {
		lineSegments.push(currentLine);
	}

	return (
		<box width="100%" height="100%" flexDirection="column">
			<box flexGrow={1} width="100%" flexDirection="column">
				{lineSegments.map((lineSegs, lineIdx) => (
					<box key={lineIdx} width="100%" flexDirection="row" flexWrap="wrap">
						{lineSegs.map((segment, segIdx) => (
							<text key={segIdx} fg={segment.fg}>
								{segment.text}
							</text>
						))}
					</box>
				))}
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
	let parseTimeout: ReturnType<typeof setTimeout> | null = null;

	const render = () => {
		root.render(<AppComponent state={currentState} uiConfig={currentUiConfig} />);
	};

	// Initial parse of buffer
	const initialSyntax = await parseBufferSyntax(
		initialState.buffer.content,
		initialState.buffer.filePath,
		initialState.buffer.language
	);
	if (initialSyntax) {
		currentState = {
			...currentState,
			syntax: initialSyntax,
		};
		console.log(`✓ Syntax highlighting: parsed ${initialSyntax.tokens.length} tokens`);
	} else {
		console.log("⚠ Syntax highlighting: parser returned null or empty result");
	}

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
		const oldBufferContent = currentState.buffer.content;
		const newState = handleKeystroke(currentState, key, keyEvent);

		if (newState !== currentState) {
			currentState = newState;
			render();

			// Debounce re-parsing if buffer content changed
			if (newState.buffer.content !== oldBufferContent) {
				if (parseTimeout) clearTimeout(parseTimeout);
				parseTimeout = setTimeout(async () => {
					const updatedSyntax = await parseBufferSyntax(
						currentState.buffer.content,
						currentState.buffer.filePath,
						currentState.buffer.language
					);
					if (updatedSyntax) {
						currentState = {
							...currentState,
							syntax: updatedSyntax,
						};
						render();
					}
				}, 100); // Parse 100ms after last keystroke
			}
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
