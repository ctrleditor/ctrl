import { describe, it, expect } from "bun:test";
import type { AppState } from "../types/app";
import { handleKeystroke } from "./renderer";
import { initializeApp } from "../main";

describe("Visual Mode Selection", () => {
	// Helper to create initial app state with sample content
	const createTestState = (content = "Hello\nWorld\nTest"): AppState => {
		const state = initializeApp(
			{
				colors: {
					normalMode: "#88BB22",
					insertMode: "#22AAFF",
					visualMode: "#FF9922",
					statusBarBg: "#1a1a1a",
					textFg: "#FFFFFF",
				},
			},
			{
				normal: {},
				insert: {},
				visual: {},
				command: {},
			}
		);
		return {
			...state,
			buffer: {
				...state.buffer,
				content,
			},
		};
	};

	it("should initialize selection when entering visual mode with v key", () => {
		const state = createTestState();
		const newState = handleKeystroke(state, "v");

		expect(newState.modal.currentMode).toBe("visual");
		expect(newState.selection).not.toBeNull();
		expect(newState.selection?.anchor).toEqual({ line: 0, column: 0 });
		expect(newState.selection?.active).toEqual({ line: 0, column: 0 });
	});

	it("should expand selection right with l key in visual mode", () => {
		let state = createTestState();
		state = handleKeystroke(state, "v"); // Enter visual mode

		// Move right with 'l'
		state = handleKeystroke(state, "l");
		expect(state.selection?.active).toEqual({ line: 0, column: 1 });

		state = handleKeystroke(state, "l");
		expect(state.selection?.active).toEqual({ line: 0, column: 2 });
	});

	it("should expand selection left with h key in visual mode", () => {
		let state = createTestState();
		// Set cursor to position (0, 2) first
		state = handleKeystroke(state, "l");
		state = handleKeystroke(state, "l");
		// Now enter visual mode
		state = handleKeystroke(state, "v");

		// Move left with 'h'
		state = handleKeystroke(state, "h");
		expect(state.selection?.active).toEqual({ line: 0, column: 1 });
	});

	it("should expand selection down with j key in visual mode", () => {
		let state = createTestState();
		state = handleKeystroke(state, "v"); // Enter visual mode

		// Move down with 'j'
		state = handleKeystroke(state, "j");
		expect(state.selection?.active).toEqual({ line: 1, column: 0 });

		state = handleKeystroke(state, "j");
		expect(state.selection?.active).toEqual({ line: 2, column: 0 });
	});

	it("should expand selection up with k key in visual mode", () => {
		let state = createTestState();
		// Move down first
		state = handleKeystroke(state, "j");
		state = handleKeystroke(state, "j");
		// Enter visual mode
		state = handleKeystroke(state, "v");

		// Move up with 'k'
		state = handleKeystroke(state, "k");
		expect(state.selection?.active).toEqual({ line: 1, column: 0 });
	});

	it("should keep anchor fixed while expanding selection", () => {
		let state = createTestState();
		state = handleKeystroke(state, "v"); // Enter visual mode at (0, 0)

		// Expand right
		state = handleKeystroke(state, "l");
		state = handleKeystroke(state, "l");

		// Anchor should still be at (0, 0)
		expect(state.selection?.anchor).toEqual({ line: 0, column: 0 });
		// Active should be at (0, 2)
		expect(state.selection?.active).toEqual({ line: 0, column: 2 });
	});

	it("should clear selection on escape in visual mode", () => {
		let state = createTestState();
		state = handleKeystroke(state, "v"); // Enter visual mode
		state = handleKeystroke(state, "l"); // Expand selection

		// Press escape
		state = handleKeystroke(state, "escape");

		expect(state.modal.currentMode).toBe("normal");
		expect(state.selection).toBeNull();
	});

	it("should clear selection when exiting insert mode", () => {
		let state = createTestState();
		state = { ...state, selection: { anchor: { line: 0, column: 0 }, active: { line: 0, column: 5 } } };

		// Enter insert mode
		state = handleKeystroke(state, "i");
		state = handleKeystroke(state, "escape");

		expect(state.selection).toBeNull();
	});

	it("should maintain selection state across multiple hjkl moves", () => {
		let state = createTestState();
		state = handleKeystroke(state, "v"); // Enter visual mode

		// Complex movement: right, down, left, up
		state = handleKeystroke(state, "l");
		expect(state.selection?.active.column).toBe(1);

		state = handleKeystroke(state, "j");
		expect(state.selection?.active.line).toBe(1);
		expect(state.selection?.active.column).toBe(1);

		state = handleKeystroke(state, "h");
		expect(state.selection?.active.column).toBe(0);

		state = handleKeystroke(state, "k");
		expect(state.selection?.active.line).toBe(0);
	});

	it("should clamp cursor position at buffer boundaries in visual mode", () => {
		let state = createTestState("Hello");
		state = handleKeystroke(state, "v");

		// Try to move beyond end of line
		state = handleKeystroke(state, "l");
		state = handleKeystroke(state, "l");
		state = handleKeystroke(state, "l");
		state = handleKeystroke(state, "l");
		state = handleKeystroke(state, "l"); // Should be clamped to position 5

		expect(state.selection?.active.column).toBe(5);
	});

	it("should handle negative cursor positions by clamping to 0", () => {
		let state = createTestState();
		state = handleKeystroke(state, "v");

		// Try to move left from start
		state = handleKeystroke(state, "h");

		// Should be clamped to 0
		expect(state.selection?.active.column).toBe(0);
	});
});

