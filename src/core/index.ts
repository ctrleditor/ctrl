/**
 * Core editor module exports
 */

export {
	createBuffer,
	insertText,
	deleteRange,
	replaceRange,
	getCharAt,
	getLine,
	getLineCount,
	getSubstring,
	isValidPosition,
	markSaved,
	updateContent,
} from "./buffer";

export {
	createModalState,
	enterMode,
	exitMode,
	addToCommandBuffer,
	clearCommandBuffer,
	isInsertMode,
	isVisualMode,
	exitVisualMode,
	isValidTransition,
	getValidTransitions,
	type ModeTransition,
} from "./modal";
