/**
 * Configuration file watcher
 * Monitors config file for changes and notifies on reload
 */

import { existsSync, watch } from "node:fs";
import { getConfigPath } from "./loader";

export type ConfigWatcherCallback = () => void;

/**
 * Watch config file for changes
 * Calls callback when config file is modified
 * If file doesn't exist yet, returns noop cleanup function
 */
export const watchConfig = (callback: ConfigWatcherCallback): (() => void) => {
	const configPath = getConfigPath();
	let debounceTimeout: NodeJS.Timeout | null = null;

	// Only watch if file exists
	if (!existsSync(configPath)) {
		console.log(`Config file not found at ${configPath}, watching will start once created`);
		// Return noop cleanup function
		return () => {
			if (debounceTimeout) clearTimeout(debounceTimeout);
		};
	}

	const watcher = watch(configPath, eventType => {
		// Debounce file change events (fs.watch can fire multiple times)
		if (debounceTimeout) clearTimeout(debounceTimeout);

		debounceTimeout = setTimeout(() => {
			if (eventType === "change" || eventType === "rename") {
				console.log("Config file changed, reloading...");
				callback();
			}
		}, 100);
	});

	// Return cleanup function
	return () => {
		watcher.close();
		if (debounceTimeout) clearTimeout(debounceTimeout);
	};
};
