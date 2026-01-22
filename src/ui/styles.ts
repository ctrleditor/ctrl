/**
 * UI Styling constants and utilities
 * Colors and styling definitions for OpenTUI components
 */

/**
 * Color palette for the editor
 */
export const colors = {
	primary: "#569CD6", // Blue
	secondary: "#CE9178", // Orange
	success: "#6A9955", // Green
	warning: "#D7BA7D", // Yellow
	error: "#F48771", // Red
	background: "#1E1E1E", // Dark gray
	foreground: "#D4D4D4", // Light gray
	border: "#3E3E42", // Gray
	lineNumber: "#858585", // Dim gray
	cursor: "#AEAFAD", // Light gray (cursor)
	selection: "#264F78", // Blue selection
	statusLine: "#007ACC", // Bright blue
} as const;

/**
 * Text styling
 */
export const textStyles = {
	normal: { textColor: colors.foreground },
	dim: { textColor: colors.lineNumber },
	bold: { textColor: colors.foreground },
	error: { textColor: colors.error },
	success: { textColor: colors.success },
	muted: { textColor: colors.border },
} as const;

/**
 * Layout constants
 */
export const layout = {
	statusLineHeight: 1,
	commandPaletteHeight: 3,
	minEditorHeight: 5,
	padding: 0,
	gap: 0,
} as const;

/**
 * Component styles
 */
export const componentStyles = {
	editor: {
		backgroundColor: colors.background,
		textColor: colors.foreground,
		borderColor: colors.border,
	},
	statusLine: {
		backgroundColor: colors.statusLine,
		textColor: "#FFFFFF",
	},
	lineNumbers: {
		textColor: colors.lineNumber,
		backgroundColor: colors.background,
		width: 5, // 4 digits + 1 space
	},
	commandPalette: {
		backgroundColor: colors.background,
		textColor: colors.foreground,
		borderColor: colors.border,
	},
} as const;
