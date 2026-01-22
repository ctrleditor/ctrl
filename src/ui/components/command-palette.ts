/**
 * Command palette component (stub)
 * Displays command input when in command mode
 */

import type { ModalState } from "@/types";
import type { RootRenderable } from "@opentui/core";
import { Box, Text } from "@opentui/core";

import { colors, componentStyles, layout } from "../styles";

/**
 * Command palette component
 * Pure function that renders command input palette (only when in command mode)
 */
export const CommandPalette = (modal: ModalState): RootRenderable | null => {
	// Only show command palette when in command mode
	if (modal.currentMode !== "command") {
		return null;
	}

	return Box(
		{
			width: "100%",
			height: layout.commandPaletteHeight,
			flexDirection: "column",
			backgroundColor: componentStyles.commandPalette.backgroundColor,
			borderTop: true,
			borderColor: componentStyles.commandPalette.borderColor,
			padding: 1,
			gap: 1,
		},
		// Command input
		Box(
			{
				width: "100%",
				flexDirection: "row",
				gap: 1,
			},
			Text(
				{
					width: "auto",
					textColor: colors.primary,
				},
				":"
			),
			Text(
				{
					width: "100%",
					textColor: colors.foreground,
				},
				modal.commandBuffer || ""
			)
		),
		// Help text
		Text(
			{
				width: "100%",
				textColor: colors.lineNumber,
			},
			"Type command and press Enter. Press Esc to cancel."
		)
	);
};
