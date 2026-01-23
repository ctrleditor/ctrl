/**
 * Edit command - Open file in Ctrl editor
 * Using bunli CLI framework
 */

import * as fs from "bun:fs";

import { defineCommand, option } from "@bunli/core";
import { z } from "zod";

export default defineCommand({
	name: "edit",
	description: "Open file in Ctrl editor",
	options: {
		file: option(z.string().optional(), {
			description: "File to open",
		}),
		"dev-plugin": option(z.string().optional(), {
			description: "Load local plugin for development",
			short: "p",
		}),
		"log-level": option(z.enum(["debug", "info", "warn", "error"]).optional(), {
			description: "Set log level",
			short: "l",
		}),
		config: option(z.string().optional(), {
			description: "Use custom config file",
			short: "c",
		}),
	},
	handler: async ({ flags }) => {
		const file = flags.file as string | undefined;

		if (!file) {
			console.error("Error: No file specified");
			process.exit(1);
		}

		// Check if file exists
		try {
			fs.accessSync(file);
			console.log(`Opening: ${file}`);
		} catch {
			console.log(`Creating new file: ${file}`);
		}

		if (flags["dev-plugin"]) {
			console.log(`Loading dev plugin: ${flags["dev-plugin"]}`);
		}

		if (flags["log-level"]) {
			console.log(`Log level: ${flags["log-level"]}`);
		}

		if (flags.config) {
			console.log(`Config file: ${flags.config}`);
		}

		console.log("Editor starting...");
		// TODO: Initialize editor with file
	},
});
