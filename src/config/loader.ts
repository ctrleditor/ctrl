/**
 * Configuration file loader
 * Reads and parses TOML config files
 */

import { homedir } from "bun:os";
import { join } from "bun:path";
import { type ConfigType, mergeWithDefaults, validateConfig } from "./schema";

/**
 * Get config file path (~/.config/ctrl/config.toml)
 * Follows XDG Base Directory specification
 */
export const getConfigPath = (): string => {
	const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
	return join(configHome, "ctrl", "config.toml");
};

/**
 * Configuration load result
 */
export type ConfigLoadResult = {
	readonly config: ConfigType;
	readonly configFileExists: boolean;
};

/**
 * Simple TOML parser for basic key-value pairs
 * Handles the config format we use: simple sections and key=value pairs
 * Note: This is a minimal parser suitable for our config format only.
 * For complex TOML, use a proper library.
 */
const parseSimpleTOML = (content: string): Record<string, unknown> => {
	const result: Record<string, unknown> = {};
	let currentSection = result;

	for (const line of content.split("\n")) {
		const trimmed = line.trim();

		// Skip empty lines and comments
		if (!trimmed || trimmed.startsWith("#")) continue;

		// Handle section headers [section.subsection]
		if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
			const sectionPath = trimmed.slice(1, -1).split(".");
			currentSection = result;

			for (const part of sectionPath) {
				if (!currentSection[part]) {
					currentSection[part] = {};
				}
				currentSection = currentSection[part] as Record<string, unknown>;
			}
			continue;
		}

		// Handle key = value pairs
		const eqIndex = trimmed.indexOf("=");
		if (eqIndex > 0) {
			const key = trimmed.slice(0, eqIndex).trim();
			const valueStr = trimmed.slice(eqIndex + 1).trim();

			// Parse value (string, number, boolean)
			let value: unknown;
			if (valueStr === "true") {
				value = true;
			} else if (valueStr === "false") {
				value = false;
			} else if (
				(valueStr.startsWith('"') && valueStr.endsWith('"')) ||
				(valueStr.startsWith("'") && valueStr.endsWith("'"))
			) {
				// Remove quotes
				value = valueStr.slice(1, -1);
			} else if (!Number.isNaN(Number(valueStr)) && valueStr !== "") {
				value = Number(valueStr);
			} else {
				// Treat as string
				value = valueStr;
			}

			currentSection[key] = value;
		}
	}

	return result;
};

/**
 * Load configuration from file
 * Returns merged config with defaults, or defaults if file doesn't exist
 * Uses direct file reading to avoid module caching issues with hot-reload
 */
export const loadConfig = async (): Promise<ConfigLoadResult> => {
	const configPath = getConfigPath();
	const { existsSync, readFileSync } = await import("bun:fs");

	try {
		// Check if file exists
		if (!existsSync(configPath)) {
			console.log(`Config file not found at ${configPath}`);
			console.log(`To customize keybindings, create ${configPath}`);
			return {
				config: mergeWithDefaults({}),
				configFileExists: false,
			};
		}

		// Read file directly from disk (not cached) to support hot-reload
		const content = readFileSync(configPath, "utf-8");
		const configData = parseSimpleTOML(content);

		// Validate against schema
		const validation = validateConfig(configData);
		if (!validation.ok) {
			console.warn("Config validation failed:", validation.error);
			return {
				config: mergeWithDefaults({}),
				configFileExists: true,
			};
		}

		return {
			config: mergeWithDefaults(validation.value),
			configFileExists: true,
		};
	} catch (err) {
		// TOML parse error or other issue
		console.warn(
			`Failed to load config from ${configPath}:`,
			err instanceof Error ? err.message : err,
		);
		return {
			config: mergeWithDefaults({}),
			configFileExists: false,
		};
	}
};

/**
 * Example config content for documentation
 */
export const EXAMPLE_CONFIG = `
# Ctrl Editor Configuration
# Save this as ~/.config/ctrl/config.toml

[ui.colors]
normalMode = "#88BB22"
insertMode = "#22AAFF"
visualMode = "#FF9922"
commandMode = "#FFFF00"
statusBarBg = "#1a1a1a"
textFg = "#FFFFFF"

[keybinds.normal]
i = "enter_insert"
v = "enter_visual"
":" = "enter_command"
h = "move_left"
j = "move_down"
k = "move_up"
l = "move_right"

[keybinds.insert]
escape = "enter_normal"
"ctrl+c" = "enter_normal"
"ctrl+d" = "enter_normal"

[keybinds.visual]
# Add visual mode keybinds here

[keybinds.command]
# Add command mode keybinds here
`;
