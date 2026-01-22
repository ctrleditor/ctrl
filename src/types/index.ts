/**
 * Core type definitions for Ctrl editor
 * Using TypeScript interfaces, no classes
 */

// ============================================================================
// Buffer Types
// ============================================================================

export interface Position {
	readonly line: number;
	readonly column: number;
}

export interface Range {
	readonly start: Position;
	readonly end: Position;
}

export interface Selection {
	readonly anchor: Position;
	readonly active: Position;
}

export interface TextBuffer {
	readonly id: string;
	readonly content: string;
	readonly filePath: string;
	readonly isDirty: boolean;
	readonly language: string;
}

// ============================================================================
// Modal System Types
// ============================================================================

export type EditorMode =
	| "normal"
	| "insert"
	| "visual"
	| "visual-line"
	| "visual-block"
	| "command";

export interface ModalState {
	readonly currentMode: EditorMode;
	readonly previousMode: EditorMode;
	readonly commandBuffer: string;
	readonly cursorPosition: Position;
	readonly showHelpMenu: boolean;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface EditorConfig {
	readonly lineNumbers: boolean;
	readonly relativeLine: boolean;
	readonly tabWidth: number;
	readonly insertSpaces: boolean;
	readonly wordWrap: boolean;
}

export interface AIConfig {
	readonly provider: "anthropic" | "openai" | "local";
	readonly model: string;
	readonly temperature: number;
	readonly maxTokens: number;
}

export interface Config {
	readonly editor: EditorConfig;
	readonly ai: AIConfig;
	readonly keymaps: Record<string, Record<string, string>>;
}

// ============================================================================
// Command Types
// ============================================================================

export interface Command {
	readonly id: string;
	readonly title: string;
	readonly category: string;
	readonly handler: (context: CommandContext) => Promise<void> | void;
}

export interface CommandContext {
	readonly buffer: TextBuffer;
	readonly position: Position;
	readonly selection: Selection | null;
	readonly mode: EditorMode;
}

// ============================================================================
// Plugin Types
// ============================================================================

export interface PluginManifest {
	readonly name: string;
	readonly version: string;
	readonly description: string;
	readonly main: string;
	readonly runtime: "typescript" | "wasm" | "deno";
	readonly capabilities: PluginCapabilities;
	readonly permissions: PluginPermissions;
	readonly activation: ActivationEvents;
}

export interface PluginCapabilities {
	readonly commands?: boolean;
	readonly keybindings?: boolean;
	readonly languages?: readonly string[];
	readonly ui?: boolean;
}

export interface PluginPermissions {
	readonly filesystem?: {
		readonly read?: readonly string[];
		readonly write?: readonly string[];
	};
	readonly network?: readonly string[];
	readonly ai?: boolean;
	readonly env?: readonly string[];
}

export interface ActivationEvents {
	readonly onStartup?: boolean;
	readonly onLanguage?: readonly string[];
	readonly onCommand?: readonly string[];
	readonly onViewsOpened?: readonly string[];
}

export interface PluginAPI {
	readonly window: WindowAPI;
	readonly workspace: WorkspaceAPI;
	readonly commands: CommandsAPI;
	readonly languages: LanguagesAPI;
	readonly ai: AIAPI;
}

// ============================================================================
// API Surface Types
// ============================================================================

export interface WindowAPI {
	showMessage(message: string): Promise<void>;
	showWarning(message: string): Promise<void>;
	showError(message: string): Promise<void>;
	showInputBox(options: InputBoxOptions): Promise<string | undefined>;
	showQuickPick(items: readonly string[]): Promise<string | undefined>;
}

export interface InputBoxOptions {
	readonly prompt?: string;
	readonly placeholder?: string;
	readonly value?: string;
	readonly password?: boolean;
}

export interface WorkspaceAPI {
	readFile(path: string): Promise<string>;
	writeFile(path: string, content: string): Promise<void>;
	deleteFile(path: string): Promise<void>;
	findFiles(pattern: string): Promise<readonly string[]>;
	getConfiguration(section: string): ConfigurationAccess;
}

export interface ConfigurationAccess {
	get<T = unknown>(key: string): T | undefined;
	update(key: string, value: unknown): Promise<void>;
}

export interface CommandsAPI {
	register(id: string, handler: CommandHandler): Disposable;
	execute(id: string): Promise<unknown>;
}

export type CommandHandler = (context: CommandContext) => Promise<void> | void;

export interface LanguagesAPI {
	registerCompletionProvider(language: string, provider: CompletionProvider): Disposable;
	registerHoverProvider(language: string, provider: HoverProvider): Disposable;
}

export interface CompletionProvider {
	provideCompletions(document: TextBuffer, position: Position): readonly CompletionItem[];
}

export interface CompletionItem {
	readonly label: string;
	readonly insertText: string;
	readonly kind?: "function" | "variable" | "class" | "keyword";
}

export interface HoverProvider {
	provideHover(document: TextBuffer, position: Position): Hover | null;
}

export interface Hover {
	readonly contents: string;
}

export interface AIAPI {
	streamChat(messages: readonly ChatMessage[]): AsyncIterable<string>;
	registerInlineCompletionProvider(
		language: string,
		provider: InlineCompletionProvider
	): Disposable;
}

export interface ChatMessage {
	readonly role: "user" | "assistant" | "system";
	readonly content: string;
}

export interface InlineCompletionProvider {
	provideInlineCompletion(document: TextBuffer, position: Position): Promise<string | null>;
}

// ============================================================================
// Extension Context
// ============================================================================

export interface ExtensionContext {
	readonly globalState: Storage;
	readonly workspaceState: Storage;
	readonly secrets: SecureStorage;
	readonly logger: Logger;
	readonly subscriptions: Disposable[];
	readonly extensionPath: string;
	readonly extensionId: string;
}

export interface Storage {
	get<T = unknown>(key: string): T | undefined;
	update(key: string, value: unknown): Promise<void>;
}

export interface SecureStorage {
	get(key: string): Promise<string | undefined>;
	store(key: string, value: string): Promise<void>;
	delete(key: string): Promise<void>;
}

export interface Logger {
	log(message: string): void;
	warn(message: string): void;
	error(message: string | Error): void;
}

export interface Disposable {
	dispose(): void;
}

// ============================================================================
// Error Types
// ============================================================================

export class CapError extends Error {
	constructor(
		readonly code: string,
		message: string,
		readonly context?: Record<string, unknown>
	) {
		super(message);
		this.name = "CapError";
	}
}

export class ConfigError extends CapError {
	constructor(message: string, context?: Record<string, unknown>) {
		super("CONFIG_ERROR", message, context);
		this.name = "ConfigError";
	}
}

export class PluginError extends CapError {
	constructor(message: string, context?: Record<string, unknown>) {
		super("PLUGIN_ERROR", message, context);
		this.name = "PluginError";
	}
}
