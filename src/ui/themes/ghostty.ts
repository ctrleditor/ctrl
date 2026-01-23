/**
 * Ghostty terminal theme detection
 * Reads theme from ~/.config/ghostty/config
 */

import { homedir } from "os";
import { join } from "path";

/**
 * Parse Ghostty config file and extract theme name
 *
 * Ghostty config format:
 * ```
 * theme = dracula
 * ```
 */
const parseGhosttyConfig = (content: string): string | null => {
	const lines = content.split("\n");
	for (const line of lines) {
		const match = line.match(/^\s*theme\s*=\s*(.+)$/);
		if (match) {
			return match[1].trim();
		}
	}
	return null;
};

/**
 * Detect theme from Ghostty config
 *
 * @returns Theme name if found in Ghostty config, null otherwise
 */
export const detectGhosttyTheme = async (): Promise<string | null> => {
	try {
		const configPath = join(homedir(), ".config", "ghostty", "config");
		const file = Bun.file(configPath);

		if (!(await file.exists())) {
			return null;
		}

		const content = await file.text();
		return parseGhosttyConfig(content);
	} catch {
		// Silently fail if Ghostty config can't be read
		return null;
	}
};

/**
 * List of Ghostty-compatible themes
 * (Maps Ghostty theme names to our theme system)
 */
export const ghosttyThemeMapping: Record<string, string> = {
	// Ghostty has built-in themes that may not match our names exactly
	// Map them to our theme system
	dracula: "dracula",
	"dracula-pro": "dracula",
	nord: "nord",
	"one-dark": "one-dark",
	"solarized-dark": "solarized-dark",
	"solarized-light": "solarized-dark", // fallback to dark
	monokai: "monokai",
	"monokai-pro": "monokai",

	// Common Ghostty theme aliases
	"draculaprotheme": "dracula",
	"nord-light": "nord",
	"one-dark-pro": "one-dark",
	"solarized": "solarized-dark",
	"catppuccin-frappe": "dracula", // similar vibe
	"catppuccin-mocha": "dracula", // similar vibe
};

/**
 * Map a Ghostty theme name to our supported themes
 * Returns the mapped theme or null if unmapped
 */
export const mapGhosttyTheme = (ghosttyTheme: string): string | null => {
	const normalized = ghosttyTheme.toLowerCase().trim();
	return ghosttyThemeMapping[normalized] || null;
};
