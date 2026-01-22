/**
 * Configuration schema validation using Zod
 * Enables type-safe configuration with helpful error messages
 */

import { z } from "zod";

/**
 * Editor configuration schema
 */
export const EditorConfigSchema = z.object({
	lineNumbers: z.boolean().default(true),
	relativeLineNumbers: z.boolean().default(false),
	tabWidth: z.number().int().min(1).max(8).default(2),
	insertSpaces: z.boolean().default(true),
	wordWrap: z.boolean().default(false),
	autoSave: z.boolean().default(true),
	autoSaveDelay: z.number().int().min(100).default(1000),
});

export type EditorConfigType = z.infer<typeof EditorConfigSchema>;

/**
 * AI configuration schema
 */
export const AIConfigSchema = z.object({
	provider: z.enum(["anthropic", "openai", "local"]).default("anthropic"),
	model: z.string().default("claude-sonnet-4-20250514"),
	temperature: z.number().min(0).max(1).default(0.7),
	maxTokens: z.number().int().min(1).default(8000),
	timeout: z.number().int().min(1000).default(30000),
	inlineCompletion: z
		.object({
			enabled: z.boolean().default(true),
			triggerDelay: z.number().int().min(100).default(500),
			minConfidence: z.number().min(0).max(1).default(0.7),
		})
		.optional(),
});

export type AIConfigType = z.infer<typeof AIConfigSchema>;

/**
 * UI/Theme configuration schema
 */
export const UIConfigSchema = z.object({
	colors: z
		.object({
			normalMode: z.string().default("#88BB22"),
			insertMode: z.string().default("#22AAFF"),
			visualMode: z.string().default("#FF9922"),
			commandMode: z.string().default("#FFFF00"),
			statusBarBg: z.string().default("#1a1a1a"),
			textFg: z.string().default("#FFFFFF"),
		})
		.optional(),
	lineNumbers: z.boolean().default(true),
	relativeLineNumbers: z.boolean().default(false),
});

export type UIConfigType = z.infer<typeof UIConfigSchema>;

/**
 * Keybinds configuration schema
 * Maps command names to key combinations per mode
 */
export const KeybindsSchema = z.object({
	normal: z.record(z.string(), z.string()).default({
		i: "enter_insert",
		v: "enter_visual",
		":": "enter_command",
		h: "move_left",
		j: "move_down",
		k: "move_up",
		l: "move_right",
	}),
	insert: z.record(z.string(), z.string()).default({
		escape: "enter_normal",
		"ctrl+c": "enter_normal",
		"ctrl+d": "enter_normal",
	}),
	visual: z.record(z.string(), z.string()).default({}),
	command: z.record(z.string(), z.string()).default({}),
});

export type KeybindsType = z.infer<typeof KeybindsSchema>;

/**
 * Full configuration schema
 */
export const ConfigSchema = z.object({
	editor: EditorConfigSchema.optional(),
	ai: AIConfigSchema.optional(),
	ui: UIConfigSchema.optional(),
	keybinds: KeybindsSchema.optional(),
});

export type ConfigType = z.infer<typeof ConfigSchema>;

/**
 * Parse and validate configuration
 * Returns Result type to avoid exceptions
 */
export const validateConfig = (data: unknown): Result<ConfigType, string[]> => {
	const result = ConfigSchema.safeParse(data);

	if (result.success) {
		return {
			ok: true,
			value: result.data,
		};
	}

	const errors = result.error.errors.map((e: (typeof result.error.errors)[0]) => {
		const path = e.path.join(".");
		return `${path || "root"}: ${e.message}`;
	});

	return {
		ok: false,
		error: errors,
	};
};

/**
 * Result type for validation without exceptions
 */
type Result<T, E> =
	| { readonly ok: true; readonly value: T }
	| { readonly ok: false; readonly error: E };

/**
 * Get defaults for configuration
 * Useful when partial config is provided
 */
export const getConfigDefaults = (): ConfigType => ({
	editor: EditorConfigSchema.parse({}),
	ai: AIConfigSchema.parse({}),
	ui: UIConfigSchema.parse({}),
	keybinds: KeybindsSchema.parse({}),
});

/**
 * Merge partial config with defaults
 */
export const mergeWithDefaults = (partial: Partial<ConfigType>): ConfigType => {
	const defaults = getConfigDefaults();

	const keybinds = partial.keybinds ?? {};
	const defaultKeybinds = defaults.keybinds ?? KeybindsSchema.parse({});
	return {
		editor: { ...defaults.editor, ...(partial.editor ?? {}) } as EditorConfigType,
		ai: { ...defaults.ai, ...(partial.ai ?? {}) } as AIConfigType,
		ui: { ...defaults.ui, ...(partial.ui ?? {}) } as UIConfigType,
		keybinds: {
			normal: { ...defaultKeybinds.normal, ...(keybinds.normal ?? {}) },
			insert: { ...defaultKeybinds.insert, ...(keybinds.insert ?? {}) },
			visual: { ...defaultKeybinds.visual, ...(keybinds.visual ?? {}) },
			command: { ...defaultKeybinds.command, ...(keybinds.command ?? {}) },
		} as KeybindsType,
	};
};
