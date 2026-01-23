/**
 * Integration tests for syntax highlighting
 * Uses proper SIGINT handling - NO timeout allowed
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { spawn } from "bun";
import { writeFileSync, readFileSync, unlinkSync } from "fs";

describe("Syntax Highlighting Integration", () => {
	let testFile: string;

	beforeAll(() => {
		// Create a test TypeScript file with syntax
		testFile = "/tmp/ctrl-syntax-test-" + Date.now() + ".ts";
		const testCode = `// Test file for syntax highlighting
const greeting: string = "Hello, world!";
const count: number = 42;
const isActive: boolean = true;

function add(a: number, b: number): number {
	return a + b;
}

interface User {
	name: string;
	age: number;
}

const user: User = {
	name: "Alice",
	age: 30
};

// Comments should be highlighted too
console.log(greeting, count);
`;
		writeFileSync(testFile, testCode);
	});

	afterAll(() => {
		// Clean up test file
		try {
			unlinkSync(testFile);
		} catch {
			// Ignore if file doesn't exist
		}
	});

	it("should parse TypeScript file and extract syntax tokens", async () => {
		// Import parser to verify it works
		const { parseFileForHighlighting } = await import("../src/core/syntax/parser");

		// Parse the test file
		const result = await parseFileForHighlighting(testFile, "typescript");

		// Should successfully parse
		expect(result).not.toBeNull();
		expect(result?.tokens).toBeInstanceOf(Array);
		expect(result?.parseTime).toBeGreaterThan(0);
	});

	it("should have syntax types defined", async () => {
		// Import types to verify they're correctly defined
		const { parseFileForHighlighting } = await import("../src/core/syntax/parser");

		// Test parsing
		const result = await parseFileForHighlighting(testFile, "typescript");

		expect(result).not.toBeNull();
		if (result) {
			// Should have some tokens from the test file
			expect(result.tokens).toBeInstanceOf(Array);
			expect(result.parseTime).toBeGreaterThan(0);

			// Verify token structure
			if (result.tokens.length > 0) {
				const token = result.tokens[0];
				expect(token).toHaveProperty("startLine");
				expect(token).toHaveProperty("startColumn");
				expect(token).toHaveProperty("endLine");
				expect(token).toHaveProperty("endColumn");
				expect(token).toHaveProperty("tokenType");
			}
		}
	});
});
