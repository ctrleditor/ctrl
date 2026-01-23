/**
 * User-defined themes loader
 * Loads custom Gogh themes from ~/.config/ctrl/themes/
 */

import { homedir } from "os";
import { join } from "path";
import type { GoghTheme } from "./types";

/**
 * Load a user-defined theme from ~/.config/ctrl/themes/{themeName}.json
 *
 * Theme file format (JSON):
 * ```json
 * {
 *   "name": "My Custom Theme",
 *   "author": "Your Name",
 *   "colors": [
 *     "#000000", "#ff0000", ... (16+ colors)
 *   ]
 * }
 * ```
 */
export const loadUserTheme = async (themeName: string): Promise<GoghTheme | null> => {
	try {
		const themesDir = join(homedir(), ".config", "ctrl", "themes");
		const themePath = join(themesDir, `${themeName}.json`);

		const file = Bun.file(themePath);
		if (!(await file.exists())) {
			return null;
		}

		const content = await file.json();

		// Validate theme structure
		if (!content.name || !Array.isArray(content.colors) || content.colors.length < 16) {
			return null;
		}

		return content as GoghTheme;
	} catch {
		// Return null if theme can't be loaded
		return null;
	}
};

/**
 * List all available user themes
 *
 * Scans ~/.config/ctrl/themes/ for .json files
 */
export const listUserThemes = async (): Promise<string[]> => {
	try {
		const themesDir = join(homedir(), ".config", "ctrl", "themes");
		const dirFile = Bun.file(themesDir);

		if (!(await dirFile.isDirectory())) {
			return [];
		}

		const themes: string[] = [];
		for await (const entry of dirFile.readdir?.() || []) {
			if (entry.name.endsWith(".json")) {
				const themeName = entry.name.slice(0, -5); // Remove .json
				themes.push(themeName);
			}
		}

		return themes.sort();
	} catch {
		return [];
	}
};
