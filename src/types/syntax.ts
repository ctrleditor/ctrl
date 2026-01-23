/**
 * Syntax highlighting types for tree-sitter integration
 * Supports multiple token types for semantic highlighting
 */

export type TokenType =
	| "keyword"
	| "string"
	| "number"
	| "comment"
	| "type"
	| "function"
	| "variable"
	| "operator"
	| "punctuation"
	| "constant"
	| "property";

export interface SyntaxToken {
	readonly startLine: number;
	readonly startColumn: number;
	readonly endLine: number;
	readonly endColumn: number;
	readonly tokenType: TokenType;
}

export interface SyntaxHighlighting {
	readonly tokens: readonly SyntaxToken[];
	readonly lastParsed: number; // timestamp for cache invalidation
}
