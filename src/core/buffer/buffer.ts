/**
 * Buffer implementation using functional programming
 * - Pure functions for all operations
 * - No classes or OOP
 * - Immutable data structures
 */

import type { Position, Range, TextBuffer } from "@/types";

/**
 * Create a new text buffer
 * Pure function: same inputs → same output, no side effects
 */
export const createBuffer = (
	id: string,
	filePath: string,
	content: string,
	language: string
): TextBuffer => ({
	id,
	filePath,
	content,
	isDirty: false,
	language,
});

/**
 * Insert text at a position in the buffer
 * Returns new buffer, original unchanged
 */
export const insertText = (buffer: TextBuffer, position: Position, text: string): TextBuffer => {
	const offset = getOffset(buffer.content, position);
	const newContent = buffer.content.slice(0, offset) + text + buffer.content.slice(offset);

	return {
		...buffer,
		content: newContent,
		isDirty: true,
	};
};

/**
 * Delete text in a range
 * Returns new buffer, original unchanged
 */
export const deleteRange = (buffer: TextBuffer, range: Range): TextBuffer => {
	const startOffset = getOffset(buffer.content, range.start);
	const endOffset = getOffset(buffer.content, range.end);
	const newContent = buffer.content.slice(0, startOffset) + buffer.content.slice(endOffset);

	return {
		...buffer,
		content: newContent,
		isDirty: true,
	};
};

/**
 * Replace text in a range with new text
 * Returns new buffer, original unchanged
 */
export const replaceRange = (buffer: TextBuffer, range: Range, newText: string): TextBuffer => {
	const startOffset = getOffset(buffer.content, range.start);
	const endOffset = getOffset(buffer.content, range.end);
	const newContent =
		buffer.content.slice(0, startOffset) + newText + buffer.content.slice(endOffset);

	return {
		...buffer,
		content: newContent,
		isDirty: true,
	};
};

/**
 * Get character at a position
 */
export const getCharAt = (buffer: TextBuffer, position: Position): string | null => {
	const offset = getOffset(buffer.content, position);
	return offset < buffer.content.length ? (buffer.content[offset] ?? null) : null;
};

/**
 * Get line content by line number
 */
export const getLine = (buffer: TextBuffer, lineNum: number): string => {
	const lines = buffer.content.split("\n");
	return lineNum < lines.length ? (lines[lineNum] ?? "") : "";
};

/**
 * Get line count
 */
export const getLineCount = (buffer: TextBuffer): number => {
	return buffer.content.split("\n").length;
};

/**
 * Convert line/column position to absolute offset
 * Pure function used internally
 */
const getOffset = (content: string, position: Position): number => {
	const lines = content.split("\n");
	let offset = 0;

	for (let i = 0; i < position.line && i < lines.length; i++) {
		offset += (lines[i]?.length ?? 0) + 1; // +1 for newline
	}

	offset += position.column;
	return Math.max(0, Math.min(offset, content.length));
};

/**
 * Get substring between two positions
 */
export const getSubstring = (buffer: TextBuffer, range: Range): string => {
	const startOffset = getOffset(buffer.content, range.start);
	const endOffset = getOffset(buffer.content, range.end);
	return buffer.content.slice(startOffset, endOffset);
};

/**
 * Check if position is valid in buffer
 */
export const isValidPosition = (buffer: TextBuffer, position: Position): boolean => {
	if (position.line < 0) return false;
	if (position.line >= getLineCount(buffer)) return false;
	if (position.column < 0) return false;

	const line = getLine(buffer, position.line);
	return position.column <= line.length;
};

/**
 * Mark buffer as saved
 */
export const markSaved = (buffer: TextBuffer): TextBuffer => ({
	...buffer,
	isDirty: false,
});

/**
 * Update buffer with new content (e.g., after reading from disk)
 */
export const updateContent = (buffer: TextBuffer, newContent: string): TextBuffer => ({
	...buffer,
	content: newContent,
	isDirty: false,
});
