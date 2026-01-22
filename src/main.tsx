/**
 * Ctrl Editor - Main Application Entry Point
 *
 * Functional application architecture:
 * - No classes, pure functions only
 * - Type-safe with TypeScript interfaces
 * - Configuration validated with Zod
 * - Bun as runtime
 * - OpenTUI for terminal rendering
 */

import type { AppState } from "@/types/app";

import { loadConfig } from "@/config/loader";
import { getConfigDefaults, mergeWithDefaults, validateConfig } from "@/config/schema";
import type { KeybindsType, UIConfigType } from "@/config/schema";
import { watchConfig } from "@/config/watcher";
import { createBuffer } from "@/core/buffer";
import { createRegistry } from "@/core/commands/registry";
import { createModalState } from "@/core/modal";
import { handleKeystroke, runApp } from "@/ui/renderer";

/**
 * Initialize application
 * Pure function: creates initial state
 */
export const initializeApp = (uiConfig: UIConfigType, keybinds: KeybindsType): AppState => {
	// Create initial buffer
	const buffer = createBuffer("main", "untitled.ts", "// Welcome to Ctrl Editor\n", "typescript");

	// Create modal system
	const modal = createModalState();

	// Create command registry and register built-in commands
	const commandRegistry = createRegistry();

	return {
		buffer,
		modal,
		commandRegistry,
		config: {
			ui: uiConfig,
			keybinds,
		},
	};
};

/**
 * Main application entry point
 */
const main = async (): Promise<void> => {
	// Load configuration from file (or use defaults if file doesn't exist)
	const config = await loadConfig();

	const uiConfig = config.ui;
	const keybinds = config.keybinds;

	console.log("✓ Configuration loaded");
	console.log("✓ Using Bun runtime");
	console.log("✓ TypeScript + Functional FP + React");
	console.log("✓ OpenTUI React rendering");

	// Initialize application
	const initialState = initializeApp(uiConfig, keybinds);
	console.log("✓ Application initialized");

	// Set up config hot-reload
	const setupConfigReload = (
		callback: (newConfig: { ui: UIConfigType; keybinds: KeybindsType }) => void
	) => {
		watchConfig(async () => {
			try {
				const newConfig = await loadConfig();
				callback({
					ui: newConfig.ui,
					keybinds: newConfig.keybinds,
				});
			} catch (err) {
				console.error("Failed to reload config:", err);
			}
		});
	};

	// Run the application with React rendering and config hot-reload
	await runApp(initialState, handleKeystroke, uiConfig, setupConfigReload);

	console.log("\n✓ Application closed!");
};

// Run main
main().catch(console.error);
