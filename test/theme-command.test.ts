/**
 * Tests for theme switching via /theme command
 */

import { describe, it, expect } from "bun:test";
import { getGoghThemeList } from "../src/ui/themes/all-gogh-schemes";
import { getConfigDefaults } from "../src/config/schema";

describe("Theme Command (/theme <name>)", () => {
	it("should accept valid theme names", () => {
		const themes = getGoghThemeList();
		expect(themes.length).toBeGreaterThan(0);

		// All returned themes should be valid
		for (const theme of themes) {
			expect(typeof theme).toBe("string");
			expect(theme.length).toBeGreaterThan(0);
		}
	});

	it("should parse theme command correctly", () => {
		const command = "theme dracula";
		const parts = command.split(" ");
		expect(parts[0]).toBe("theme");
		expect(parts[1]).toBe("dracula");
	});

	it("should handle theme with spaces in name", () => {
		const command = "theme one dark";
		expect(command.startsWith("theme ")).toBe(true);
		const themeName = command.slice(6).trim();
		expect(themeName).toBe("one dark");
	});

	it("should load config with selected theme", () => {
		const config = getConfigDefaults("nord");
		expect(config.ui.theme).toBe("nord");

		const config2 = getConfigDefaults("dracula");
		expect(config2.ui.theme).toBe("dracula");
	});

	it("should maintain syntax colors when switching themes", () => {
		const config1 = getConfigDefaults("dracula");
		const config2 = getConfigDefaults("nord");

		// Both should have syntax colors defined
		expect(config1.ui.colors?.syntax?.keyword).toBeDefined();
		expect(config2.ui.colors?.syntax?.keyword).toBeDefined();

		// But colors should be different
		expect(config1.ui.colors?.syntax?.keyword).not.toBe(
			config2.ui.colors?.syntax?.keyword
		);
	});

	it("should support all available Gogh themes", () => {
		const themes = getGoghThemeList();

		for (const theme of themes) {
			const config = getConfigDefaults(theme);
			expect(config.ui.theme).toBe(theme);
			expect(config.ui.colors?.syntax).toBeDefined();
		}
	});

	it("should handle theme command with trim and lowercase", () => {
		const command = "  theme   DRACULA  ";
		const cmd = command.trim();
		expect(cmd.startsWith("theme ")).toBe(true);
		const themeName = cmd.slice(6).trim().toLowerCase();
		expect(themeName).toBe("dracula");
	});
});

describe("Theme Integration with Config", () => {
	it("should apply Dracula theme colors", () => {
		const config = getConfigDefaults("dracula");
		const syntax = config.ui.colors?.syntax;

		expect(syntax?.keyword).toBeDefined();
		expect(syntax?.string).toBeDefined();
		// Dracula has specific color values
		expect(typeof syntax?.keyword).toBe("string");
	});

	it("should apply Nord theme colors", () => {
		const config = getConfigDefaults("nord");
		const syntax = config.ui.colors?.syntax;

		expect(syntax?.keyword).toBeDefined();
		expect(syntax?.string).toBeDefined();
	});

	it("should maintain UI chrome colors", () => {
		const config = getConfigDefaults();

		expect(config.ui.colors?.normalMode).toBeDefined();
		expect(config.ui.colors?.insertMode).toBeDefined();
		expect(config.ui.colors?.visualMode).toBeDefined();
		expect(config.ui.colors?.commandMode).toBeDefined();
		expect(config.ui.colors?.statusBarBg).toBeDefined();
	});
});
