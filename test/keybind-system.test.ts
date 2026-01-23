/**
 * Tests for the keybind system - command executor and matching
 */

import { describe, it, expect } from "bun:test";
import {
	parseKeybind,
	matchesKeybind,
	findCommand,
	formatKeybind,
	getKeybindHelp,
} from "../src/core/commands/keybind-matcher";
import { executeCommand, getAvailableCommands } from "../src/core/commands/keybind-executor";
import type { AppState } from "../src/types/app";

describe("Keybind Parsing", () => {
	it("should parse simple key", () => {
		const parsed = parseKeybind("a");
		expect(parsed.key).toBe("a");
		expect(parsed.ctrl).toBe(false);
		expect(parsed.shift).toBe(false);
		expect(parsed.meta).toBe(false);
	});

	it("should parse key with ctrl modifier", () => {
		const parsed = parseKeybind("ctrl+c");
		expect(parsed.key).toBe("c");
		expect(parsed.ctrl).toBe(true);
		expect(parsed.shift).toBe(false);
	});

	it("should parse key with shift modifier", () => {
		const parsed = parseKeybind("shift+v");
		expect(parsed.key).toBe("v");
		expect(parsed.shift).toBe(true);
		expect(parsed.ctrl).toBe(false);
	});

	it("should parse key with multiple modifiers", () => {
		const parsed = parseKeybind("ctrl+shift+s");
		expect(parsed.key).toBe("s");
		expect(parsed.ctrl).toBe(true);
		expect(parsed.shift).toBe(true);
		expect(parsed.meta).toBe(false);
	});

	it("should be case-insensitive", () => {
		const parsed = parseKeybind("CTRL+P");
		expect(parsed.key).toBe("p");
		expect(parsed.ctrl).toBe(true);
	});

	it("should handle special keys", () => {
		expect(parseKeybind("escape").key).toBe("escape");
		expect(parseKeybind("return").key).toBe("return");
		expect(parseKeybind("backspace").key).toBe("backspace");
	});
});

describe("Keybind Matching", () => {
	it("should match simple key", () => {
		expect(matchesKeybind("a", "a")).toBe(true);
		expect(matchesKeybind("a", "b")).toBe(false);
	});

	it("should match with modifiers", () => {
		expect(matchesKeybind("ctrl+c", "c", { ctrl: true })).toBe(true);
		expect(matchesKeybind("ctrl+c", "c", { ctrl: false })).toBe(false);
		expect(matchesKeybind("ctrl+c", "c")).toBe(false);
	});

	it("should match shift modifier", () => {
		expect(matchesKeybind("shift+v", "V", { shift: true })).toBe(true);
		expect(matchesKeybind("shift+v", "v", { shift: false })).toBe(false);
	});

	it("should match special keys", () => {
		expect(matchesKeybind("escape", "escape")).toBe(true);
		expect(matchesKeybind("return", "return")).toBe(true);
		expect(matchesKeybind("backspace", "backspace")).toBe(true);
	});

	it("should handle key variations", () => {
		// Return vs Enter
		expect(matchesKeybind("return", "enter")).toBe(true);
		expect(matchesKeybind("enter", "return")).toBe(true);
	});
});

describe("Keybind Command Lookup", () => {
	it("should find command for keybind", () => {
		const keybinds = {
			i: "enter_insert",
			v: "enter_visual",
			"/": "enter_command",
		};

		expect(findCommand(keybinds, "i")).toBe("enter_insert");
		expect(findCommand(keybinds, "v")).toBe("enter_visual");
		expect(findCommand(keybinds, "/")).toBe("enter_command");
	});

	it("should return undefined for unknown keybind", () => {
		const keybinds = { i: "enter_insert" };
		expect(findCommand(keybinds, "x")).toBeUndefined();
	});

	it("should find command with modifiers", () => {
		const keybinds = {
			"ctrl+p": "toggle_help",
			"ctrl+v": "enter_visual_block",
		};

		expect(findCommand(keybinds, "p", { ctrl: true })).toBe("toggle_help");
		expect(findCommand(keybinds, "v", { ctrl: true })).toBe("enter_visual_block");
	});

	it("should handle multiple keybinds with different modifiers", () => {
		const keybinds = {
			v: "enter_visual",
			"ctrl+v": "enter_visual_block",
		};

		expect(findCommand(keybinds, "v")).toBe("enter_visual");
		expect(findCommand(keybinds, "v", { ctrl: true })).toBe("enter_visual_block");
	});
});

