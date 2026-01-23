/**
 * Configuration file watcher
 * Monitors config file for changes and notifies on reload
 * Uses dual-mode watching: watches file directly if it exists,
 * watches parent directory if file doesn't exist (to detect creation)
 */

import { dirname, basename } from "bun:path";
import { existsSync, watch } from "bun:fs";
import type { FSWatcher } from "bun:fs";
import { getConfigPath } from "./loader";

export type ConfigWatcherCallback = () => void;

/**
 * Watch config file for changes
 * Calls callback when config file is modified or created
 * - If file exists: watches file directly
 * - If file missing: watches parent directory for file creation
 */
export const watchConfig = (callback: ConfigWatcherCallback): (() => void) => {
	const configPath = getConfigPath();
	const configDir = dirname(configPath);
	const configFilename = basename(configPath);
	let debounceTimeout: NodeJS.Timeout | null = null;
	let watcher: FSWatcher | null = null;
	let isWatchingDirectory = false;

	// Debounced callback wrapper for cleaner code
	const triggerReload = () => {
		if (debounceTimeout) clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			console.log("[Watch] Config file created/changed - triggering reload");
			callback();
		}, 100);
	};

	// Check if file exists at startup
	if (existsSync(configPath)) {
		// File exists: watch it directly
		console.log(`Watching config file: ${configPath}`);

		watcher = watch(configPath, (eventType, filename) => {
			console.log(`[Watch] File event: ${eventType} on ${filename}`);

			if (eventType === "change" || eventType === "rename") {
				triggerReload();
			}
		});
	} else {
		// File doesn't exist: watch directory for file creation
		console.log(`Watching directory for file creation: ${configDir}`);
		isWatchingDirectory = true;

		watcher = watch(configDir, (eventType, filename) => {
			// Only care about events for our config file
			if (filename !== configFilename) {
				return;
			}

			console.log(`[Watch] Directory event: ${eventType} on ${filename}`);

			// Only trigger if file now exists (avoids delete events)
			if (eventType === "rename" && existsSync(configPath)) {
				triggerReload();
			}
		});
	}

	// Return cleanup function
	return () => {
		if (watcher) {
			const watchMode = isWatchingDirectory ? "directory" : "file";
			console.log(`[Watch] Stopping ${watchMode} watch`);
			watcher.close();
		}
		if (debounceTimeout) clearTimeout(debounceTimeout);
	};
};
