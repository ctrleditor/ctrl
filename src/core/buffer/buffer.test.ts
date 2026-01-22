/**
 * Buffer tests
 * Testing pure functional code is simple: input → output
 */

import { describe, expect, it } from "bun:test";
import {
	createBuffer,
	deleteRange,
	getLine,
	getLineCount,
	insertText,
	isValidPosition,
	markSaved,
} from "./buffer";

describe("Buffer - Functional Implementation", () => {
	describe("createBuffer", () => {
		it("should create a new buffer with correct initial state", () => {
			const buffer = createBuffer("id-1", "test.ts", "hello", "typescript");

			expect(buffer.id).toBe("id-1");
			expect(buffer.filePath).toBe("test.ts");
			expect(buffer.content).toBe("hello");
			expect(buffer.isDirty).toBe(false);
			expect(buffer.language).toBe("typescript");
		});

		it("should not mutate when creating - immutability", () => {
			const content = "initial";
			const buffer1 = createBuffer("b1", "file1.ts", content, "typescript");
			const buffer2 = createBuffer("b2", "file2.ts", content, "typescript");

			expect(buffer1).not.toBe(buffer2);
			expect(buffer1.id).not.toBe(buffer2.id);
		});
	});

	describe("insertText", () => {
		it("should insert text at position", () => {
			const buffer = createBuffer("id", "file.ts", "hello world", "typescript");
			const newBuffer = insertText(buffer, { line: 0, column: 6 }, "beautiful ");

			expect(newBuffer.content).toBe("hello beautiful world");
			// Original buffer unchanged
			expect(buffer.content).toBe("hello world");
		});

		it("should mark buffer as dirty", () => {
			const buffer = createBuffer("id", "file.ts", "hello", "typescript");
			const newBuffer = insertText(buffer, { line: 0, column: 0 }, "x");

			expect(buffer.isDirty).toBe(false);
			expect(newBuffer.isDirty).toBe(true);
		});

		it("should handle insert at beginning", () => {
			const buffer = createBuffer("id", "file.ts", "world", "typescript");
			const newBuffer = insertText(buffer, { line: 0, column: 0 }, "hello ");

			expect(newBuffer.content).toBe("hello world");
		});

		it("should handle insert at end", () => {
			const buffer = createBuffer("id", "file.ts", "hello", "typescript");
			const newBuffer = insertText(buffer, { line: 0, column: 5 }, " world");

			expect(newBuffer.content).toBe("hello world");
		});
	});

	describe("deleteRange", () => {
		it("should delete text in range", () => {
			const buffer = createBuffer("id", "file.ts", "hello world", "typescript");
			const newBuffer = deleteRange(buffer, {
				start: { line: 0, column: 6 },
				end: { line: 0, column: 11 },
			});

			expect(newBuffer.content).toBe("hello ");
			expect(buffer.content).toBe("hello world");
		});

		it("should mark as dirty", () => {
			const buffer = createBuffer("id", "file.ts", "test", "typescript");
			const newBuffer = deleteRange(buffer, {
				start: { line: 0, column: 0 },
				end: { line: 0, column: 2 },
			});

			expect(newBuffer.isDirty).toBe(true);
		});
	});

	describe("getLine", () => {
		it("should get line by number", () => {
			const buffer = createBuffer("id", "file.ts", "line1\nline2\nline3", "typescript");

			expect(getLine(buffer, 0)).toBe("line1");
			expect(getLine(buffer, 1)).toBe("line2");
			expect(getLine(buffer, 2)).toBe("line3");
		});

		it("should return empty string for invalid line", () => {
			const buffer = createBuffer("id", "file.ts", "hello", "typescript");

			expect(getLine(buffer, 10)).toBe("");
		});
	});

	describe("getLineCount", () => {
		it("should count lines correctly", () => {
			const buffer1 = createBuffer("id", "file.ts", "single", "typescript");
			expect(getLineCount(buffer1)).toBe(1);

			const buffer2 = createBuffer("id", "file.ts", "line1\nline2", "typescript");
			expect(getLineCount(buffer2)).toBe(2);

			const buffer3 = createBuffer("id", "file.ts", "a\nb\nc\n", "typescript");
			expect(getLineCount(buffer3)).toBe(4);
		});
	});

	describe("isValidPosition", () => {
		it("should validate position", () => {
			const buffer = createBuffer("id", "file.ts", "hello\nworld", "typescript");

			expect(isValidPosition(buffer, { line: 0, column: 0 })).toBe(true);
			expect(isValidPosition(buffer, { line: 0, column: 5 })).toBe(true);
			expect(isValidPosition(buffer, { line: 1, column: 5 })).toBe(true);

			expect(isValidPosition(buffer, { line: -1, column: 0 })).toBe(false);
			expect(isValidPosition(buffer, { line: 10, column: 0 })).toBe(false);
		});
	});

	describe("markSaved", () => {
		it("should mark buffer as not dirty", () => {
			const buffer = createBuffer("id", "file.ts", "content", "typescript");
			const dirtyBuffer = insertText(buffer, { line: 0, column: 0 }, "x");

			expect(dirtyBuffer.isDirty).toBe(true);

			const savedBuffer = markSaved(dirtyBuffer);
			expect(savedBuffer.isDirty).toBe(false);
			expect(dirtyBuffer.isDirty).toBe(true); // original unchanged
		});
	});

	describe("Immutability", () => {
		it("should never mutate original buffer", () => {
			const original = createBuffer("id", "file.ts", "test", "typescript");
			const operations = [
				insertText(original, { line: 0, column: 0 }, "a"),
				insertText(original, { line: 0, column: 4 }, "b"),
				deleteRange(original, {
					start: { line: 0, column: 0 },
					end: { line: 0, column: 2 },
				}),
			];

			// Original is unchanged after all operations
			expect(original.content).toBe("test");
			expect(original.isDirty).toBe(false);

			// Each operation produces different result
			expect(operations[0]?.content).toBe("atest");
			expect(operations[1]?.content).toBe("testb");
			expect(operations[2]?.content).toBe("st");
		});
	});
});
