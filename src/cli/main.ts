#!/usr/bin/env bun

/**
 * Ctrl CLI - Command Line Interface
 *
 * Using bunli CLI framework for Bun:
 * - Type-safe command definitions with Zod schemas
 * - Automatic help generation
 * - No manual argument parsing needed
 *
 * Bunli Documentation: https://bunli.dev
 *
 * Commands are auto-discovered from src/cli/commands/ directory.
 * Each command uses defineCommand() with Zod validation.
 */

import { createCLI } from "@bunli/core";
import { edit, plugin } from "./commands";

/**
 * Main CLI entry point
 * Creates CLI instance, registers commands, and runs
 */
const main = async (): Promise<void> => {
	const cli = await createCLI({
		name: "ctrl",
		version: "0.1.0",
		description: "Hyperextensible AI-native terminal editor",
	});

	/**
	 * Register commands
	 */
	cli.command(edit);
	cli.command(plugin);

	/**
	 * Run CLI with Bun arguments
	 */
	await cli.run();
};

/**
 * Execute main
 */
main().catch(error => {
	console.error("Fatal error:", error);
	process.exit(1);
});
