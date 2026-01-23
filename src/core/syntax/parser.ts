/**
 * Tree-sitter integration for syntax highlighting
 * Invokes tree-sitter CLI to extract syntax tokens from source files
 */

import { spawn } from "bun";
import type { SyntaxToken, TokenType } from "../../types/syntax";

export interface ParseResult {
	readonly tokens: readonly SyntaxToken[];
	readonly parseTime: number; // milliseconds
}

/**
 * Parse a file for syntax highlighting using tree-sitter
 * Returns null gracefully if tree-sitter is unavailable or parsing fails
 */
export const parseFileForHighlighting = async (
	filePath: string,
	language: string
): Promise<ParseResult | null> => {
	const highlightsPath = getHighlightsPath(language);
	if (!highlightsPath) return null;

	try {
		const start = performance.now();

		// Expand ~ to home directory
		const expandedPath = highlightsPath.replace("~", process.env.HOME || "");

		// Run tree-sitter query
		const proc = spawn(["tree-sitter", "query", "--captures", expandedPath, filePath], {
			stdout: "pipe",
			stderr: "pipe",
		});

		const output = await new Response(proc.stdout).text();
		const tokens = parseTreeSitterOutput(output);

		const parseTime = performance.now() - start;

		return {
			tokens,
			parseTime,
		};
	} catch (error) {
		// Gracefully degrade - just log and return null
		// Editor will continue working without highlighting
		return null;
	}
};

/**
 * Parse tree-sitter CLI output into token array
 * Expected format: pattern: N, capture: N - capture.name, start: (row, col), end: (row, col), text: `...`
 */
const parseTreeSitterOutput = (output: string): readonly SyntaxToken[] => {
	const lines = output.split("\n").filter((l) => l.trim());
	const tokens: SyntaxToken[] = [];

	for (const line of lines) {
		// Extract capture name: "capture: 12 - keyword.control" or "capture: 5 - function.builtin"
		const captureMatch = line.match(/capture:\s*\d+\s*-\s*([^,]+),/);

		// Extract start position: "start: (row, col)"
		const startMatch = line.match(/start:\s*\((\d+),\s*(\d+)\)/);

		// Extract end position: "end: (row, col)"
		const endMatch = line.match(/end:\s*\((\d+),\s*(\d+)\)/);

		if (!captureMatch || !startMatch || !endMatch) continue;

		const captureName = captureMatch[1].trim();
		const tokenType = mapCaptureToTokenType(captureName);

		tokens.push({
			startLine: Number.parseInt(startMatch[1], 10),
			startColumn: Number.parseInt(startMatch[2], 10),
			endLine: Number.parseInt(endMatch[1], 10),
			endColumn: Number.parseInt(endMatch[2], 10),
			tokenType,
		});
	}

	return tokens;
};

/**
 * Map tree-sitter capture names to our token types
 * Capture names can have dots (e.g., "type.builtin", "function.method")
 * We extract the primary category
 */
const mapCaptureToTokenType = (captureName: string): TokenType => {
	const primary = captureName.split(".")[0];

	switch (primary) {
		case "keyword":
			return "keyword";
		case "string":
			return "string";
		case "number":
			return "number";
		case "comment":
			return "comment";
		case "type":
			return "type";
		case "function":
			return "function";
		case "variable":
			return "variable";
		case "operator":
			return "operator";
		case "punctuation":
			return "punctuation";
		case "constant":
			return "constant";
		case "property":
			return "property";
		default:
			// Unknown capture type - treat as variable
			return "variable";
	}
};

/**
 * Get the highlights.scm path for a given language
 * Returns the path to the tree-sitter highlights query file
 */
const getHighlightsPath = (language: string): string | null => {
	// Map language to highlights.scm path
	const paths: Record<string, string> = {
		typescript: "~/github/tree-sitter-typescript/queries/highlights.scm",
		javascript: "~/github/tree-sitter-typescript/queries/highlights.scm",
		tsx: "~/github/tree-sitter-typescript/queries/highlights.scm",
		jsx: "~/github/tree-sitter-typescript/queries/highlights.scm",
	};

	return paths[language] || null;
};
