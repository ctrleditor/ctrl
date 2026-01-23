/**
 * Configuration schema validation using Zod
 * Enables type-safe configuration with helpful error messages
 */

import { z } from "zod";
import { loadCompleteTheme, detectGhosttyTheme, mapGhosttyTheme } from "../ui/themes/index";
import { dracula } from "../ui/themes/schemes";

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
 * Status Bar Component configuration schema
 */
export const StatusBarComponentSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("mode"),
		colors: z
			.object({
				normal: z.string().default("#88BB22"),
				insert: z.string().default("#22AAFF"),
				visual: z.string().default("#FF9922"),
				visualLine: z.string().default("#FF9922"),
				visualBlock: z.string().default("#FF9922"),
				command: z.string().default("#FFFF00"),
			})
			.optional(),
	}),
	z.object({
		type: z.literal("text"),
		text: z.string(),
		fg: z.string().optional(),
		bg: z.string().optional(),
	}),
	z.object({
		type: z.literal("filePath"),
		truncate: z.number().int().min(5).default(50),
	}),
	z.object({
		type: z.literal("position"),
		format: z.string().default("Ln {line}, Col {col}"),
	}),
	z.object({
		type: z.literal("modified"),
		text: z.string().default("[+]"),
		fg: z.string().optional(),
	}),
	z.object({
		type: z.literal("gitBranch"),
		ifExists: z.boolean().default(false),
	}),
	z.object({
		type: z.literal("lineCount"),
	}),
	z.object({
		type: z.literal("fileSize"),
		format: z.enum(["bytes", "kb", "human"]).default("bytes"),
	}),
]);

export type StatusBarComponentType = z.infer<typeof StatusBarComponentSchema>;

export const StatusBarLayoutSchema = z.object({
	enabled: z.boolean().default(true),
	height: z.number().int().min(1).max(3).default(1),
	backgroundColor: z.string().default("#1a1a1a"),
	components: z.record(StatusBarComponentSchema).default({}),
	layout: z
		.object({
			left: z.array(z.string()).default([]),
			center: z.array(z.string()).default([]),
			right: z.array(z.string()).default([]),
		})
		.default({}),
});

export type StatusBarLayoutType = z.infer<typeof StatusBarLayoutSchema>;

/**
 * UI/Theme configuration schema
 */
export const UIConfigSchema = z.object({
	theme: z
		.string()
		.default("dracula"),
	colors: z
		.object({
			normalMode: z.string().default("#88BB22"),
			insertMode: z.string().default("#22AAFF"),
			visualMode: z.string().default("#FF9922"),
			commandMode: z.string().default("#FFFF00"),
			statusBarBg: z.string().default("#1a1a1a"),
			textFg: z.string().default("#FFFFFF"),
			syntax: z
				.object({
					keyword: z.string().optional(),
					string: z.string().optional(),
					number: z.string().optional(),
					comment: z.string().optional(),
					type: z.string().optional(),
					function: z.string().optional(),
					variable: z.string().optional(),
					operator: z.string().optional(),
					punctuation: z.string().optional(),
					constant: z.string().optional(),
					property: z.string().optional(),
				})
				.optional(),
		})
		.optional(),
	lineNumbers: z.boolean().default(true),
	relativeLineNumbers: z.boolean().default(false),
	statusBar: StatusBarLayoutSchema.optional(),
});

export type UIConfigType = z.infer<typeof UIConfigSchema>;

/**
 * Syntax colors type extracted from UI config
 */
export type SyntaxColorsType = Exclude<UIConfigType["colors"], undefined>["syntax"];

/**
 * Keybinds configuration schema
 * Maps command names to key combinations per mode
 */
export const KeybindsSchema = z.object({
	normal: z.record(z.string(), z.string()).default({
		i: "enter_insert",
		v: "enter_visual",
		"/": "enter_command",
		h: "move_left",
		j: "move_down",
		k: "move_up",
		l: "move_right",
	}),
	insert: z.record(z.string(), z.string()).default({
		escape: "enter_normal",
		"ctrl+c": "enter_normal",
		"ctrl+d": "enter_normal",
		return: "insert_newline",
		backspace: "delete_char",
		"ctrl+h": "move_left",
		"ctrl+j": "move_down",
		"ctrl+k": "move_up",
		"ctrl+l": "move_right",
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
 * Uses Dracula Gogh theme by default, or auto-detected Ghostty theme if available
 */
export const getConfigDefaults = (themeName?: string): ConfigType => {
	// Use provided theme or default to dracula
	const selectedTheme = themeName || "dracula";
	const theme = loadCompleteTheme(selectedTheme);

	return {
		editor: EditorConfigSchema.parse({}),
		ai: AIConfigSchema.parse({}),
		ui: UIConfigSchema.parse({
			theme: selectedTheme,
			colors: {
				normalMode: theme.uiColors.normalMode,
				insertMode: theme.uiColors.insertMode,
				visualMode: theme.uiColors.visualMode,
				commandMode: theme.uiColors.commandMode,
				statusBarBg: theme.uiColors.statusBarBg,
				textFg: theme.uiColors.textFg,
				syntax: theme.syntaxColors,
			},
			statusBar: {
				enabled: true,
				height: 1,
				backgroundColor: theme.uiColors.statusBarBg,
				components: {
					mode: { type: "mode" as const },
					filePath: { type: "filePath" as const, truncate: 50 },
					position: { type: "position" as const, format: "Ln {line}, Col {col}" },
				},
				layout: {
					left: ["mode"],
					center: ["filePath"],
					right: ["position"],
				},
			},
		}),
		keybinds: KeybindsSchema.parse({}),
	};
};

/**
 * Get defaults with async theme detection (Ghostty)
 * Detects theme from Ghostty config if available, falls back to dracula
 */
export const getConfigDefaultsWithDetection = async (): Promise<ConfigType> => {
	let themeName = "dracula";

	try {
		const ghosttyTheme = await detectGhosttyTheme();
		if (ghosttyTheme) {
			const mappedTheme = mapGhosttyTheme(ghosttyTheme);
			if (mappedTheme) {
				themeName = mappedTheme;
			}
		}
	} catch {
		// Fall back to dracula if detection fails
	}

	return getConfigDefaults(themeName);
};

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
