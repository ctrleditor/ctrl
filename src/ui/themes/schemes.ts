/**
 * Popular Gogh color schemes bundled with Ctrl
 * Source: https://github.com/Gogh-Co/Gogh
 *
 * ANSI Color Layout:
 * 0-7: Normal colors (black, red, green, yellow, blue, magenta, cyan, white)
 * 8-15: Bright versions of above
 */

import type { GoghTheme, TokenColorMapping, UIChromeColors } from "./types";

/**
 * Dracula - A dark theme inspired by the 80s
 * Popular among developers
 * Source: https://github.com/dracula/dracula-theme
 */
export const dracula: GoghTheme = {
	name: "Dracula",
	author: "Zeno Rocha",
	colors: [
		"#21222c", // 0: black
		"#ff5555", // 1: red
		"#50fa7b", // 2: green
		"#f1fa8c", // 3: yellow
		"#bd93f9", // 4: blue
		"#ff79c6", // 5: magenta
		"#8be9fd", // 6: cyan
		"#f8f8f2", // 7: white
		"#6272a4", // 8: bright black
		"#ff6e6e", // 9: bright red
		"#69ff94", // 10: bright green
		"#ffffa5", // 11: bright yellow
		"#d6acff", // 12: bright blue
		"#ff92df", // 13: bright magenta
		"#a4ffff", // 14: bright cyan
		"#ffffff", // 15: bright white
	],
};

/**
 * Nord - An arctic, north-bluish color palette
 * Great for reducing eye strain
 * Source: https://github.com/arcticicestudio/nord
 */
export const nord: GoghTheme = {
	name: "Nord",
	author: "Arctic Ice Studio",
	colors: [
		"#2e3440", // 0: black
		"#bf616a", // 1: red
		"#a3be8c", // 2: green
		"#ebcb8b", // 3: yellow
		"#81a1c1", // 4: blue
		"#b48ead", // 5: magenta
		"#88c0d0", // 6: cyan
		"#eceff4", // 7: white
		"#4c566a", // 8: bright black
		"#bf616a", // 9: bright red
		"#a3be8c", // 10: bright green
		"#ebcb8b", // 11: bright yellow
		"#81a1c1", // 12: bright blue
		"#b48ead", // 13: bright magenta
		"#8fbcbb", // 14: bright cyan
		"#eceff4", // 15: bright white
	],
};

/**
 * One Dark - Atom's One Dark theme for the terminal
 * High contrast, easy on the eyes
 * Source: https://github.com/one-dark
 */
export const oneDark: GoghTheme = {
	name: "One Dark",
	author: "Atom",
	colors: [
		"#1e1e1e", // 0: black
		"#e06c75", // 1: red
		"#98c379", // 2: green
		"#d19a66", // 3: yellow
		"#61afef", // 4: blue
		"#c678dd", // 5: magenta
		"#56b6c2", // 6: cyan
		"#abb2bf", // 7: white
		"#5c6370", // 8: bright black
		"#e06c75", // 9: bright red
		"#98c379", // 10: bright green
		"#d19a66", // 11: bright yellow
		"#61afef", // 12: bright blue
		"#c678dd", // 13: bright magenta
		"#56b6c2", // 14: bright cyan
		"#c7cfd8", // 15: bright white
	],
};

/**
 * Solarized Dark - Precision colors for machines and people
 * Based on CIELAB color space
 * Source: https://github.com/altercation/solarized
 */
export const solarizedDark: GoghTheme = {
	name: "Solarized Dark",
	author: "Ethan Schoonover",
	colors: [
		"#002b36", // 0: black (base03)
		"#dc322f", // 1: red
		"#859900", // 2: green
		"#b58900", // 3: yellow
		"#268bd2", // 4: blue
		"#d33682", // 5: magenta
		"#2aa198", // 6: cyan
		"#839496", // 7: white (base0)
		"#073642", // 8: bright black (base02)
		"#cb4b16", // 9: bright red
		"#586e75", // 10: bright green
		"#657b83", // 11: bright yellow
		"#839496", // 12: bright blue
		"#6c71c4", // 13: bright magenta
		"#93a1a1", // 14: bright cyan (base1)
		"#fdf6e3", // 15: bright white (base3)
	],
};

/**
 * Monokai - Beautiful dark Sublime Text theme
 * High contrast with vibrant colors
 * Source: https://www.monokai.pro/
 */
export const monokai: GoghTheme = {
	name: "Monokai",
	author: "Wimer Hazenberg",
	colors: [
		"#272822", // 0: black
		"#f92672", // 1: red
		"#a6e22e", // 2: green
		"#f4bf75", // 3: yellow
		"#66d9ef", // 4: blue
		"#ae81ff", // 5: magenta
		"#a1efe4", // 6: cyan
		"#f8f8f2", // 7: white
		"#75715e", // 8: bright black (comment)
		"#f92672", // 9: bright red
		"#a6e22e", // 10: bright green
		"#e6db74", // 11: bright yellow
		"#66d9ef", // 12: bright blue
		"#ae81ff", // 13: bright magenta
		"#a1efe4", // 14: bright cyan
		"#f9f8f5", // 15: bright white
	],
};

/**
 * Map Gogh palette indices to syntax token colors
 * These mappings work well across all bundled schemes
 */
export const tokenColorMapping: TokenColorMapping = {
	keyword: 4,      // Blue (generally keywords)
	string: 2,       // Green (string literals)
	number: 3,       // Yellow (numeric literals)
	comment: 8,      // Bright black (comments)
	type: 6,         // Cyan (type annotations)
	function: 3,     // Yellow (function names)
	variable: 7,     // White/default (variable names)
	operator: 7,     // White/default (operators)
	punctuation: 8,  // Bright black (punctuation)
	constant: 5,     // Magenta (constants/literals)
	property: 7,     // White/default (object properties)
};

/**
 * Map UI chrome to Gogh palette
 * Used for mode colors and UI elements
 */
export const uiChromeMapping: UIChromeColors = {
	normal: 2,       // Green (normal mode)
	insert: 4,       // Blue (insert mode)
	visual: 3,       // Yellow (visual mode)
	command: 3,      // Yellow (command mode)
	statusBg: 0,     // Black (status bar background)
	textFg: 7,       // White (default text)
};

/**
 * Available themes
 * Export mapping of theme name to theme definition
 */
export const themes: Record<string, GoghTheme> = {
	dracula,
	nord,
	"one-dark": oneDark,
	"solarized-dark": solarizedDark,
	monokai,
};

/**
 * Get theme by name
 * Returns default (Dracula) if theme not found
 */
export const getTheme = (themeName: string): GoghTheme => {
	return themes[themeName] || dracula;
};

/**
 * List available theme names
 */
export const getAvailableThemes = (): string[] => {
	return Object.keys(themes);
};
