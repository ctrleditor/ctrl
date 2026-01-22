/**
 * Status line component
 * Displays editor mode, file info, and cursor position
 */

import type { ModalState, TextBuffer } from "@/types";
import type { RootRenderable } from "@opentui/core";
import { Box, Text } from "@opentui/core";

import { colors, componentStyles, layout } from "../styles";

/**
 * Format mode display
 * Pure function: convert EditorMode to display string
 */
const formatMode = (mode: string): string => {
	switch (mode) {
		case "normal":
			return "NORMAL";
		case "insert":
			return "INSERT";
		case "visual":
			return "VISUAL";
		case "visual-line":
			return "V-LINE";
		case "visual-block":
			return "V-BLOCK";
		case "command":
			return "COMMAND";
		default:
			return mode.toUpperCase();
	}
};

/**
 * Status line component
 * Pure function that renders mode, file name, and position info
 */
export const StatusLine = (buffer: TextBuffer, modal: ModalState): RootRenderable => {
	const mode = formatMode(modal.currentMode);
	const isDirtyIndicator = buffer.isDirty ? "●" : " ";
	const lineCount = buffer.content.split("\n").length;

	return Box(
		{
			width: "100%",
			height: layout.statusLineHeight,
			flexDirection: "row",
			backgroundColor: componentStyles.statusLine.backgroundColor,
			textColor: componentStyles.statusLine.textColor,
			paddingLeft: 1,
			paddingRight: 1,
			justifyContent: "space-between",
		},
		// Left side: mode and file info
		Box(
			{
				flexDirection: "row",
				gap: 2,
			},
			Text({
				width: "auto",
				bold: true,
				content: `▌ ${mode}`,
			}),
			Text({
				width: "auto",
				content: `${isDirtyIndicator} ${buffer.filePath}`,
			})
		),
		// Right side: position info
		Text({
			width: "auto",
			content: `Ln 1, Col 1 / ${lineCount} lines`,
		})
	);
};
