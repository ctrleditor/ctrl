/**
 * Configuration file loader
 * Reads and parses TOML config files
 */

import { homedir } from "node:os";
import { join } from "node:path";
import { mergeWithDefaults, validateConfig } from "./schema";
import type { ConfigType } from "./schema";

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
 * Load configuration from file
 * Returns merged config with defaults, or defaults if file doesn't exist
 */
export const loadConfig = async (): Promise<ConfigLoadResult> => {
	const configPath = getConfigPath();

	try {
		// Try to import TOML file
		const tomlModule = await import(configPath, {
			with: { type: "toml" },
		});

		const configData = tomlModule.default;

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
		// File doesn't exist or couldn't be parsed
		if (err instanceof Error && "code" in err && err.code === "MODULE_NOT_FOUND") {
			console.log(`Config file not found at ${configPath}`);
			console.log(`To customize keybindings, create ${configPath}`);
			return {
				config: mergeWithDefaults({}),
				configFileExists: false,
			};
		}

		// TOML parse error or other issue
		console.warn(
			`Failed to load config from ${configPath}:`,
			err instanceof Error ? err.message : err
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
