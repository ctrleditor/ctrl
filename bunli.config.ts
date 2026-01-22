/**
 * Ctrl CLI Configuration
 * Using bunli CLI framework for Bun
 *
 * See: https://bunli.dev
 */

import { defineConfig } from "@bunli/core";

export default defineConfig({
	name: "ctrl",
	version: "0.1.0",
	description: "Hyperextensible AI-native terminal editor",

	/**
	 * Commands are auto-discovered from src/cli/commands/
	 */
	commands: {
		directory: "./src/cli/commands",
	},

	/**
	 * Build configuration for standalone binaries
	 * See: https://bun.com/docs/bundler/executables
	 */
	build: {
		entry: "./src/cli/main.ts",
		outdir: "./dist",
		targets: ["native"],
		minify: true,
		sourcemap: true,
		compress: false,
	},

	/**
	 * Development configuration
	 */
	dev: {
		watch: true,
		inspect: true,
	},

	/**
	 * Testing configuration
	 */
	test: {
		pattern: ["**/*.test.ts", "**/*.spec.ts"],
		coverage: true,
		watch: false,
	},

	plugins: [],
});