describe("Keybind Formatting", () => {
	it("should format simple key", () => {
		const formatted = formatKeybind({ key: "a", ctrl: false, shift: false, meta: false });
		expect(formatted).toBe("A");
	});

	it("should format key with modifier", () => {
		const formatted = formatKeybind({ key: "c", ctrl: true, shift: false, meta: false });
		expect(formatted).toBe("Ctrl+C");
	});

	it("should format special keys", () => {
		expect(formatKeybind({ key: "escape", ctrl: false, shift: false, meta: false })).toBe("Esc");
		expect(formatKeybind({ key: "return", ctrl: false, shift: false, meta: false })).toBe("Enter");
		expect(formatKeybind({ key: " ", ctrl: false, shift: false, meta: false })).toBe("Space");
	});

	it("should generate help strings", () => {
		expect(getKeybindHelp("ctrl+p")).toBe("Ctrl+P");
		expect(getKeybindHelp("shift+v")).toBe("Shift+V");
		expect(getKeybindHelp("escape")).toBe("Esc");
	});
});

describe("Command Execution", () => {
	it("should execute available commands", () => {
		const commands = getAvailableCommands();
		expect(Array.isArray(commands)).toBe(true);
		expect(commands.length).toBeGreaterThan(0);

		// Should include common commands
		expect(commands.includes("enter_insert")).toBe(true);
		expect(commands.includes("enter_normal")).toBe(true);
		expect(commands.includes("move_left")).toBe(true);
		expect(commands.includes("move_right")).toBe(true);
	});

	it("should execute enter_insert command", () => {
		// Create a minimal app state
		const state: AppState = {
			buffer: { id: "test", content: "hello", language: "typescript", isDirty: false },
			modal: {
				currentMode: "normal",
				previousMode: "normal",
				cursorPosition: { line: 0, column: 0 },
				commandBuffer: "",
				showHelpMenu: false,
			},
			config: { ui: { theme: "dracula" }, keybinds: {} },
			selection: null,
			clipboard: "",
			syntax: null,
			commandRegistry: {},
		};

		const newState = executeCommand("enter_insert", state, {
			key: "i",
			mode: "normal",
		});

		expect(newState.modal.currentMode).toBe("insert");
		expect(newState.modal.previousMode).toBe("normal");
	});

	it("should execute move_left command", () => {
		const state: AppState = {
			buffer: { id: "test", content: "hello", language: "typescript", isDirty: false },
			modal: {
				currentMode: "normal",
				previousMode: "normal",
				cursorPosition: { line: 0, column: 2 },
				commandBuffer: "",
				showHelpMenu: false,
			},
			config: { ui: { theme: "dracula" }, keybinds: {} },
			selection: null,
			clipboard: "",
			syntax: null,
			commandRegistry: {},
		};

		const newState = executeCommand("move_left", state, {
			key: "h",
			mode: "normal",
		});

		expect(newState.modal.cursorPosition.column).toBe(1);
	});

	it("should execute move_right command", () => {
		const state: AppState = {
			buffer: { id: "test", content: "hello", language: "typescript", isDirty: false },
			modal: {
				currentMode: "normal",
				previousMode: "normal",
				cursorPosition: { line: 0, column: 0 },
				commandBuffer: "",
				showHelpMenu: false,
			},
			config: { ui: { theme: "dracula" }, keybinds: {} },
			selection: null,
			clipboard: "",
			syntax: null,
			commandRegistry: {},
		};

		const newState = executeCommand("move_right", state, {
			key: "l",
			mode: "normal",
		});

		expect(newState.modal.cursorPosition.column).toBe(1);
	});

	it("should execute enter_visual command", () => {
		const state: AppState = {
			buffer: { id: "test", content: "hello", language: "typescript", isDirty: false },
			modal: {
				currentMode: "normal",
				previousMode: "normal",
				cursorPosition: { line: 0, column: 0 },
				commandBuffer: "",
				showHelpMenu: false,
			},
			config: { ui: { theme: "dracula" }, keybinds: {} },
			selection: null,
			clipboard: "",
			syntax: null,
			commandRegistry: {},
		};

		const newState = executeCommand("enter_visual", state, {
			key: "v",
			mode: "normal",
		});

		expect(newState.modal.currentMode).toBe("visual");
		expect(newState.selection).not.toBeNull();
		expect(newState.selection?.anchor).toEqual({ line: 0, column: 0 });
	});
});
