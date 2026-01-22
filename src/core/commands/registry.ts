/**
 * Command registry using functional programming
 * Zod for validation, no classes
 */

import type { Command, CommandContext } from "@/types";

import { z } from "zod";

/**
 * Schema for validating commands
 */
const CommandSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	category: z.string().min(1),
});

type CommandInput = z.infer<typeof CommandSchema>;

/**
 * In-memory command registry
 * Mutable map to store commands (side effect at boundary)
 */
interface CommandRegistry {
	readonly commands: Map<string, Command>;
}

/**
 * Create a new command registry
 */
export const createRegistry = (): CommandRegistry => ({
	commands: new Map(),
});

/**
 * Register a command in the registry
 * Pure function that returns new registry state
 */
export const registerCommand = (
	registry: CommandRegistry,
	input: CommandInput,
	handler: (context: CommandContext) => Promise<void> | void
): Result<CommandRegistry, string> => {
	// Validate input with Zod
	const validation = CommandSchema.safeParse(input);
	if (!validation.success) {
		return {
			ok: false,
			error: `Invalid command: ${validation.error.message}`,
		};
	}

	// Check for duplicates
	if (registry.commands.has(validation.data.id)) {
		return {
			ok: false,
			error: `Command already registered: ${validation.data.id}`,
		};
	}

	// Create new command
	const command: Command = {
		...validation.data,
		handler,
	};

	// Return new registry with command added
	const newCommands = new Map(registry.commands);
	newCommands.set(command.id, command);

	return {
		ok: true,
		value: { commands: newCommands },
	};
};

/**
 * Execute a command
 */
export const executeCommand = async (
	registry: CommandRegistry,
	id: string,
	context: CommandContext
): Promise<Result<void, string>> => {
	const command = registry.commands.get(id);

	if (!command) {
		return {
			ok: false,
			error: `Command not found: ${id}`,
		};
	}

	try {
		await Promise.resolve(command.handler(context));
		return { ok: true, value: undefined };
	} catch (error) {
		return {
			ok: false,
			error: `Command failed: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
};

/**
 * Get all registered commands
 */
export const listCommands = (registry: CommandRegistry): readonly Command[] =>
	Array.from(registry.commands.values());

/**
 * Unregister a command
 */
export const unregisterCommand = (registry: CommandRegistry, id: string): CommandRegistry => {
	const newCommands = new Map(registry.commands);
	newCommands.delete(id);
	return { commands: newCommands };
};

/**
 * Result type for error handling without exceptions
 * Discriminated union pattern
 */
type Result<T, E> =
	| { readonly ok: true; readonly value: T }
	| { readonly ok: false; readonly error: E };

/**
 * Example built-in commands
 */

export const moveLeftCommand: Command = {
	id: "move_left",
	title: "Move Cursor Left",
	category: "Navigation",
	handler: ({ position }) => {
		console.log("Moving left from", position);
		// Implementation in cursor module
	},
};

export const moveRightCommand: Command = {
	id: "move_right",
	title: "Move Cursor Right",
	category: "Navigation",
	handler: ({ position }) => {
		console.log("Moving right from", position);
	},
};

export const deleteLineCommand: Command = {
	id: "delete_line",
	title: "Delete Line",
	category: "Edit",
	handler: ({ buffer, position }) => {
		console.log("Deleting line", position.line, "in", buffer.id);
	},
};
