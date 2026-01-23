/**
 * Status Bar Component Renderer
 * Renders customizable status bar from config
 */

import type React from "react";
import type { AppState } from "../../types/app";
import type { StatusBarComponentType, StatusBarLayoutType } from "../../config/schema";

/**
 * Render a single status bar component to text
 */
export const renderStatusBarComponent = (
	componentId: string,
	componentDef: StatusBarComponentType,
	state: AppState
): { text: string; fg?: string } => {
	switch (componentDef.type) {
		case "mode": {
			const modeLabels: Record<string, string> = {
				normal: "NORMAL",
				insert: "INSERT",
				visual: "VISUAL",
				"visual-line": "V-LINE",
				"visual-block": "V-BLOCK",
				command: "COMMAND",
			};

			const modeLabel = modeLabels[state.modal.currentMode] || "UNKNOWN";
			const colors = componentDef.colors || {};

			const modeColorMap: Record<string, string> = {
				normal: colors.normal || "#88BB22",
				insert: colors.insert || "#22AAFF",
				visual: colors.visual || "#FF9922",
				"visual-line": colors.visualLine || "#FF9922",
				"visual-block": colors.visualBlock || "#FF9922",
				command: colors.command || "#FFFF00",
			};

			return {
				text: modeLabel,
				fg: modeColorMap[state.modal.currentMode],
			};
		}

		case "filePath": {
			const filePath = state.buffer.filePath || "untitled";
			const truncate = componentDef.truncate;

			if (filePath.length > truncate) {
				return {
					text: "..." + filePath.slice(-truncate + 3),
				};
			}

			return {
				text: filePath,
			};
		}

		case "position": {
			const line = state.modal.cursorPosition.line + 1;
			const col = state.modal.cursorPosition.column + 1;
			const format = componentDef.format;

			const text = format.replace("{line}", String(line)).replace("{col}", String(col));

			return {
				text,
				fg: componentDef.fg,
			};
		}

		case "modified": {
			const isModified = state.buffer.isDirty;

			return {
				text: isModified ? componentDef.text : "",
				fg: componentDef.fg || "#FF6B6B",
			};
		}

		case "text": {
			return {
				text: componentDef.text,
				fg: componentDef.fg,
			};
		}

		case "lineCount": {
			const lineCount = state.buffer.content.split("\n").length;

			return {
				text: `${lineCount} lines`,
			};
		}

		case "fileSize": {
			const bytes = state.buffer.content.length;

			let text = "";
			if (componentDef.format === "kb") {
				text = `${(bytes / 1024).toFixed(1)} KB`;
			} else if (componentDef.format === "human") {
				if (bytes < 1024) {
					text = `${bytes} B`;
				} else if (bytes < 1024 * 1024) {
					text = `${(bytes / 1024).toFixed(1)} KB`;
				} else {
					text = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
				}
			} else {
				text = `${bytes} B`;
			}

			return {
				text,
			};
		}

		case "gitBranch": {
			// TODO: Implement git branch detection
			// For now, return empty to skip if not available
			return {
				text: componentDef.ifExists ? "" : "(no git)",
			};
		}

		default: {
			// Unknown component type - skip silently
			return {
				text: "",
			};
		}
	}
};

/**
 * React component for rendering the status bar
 */
export const StatusBar: React.FC<{
	state: AppState;
	config: StatusBarLayoutType;
}> = ({ state, config }) => {
	if (!config.enabled) {
		return null;
	}

	const renderZone = (componentIds: string[]) => {
		return (
			<>
				{componentIds.map((id, idx) => {
					const componentDef = config.components[id];
					if (!componentDef) {
						return null;
					}

					const { text, fg } = renderStatusBarComponent(id, componentDef, state);

					if (!text) {
						return null;
					}

					return (
						<text key={id} fg={fg}>
							{text}
						</text>
					);
				})}
			</>
		);
	};

	const leftComponents = config.layout.left || [];
	const centerComponents = config.layout.center || [];
	const rightComponents = config.layout.right || [];

	return (
		<box width="100%" height={config.height} backgroundColor={config.backgroundColor} flexDirection="row">
			{leftComponents.length > 0 && renderZone(leftComponents)}
			{centerComponents.length > 0 && (
				<box flexGrow={1} flexDirection="row">
					{renderZone(centerComponents)}
				</box>
			)}
			{rightComponents.length > 0 && renderZone(rightComponents)}
		</box>
	);
};
