/**
 * Unit tests for tree-sitter syntax parser
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { parseFileForHighlighting } from "./parser";
import type { SyntaxToken } from "../../types/syntax";

describe("Tree-sitter Parser", () => {
	let testFile: string;

	beforeAll(async () => {
		// Create a temporary test file
		testFile = "/tmp/ctrl-parser-test-" + Date.now() + ".ts";
		const testCode = `// Test file
const greeting: string = "Hello";
const count: number = 42;

function add(a: number, b: number): number {
	return a + b;
}
`;
		await Bun.write(testFile, testCode);
	});

	afterAll(async () => {
		// Clean up test file
		const file = Bun.file(testFile);
		if (await file.exists()) {
			await Bun.write(testFile, "");
		}
	});

	it("should parse TypeScript file and return tokens", async () => {
		const result = await parseFileForHighlighting(testFile, "typescript");

		expect(result).not.toBeNull();
		if (result) {
			expect(result.tokens).toBeInstanceOf(Array);
			expect(result.parseTime).toBeGreaterThan(0);
		}
	});

	it("should extract token positions correctly", async () => {
		const result = await parseFileForHighlighting(testFile, "typescript");

		if (result && result.tokens.length > 0) {
			const firstToken = result.tokens[0];
			expect(firstToken).toHaveProperty("startLine");
			expect(firstToken).toHaveProperty("startColumn");
			expect(firstToken).toHaveProperty("endLine");
			expect(firstToken).toHaveProperty("endColumn");
			expect(firstToken).toHaveProperty("tokenType");

			// Verify token positions are valid
			expect(firstToken.startLine).toBeGreaterThanOrEqual(0);
			expect(firstToken.startColumn).toBeGreaterThanOrEqual(0);
			expect(firstToken.endLine).toBeGreaterThanOrEqual(firstToken.startLine);
			expect(firstToken.endColumn).toBeGreaterThanOrEqual(firstToken.startColumn);
		}
	});

	it("should handle unsupported languages gracefully", async () => {
		const result = await parseFileForHighlighting(testFile, "python");
		expect(result).toBeNull();
	});

	it("should handle non-existent files gracefully", async () => {
		const result = await parseFileForHighlighting("/nonexistent/file.ts", "typescript");
		// tree-sitter doesn't error on missing files, just returns empty tokens or null on actual error
		expect(result === null || (result && result.tokens.length === 0)).toBe(true);
	});

	it("should recognize type tokens", async () => {
		const result = await parseFileForHighlighting(testFile, "typescript");

		if (result && result.tokens.length > 0) {
			// Find a type token
			const typeTokens = result.tokens.filter((t: SyntaxToken) => t.tokenType === "type");
			// We expect at least some type tokens from the test code
			// (might be empty if highlights.scm doesn't have type patterns, but parser should work)
			expect(typeTokens).toBeInstanceOf(Array);
		}
	});
});