describe("Visual-Line Mode", () => {
	const createTestState = (content = "Hello\nWorld\nTest"): AppState => {
		const state = initializeApp(
			{
				colors: {
					normalMode: "#88BB22",
					insertMode: "#22AAFF",
					visualMode: "#FF9922",
					statusBarBg: "#1a1a1a",
					textFg: "#FFFFFF",
				},
			},
			{
				normal: {},
				insert: {},
				visual: {},
				command: {},
			}
		);
		return {
			...state,
			buffer: {
				...state.buffer,
				content,
			},
		};
	};

	it("should enter visual-line mode with V key and select entire line", () => {
		const state = createTestState();
		const newState = handleKeystroke(state, "V");

		expect(newState.modal.currentMode).toBe("visual-line");
		expect(newState.selection?.anchor).toEqual({ line: 0, column: 0 });
		expect(newState.selection?.active.line).toBe(0);
		// Active column should be the length of the line
		expect(newState.selection?.active.column).toBe(5); // "Hello".length
	});

	it("should expand line selection down with j key", () => {
		let state = createTestState();
		state = handleKeystroke(state, "V"); // Enter visual-line mode

		// Move down
		state = handleKeystroke(state, "j");

		// Should select from line 0 to line 1
		expect(state.selection?.anchor.line).toBe(0);
		expect(state.selection?.active.line).toBe(1);
	});

	it("should expand line selection up with k key", () => {
		let state = createTestState();
		// Move to line 2 first
		state = handleKeystroke(state, "j");
		state = handleKeystroke(state, "j");
		// Enter visual-line mode
		state = handleKeystroke(state, "V");

		// Move up
		state = handleKeystroke(state, "k");

		// Should select from line 2 down to line 1
		expect(state.selection?.anchor.line).toBe(2);
		expect(state.selection?.active.line).toBe(1);
	});

	it("should keep anchor at original line in visual-line mode", () => {
		let state = createTestState();
		// Move to line 1
		state = handleKeystroke(state, "j");
		// Enter visual-line mode
		state = handleKeystroke(state, "V");

		// Move to line 2
		state = handleKeystroke(state, "j");

		// Anchor should be at line 1
		expect(state.selection?.anchor.line).toBe(1);
		// Active should be at line 2
		expect(state.selection?.active.line).toBe(2);
	});

	it("should select full lines even with h/l movement in visual-line mode", () => {
		let state = createTestState();
		state = handleKeystroke(state, "V"); // Enter visual-line mode

		// Try to move right (should not affect selection)
		const beforeL = state.selection;
		state = handleKeystroke(state, "l");

		// Selection should still select full line
		expect(state.selection?.anchor.column).toBe(0);
		// Active column should extend to end of line 0
		expect(state.selection?.active.column).toBe(5);
	});
});

describe("Visual-Block Mode", () => {
	const createTestState = (content = "Hello\nWorld\nTest"): AppState => {
		const state = initializeApp(
			{
				colors: {
					normalMode: "#88BB22",
					insertMode: "#22AAFF",
					visualMode: "#FF9922",
					statusBarBg: "#1a1a1a",
					textFg: "#FFFFFF",
				},
			},
			{
				normal: {},
				insert: {},
				visual: {},
				command: {},
			}
		);
		return {
			...state,
			buffer: {
				...state.buffer,
				content,
			},
		};
	};

	it("should enter visual-block mode with Ctrl+V", () => {
		const state = createTestState();
		const newState = handleKeystroke(state, "v", { ctrl: true });

		expect(newState.modal.currentMode).toBe("visual-block");
		expect(newState.selection).not.toBeNull();
		expect(newState.selection?.anchor).toEqual({ line: 0, column: 0 });
		expect(newState.selection?.active).toEqual({ line: 0, column: 0 });
	});

	it("should create rectangular selection with j and l in visual-block mode", () => {
		let state = createTestState();
		state = handleKeystroke(state, "v", { ctrl: true }); // Enter visual-block mode

		// Move right and down to create 2x2 block
		state = handleKeystroke(state, "l");
		state = handleKeystroke(state, "j");

		// Should create rectangular selection
		expect(state.selection?.anchor).toEqual({ line: 0, column: 0 });
		expect(state.selection?.active.line).toBe(1);
		expect(state.selection?.active.column).toBe(1);
	});

	it("should expand visual-block selection correctly", () => {
		let state = createTestState();
		// Start at column 1, line 0
		state = handleKeystroke(state, "l");
		state = handleKeystroke(state, "v", { ctrl: true }); // Enter visual-block mode

		// Expand to column 2, line 2
		state = handleKeystroke(state, "l");
		state = handleKeystroke(state, "j");
		state = handleKeystroke(state, "j");

		// Selection should form a rectangle
		const sel = state.selection;
		expect(sel?.anchor).toEqual({ line: 0, column: 1 });
		// Visual-block mode should normalize the rectangle
		expect(sel?.active.line).toBe(2);
	});
});

