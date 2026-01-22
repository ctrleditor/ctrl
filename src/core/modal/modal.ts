/**
 * Modal system implementation using functional programming
 * - Pure functions for state transitions
 * - Immutable state
 * - No classes
 */

import type { EditorMode, ModalState } from "@/types";

/**
 * Create initial modal state
 */
export const createModalState = (): ModalState => ({
	currentMode: "normal",
	previousMode: "normal",
	commandBuffer: "",
	cursorPosition: { line: 0, column: 0 },
	showHelpMenu: false,
});

/**
 * Transition to a new mode
 * Pure function: returns new state, doesn't mutate
 */
export const enterMode = (state: ModalState, mode: EditorMode): ModalState => {
	// No-op if already in that mode (except insert allows repeat)
	if (state.currentMode === mode && mode !== "insert") {
		return state;
	}

	return {
		...state,
		previousMode: state.currentMode,
		currentMode: mode,
		commandBuffer: "",
	};
};

/**
 * Return to previous mode
 */
export const exitMode = (state: ModalState): ModalState => ({
	...state,
	currentMode: state.previousMode,
	previousMode: state.currentMode,
	commandBuffer: "",
});

/**
 * Add character to command buffer
 * Used for building multi-key commands like "dd", "gg", etc.
 */
export const addToCommandBuffer = (state: ModalState, char: string): ModalState => ({
	...state,
	commandBuffer: state.commandBuffer + char,
});

/**
 * Clear command buffer
 */
export const clearCommandBuffer = (state: ModalState): ModalState => ({
	...state,
	commandBuffer: "",
});

/**
 * Check if a mode allows text insertion
 */
export const isInsertMode = (mode: EditorMode): boolean => mode === "insert";

/**
 * Check if a mode is visual (for selecting)
 */
export const isVisualMode = (mode: EditorMode): boolean =>
	mode === "visual" || mode === "visual-line" || mode === "visual-block";

/**
 * Convert visual mode back to normal
 */
export const exitVisualMode = (state: ModalState): ModalState => {
	if (!isVisualMode(state.currentMode)) {
		return state;
	}

	return {
		...state,
		currentMode: "normal",
		commandBuffer: "",
	};
};

/**
 * Mode transition rules
 * Define valid transitions between modes
 */
export interface ModeTransition {
	readonly from: EditorMode;
	readonly to: EditorMode;
	readonly trigger: string;
}

const VALID_TRANSITIONS: readonly ModeTransition[] = [
	{ from: "normal", to: "insert", trigger: "i" },
	{ from: "normal", to: "insert", trigger: "a" },
	{ from: "normal", to: "insert", trigger: "o" },
	{ from: "normal", to: "visual", trigger: "v" },
	{ from: "normal", to: "visual-line", trigger: "V" },
	{ from: "normal", to: "visual-block", trigger: "C-v" },
	{ from: "normal", to: "command", trigger: ":" },
	{ from: "insert", to: "normal", trigger: "Escape" },
	{ from: "visual", to: "normal", trigger: "Escape" },
	{ from: "visual-line", to: "normal", trigger: "Escape" },
	{ from: "visual-block", to: "normal", trigger: "Escape" },
	{ from: "command", to: "normal", trigger: "Escape" },
];

/**
 * Check if a mode transition is valid
 */
export const isValidTransition = (from: EditorMode, to: EditorMode, trigger: string): boolean =>
	VALID_TRANSITIONS.some(t => t.from === from && t.to === to && t.trigger === trigger);

/**
 * Get valid transitions from a mode
 */
export const getValidTransitions = (from: EditorMode): readonly string[] =>
	VALID_TRANSITIONS.filter(t => t.from === from).map(t => t.trigger);

/**
 * Toggle help menu visibility
 */
export const toggleHelpMenu = (state: ModalState): ModalState => ({
	...state,
	showHelpMenu: !state.showHelpMenu,
});

/**
 * Close help menu
 */
export const closeHelpMenu = (state: ModalState): ModalState => ({
	...state,
	showHelpMenu: false,
});
