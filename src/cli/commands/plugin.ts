/**
 * Plugin command - Manage Ctrl plugins
 * Using bunli CLI framework
 */

import { defineCommand, option } from "@bunli/core";
import { z } from "zod";

export default defineCommand({
	name: "plugin",
	description: "Manage Ctrl plugins",
	options: {
		action: option(z.enum(["list", "install"]).optional(), {
			description: "Plugin action (list, install)",
			short: "a",
		}),
		name: option(z.string().optional(), {
			description: "Plugin name to install",
			short: "n",
		}),
	},
	handler: async ({ flags }) => {
		const action = flags.action as string | undefined;
		const name = flags.name as string | undefined;

		if (action === "list" || !action) {
			console.log("Installed plugins:");
			console.log("  (none yet)");
		} else if (action === "install") {
			if (!name) {
				console.error("Error: Plugin name required for install");
				process.exit(1);
			}
			console.log(`Installing plugin: ${name}`);
			// TODO: Implement plugin installation
		} else {
			console.log("Unknown plugin action. Use: ctrl plugin --action list|install");
		}
	},
});