describe("Selection Operations (Delete, Yank, Paste)", () => {
	const createTestState = (content = "Hello\nWorld\nTest"): AppState => {
		const state = initializeApp(
			{
				colors: {
					normalMode: "#88BB22",
					insertMode: "#22AAFF",
					visualMode: "#FF9922",
					statusBarBg: "#1a1a1a",
					textFg: "#FFFFFF",
				},
			},
			{
				normal: {},
				insert: {},
				visual: {},
				command: {},
			}
		);
		return {
			...state,
			buffer: {
				...state.buffer,
				content,
			},
		};
	};

	it("should delete visual selection with d key", () => {
		let state = createTestState();
		state = handleKeystroke(state, "v"); // Enter visual mode

		// Select 3 characters (H, e, l)
		state = handleKeystroke(state, "l");
		state = handleKeystroke(state, "l");
		state = handleKeystroke(state, "l");

		// Delete selection
		state = handleKeystroke(state, "d");

		expect(state.buffer.content).toBe("lo\nWorld\nTest");
		expect(state.modal.currentMode).toBe("normal");
		expect(state.selection).toBeNull();
		expect(state.modal.cursorPosition).toEqual({ line: 0, column: 0 });
	});

	it("should yank visual selection with y key", () => {
		let state = createTestState();
		state = handleKeystroke(state, "v"); // Enter visual mode

		// Select 2 characters: press 'l' twice to select columns 0-2 (characters "H" and "e")
		state = handleKeystroke(state, "l");
		state = handleKeystroke(state, "l");

		// Yank selection
		state = handleKeystroke(state, "y");

		expect(state.clipboard).toBe("He"); // Characters at indices 0-1
		expect(state.buffer.content).toBe("Hello\nWorld\nTest"); // Buffer unchanged
		expect(state.modal.currentMode).toBe("normal");
		expect(state.selection).toBeNull();
	});

	it("should paste clipboard content with p key in normal mode", () => {
		let state = createTestState("Hello");
		// Manually set clipboard
		state = { ...state, clipboard: "XYZ" };

		// Move to position 2
		state = handleKeystroke(state, "l");
		state = handleKeystroke(state, "l");

		// Paste
		state = handleKeystroke(state, "p");

		expect(state.buffer.content).toBe("HeXYZllo");
		expect(state.modal.cursorPosition.column).toBe(5); // Cursor after pasted text
	});

	it("should delete multi-line selection", () => {
		let state = createTestState();
		state = handleKeystroke(state, "v"); // Enter visual mode

		// Select across multiple lines: from (0,0) to (1,3)
		// Selects "Hello\nWor" (all of line 0 and first 3 chars of line 1)
		state = handleKeystroke(state, "j");
		state = handleKeystroke(state, "l");
		state = handleKeystroke(state, "l");
		state = handleKeystroke(state, "l");

		state = handleKeystroke(state, "d");

		// After deletion: "ld\nTest" (remaining from line 1 + original line 2)
		expect(state.buffer.content).toBe("ld\nTest");
	});

	it("should yank visual-line selection", () => {
		let state = createTestState();
		state = handleKeystroke(state, "V"); // Enter visual-line mode

		// Extend to include next line
		state = handleKeystroke(state, "j");

		// Yank full lines
		state = handleKeystroke(state, "y");

		expect(state.clipboard).toBe("Hello\nWorld");
	});

	it("should handle paste when clipboard is empty", () => {
		let state = createTestState("Hello");
		// Clipboard is empty by default
		expect(state.clipboard).toBe("");

		state = handleKeystroke(state, "p");

		// Nothing should change
		expect(state.buffer.content).toBe("Hello");
	});

	it("should position cursor correctly after paste with newlines", () => {
		let state = createTestState("Line1\nLine2");
		// Set clipboard with newline
		state = { ...state, clipboard: "A\nB" };

		// Paste at start
		state = handleKeystroke(state, "p");

		expect(state.buffer.content).toBe("A\nBLine1\nLine2");
		expect(state.modal.cursorPosition.column).toBe(3); // After "A\nB"
	});

	it("should handle visual-block mode entry and selection", () => {
		let state = createTestState("Hello\nWorld");
		// Cursor at (0, 1)
		state = handleKeystroke(state, "l");

		// Enter visual-block mode
		state = handleKeystroke(state, "v", { ctrl: true });

		expect(state.modal.currentMode).toBe("visual-block");
		expect(state.selection?.anchor).toEqual({ line: 0, column: 1 });

		// Expand selection
		state = handleKeystroke(state, "l");
		state = handleKeystroke(state, "j");

		// Should have a selection spanning multiple lines and columns
		expect(state.selection?.active.line).toBe(1);
		expect(state.selection?.active.column).toBe(2);
	});
});
