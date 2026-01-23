/**
 * Gogh theme integration types
 * Supports 300+ color schemes from https://github.com/Gogh-Co/Gogh
 */

/**
 * ANSI color palette from Gogh scheme
 * Index 0-7: Normal colors, 8-15: Bright colors
 * Can have 16 colors (standard) or 16+ (extended)
 */
export interface GoghTheme {
	readonly name: string;
	readonly author?: string;
	readonly colors: readonly string[]; // 16+ hex colors (#RRGGBB)
}

/**
 * Syntax token colors mapped from Gogh palette
 * Each token type gets a color from the ANSI palette
 */
export interface SyntaxColorsFromTheme {
	readonly keyword: string;
	readonly string: string;
	readonly number: string;
	readonly comment: string;
	readonly type: string;
	readonly function: string;
	readonly variable: string;
	readonly operator: string;
	readonly punctuation: string;
	readonly constant: string;
	readonly property: string;
}

/**
 * Map token type to color index in Gogh palette
 * Allows flexible color assignment from any Gogh scheme
 */
export interface TokenColorMapping {
	readonly keyword: number;      // Color index (0-15+)
	readonly string: number;
	readonly number: number;
	readonly comment: number;
	readonly type: number;
	readonly function: number;
	readonly variable: number;
	readonly operator: number;
	readonly punctuation: number;
	readonly constant: number;
	readonly property: number;
}

/**
 * UI chrome colors from Gogh palette
 * Used for mode colors, status bar, etc.
 */
export interface UIChromeColors {
	readonly normal: number;    // Normal mode color
	readonly insert: number;    // Insert mode color
	readonly visual: number;    // Visual mode color
	readonly command: number;   // Command mode color
	readonly statusBg: number;  // Status bar background
	readonly textFg: number;    // Default text foreground
}
