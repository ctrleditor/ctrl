/**
 * Theme loader - converts Gogh schemes to Ctrl syntax colors
 */

import type { GoghTheme, SyntaxColorsFromTheme, TokenColorMapping, UIChromeColors } from "./types";
import {
	getTheme,
	tokenColorMapping as defaultTokenMapping,
	uiChromeMapping as defaultUIChromeMapping,
} from "./schemes";

/**
 * Load a theme by name and generate syntax colors
 *
 * @param themeName - Theme name (e.g., "dracula", "nord", "one-dark")
 * @param tokenMapping - Optional custom token color mapping
 * @returns SyntaxColorsFromTheme object with hex colors
 */
export const loadThemeSyntaxColors = (
	themeName: string,
	tokenMapping: TokenColorMapping = defaultTokenMapping
): SyntaxColorsFromTheme => {
	const theme = getTheme(themeName);
	return generateSyntaxColors(theme, tokenMapping);
};

/**
 * Load theme UI chrome colors (mode colors, status bar)
 *
 * @param themeName - Theme name
 * @param uiMapping - Optional custom UI color mapping
 * @returns Object with hex colors for mode/UI elements
 */
export const loadThemeUIChromeColors = (
	themeName: string,
	uiMapping: UIChromeColors = defaultUIChromeMapping
): Record<string, string> => {
	const theme = getTheme(themeName);
	return generateUIChromeColors(theme, uiMapping);
};

/**
 * Generate syntax colors from Gogh theme
 *
 * Maps each syntax token type to a color from the Gogh palette
 * using the tokenMapping indices
 */
const generateSyntaxColors = (
	theme: GoghTheme,
	mapping: TokenColorMapping
): SyntaxColorsFromTheme => {
	return {
		keyword: theme.colors[mapping.keyword],
		string: theme.colors[mapping.string],
		number: theme.colors[mapping.number],
		comment: theme.colors[mapping.comment],
		type: theme.colors[mapping.type],
		function: theme.colors[mapping.function],
		variable: theme.colors[mapping.variable],
		operator: theme.colors[mapping.operator],
		punctuation: theme.colors[mapping.punctuation],
		constant: theme.colors[mapping.constant],
		property: theme.colors[mapping.property],
	};
};

/**
 * Generate UI chrome colors from Gogh theme
 *
 * Maps UI elements to colors from the Gogh palette
 */
const generateUIChromeColors = (theme: GoghTheme, mapping: UIChromeColors): Record<string, string> => {
	return {
		normalMode: theme.colors[mapping.normal],
		insertMode: theme.colors[mapping.insert],
		visualMode: theme.colors[mapping.visual],
		commandMode: theme.colors[mapping.command],
		statusBarBg: theme.colors[mapping.statusBg],
		textFg: theme.colors[mapping.textFg],
	};
};

/**
 * Get all theme information at once
 *
 * Returns both syntax colors and UI chrome colors for a theme
 */
export const loadCompleteTheme = (themeName: string) => {
	const syntaxColors = loadThemeSyntaxColors(themeName);
	const uiColors = loadThemeUIChromeColors(themeName);

	return {
		theme: themeName,
		syntaxColors,
		uiColors,
	};
};
