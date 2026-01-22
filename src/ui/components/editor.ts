/**
 * Editor view component
 * Displays the text buffer with line numbers and cursor
 */

import type { TextBuffer } from "@/types";
import type { RootRenderable } from "@opentui/core";
import { Box, Text } from "@opentui/core";

import { colors, componentStyles } from "../styles";

/**
 * Render line numbers column
 * Pure function: takes line count and returns line numbers UI
 */
const renderLineNumbers = (lineCount: number): RootRenderable => {
	const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

	return Box(
		{
			width: 5,
			flexDirection: "column",
			backgroundColor: colors.background,
			borderRight: true,
			borderColor: colors.border,
		},
		...lines.map(lineNum =>
			Text({
				width: "100%",
				textColor: colors.lineNumber,
				content: String(lineNum).padStart(4, " "),
			})
		)
	);
};

/**
 * Render buffer content with syntax highlighting stub
 * Pure function: takes buffer and returns content UI
 */
const renderBufferContent = (buffer: TextBuffer): RootRenderable => {
	const lines = buffer.content.split("\n");

	return Box(
		{
			flexDirection: "column",
			flexGrow: 1,
			backgroundColor: colors.background,
			textColor: colors.foreground,
			overflow: "hidden",
		},
		...lines.map((line, index) =>
			Text({
				width: "100%",
				key: `line-${index}`,
				content: line || " ", // Empty lines need at least a space
			})
		)
	);
};

/**
 * Editor view component
 * Pure function that renders the editor with buffer, line numbers, and cursor
 */
export const EditorView = (buffer: TextBuffer): RootRenderable => {
	const lineCount = buffer.content.split("\n").length;

	return Box(
		{
			width: "100%",
			flexGrow: 1,
			flexDirection: "row",
			backgroundColor: colors.background,
			borderColor: colors.border,
		},
		renderLineNumbers(lineCount),
		renderBufferContent(buffer)
	);
};
