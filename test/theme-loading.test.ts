/**
 * Tests for Gogh theme loading and color generation
 */

import { describe, it, expect } from "bun:test";
import { loadThemeSyntaxColors, loadThemeUIChromeColors, loadCompleteTheme } from "../src/ui/themes/index";
import { getAvailableThemes, dracula, nord, monokai } from "../src/ui/themes/schemes";
import { getConfigDefaults } from "../src/config/schema";

describe("Gogh Theme System", () => {
	it("should load dracula syntax colors", () => {
		const colors = loadThemeSyntaxColors("dracula");

		expect(colors.keyword).toBeDefined();
		expect(colors.string).toBeDefined();
		expect(colors.type).toBeDefined();
		// Colors should be hex codes
		expect(colors.keyword).toMatch(/^#[0-9a-f]{6}$/i);
	});

	it("should load nord syntax colors", () => {
		const colors = loadThemeSyntaxColors("nord");

		expect(colors.keyword).toBeDefined();
		expect(colors.comment).toBeDefined();
		// Should be different from dracula
		expect(colors.keyword).not.toBe(loadThemeSyntaxColors("dracula").keyword);
	});

	it("should load all available themes", () => {
		const available = getAvailableThemes();

		expect(available).toContain("dracula");
		expect(available).toContain("nord");
		expect(available).toContain("one-dark");
		expect(available).toContain("solarized-dark");
		expect(available).toContain("monokai");
	});

	it("should load UI chrome colors", () => {
		const colors = loadThemeUIChromeColors("dracula");

		expect(colors.normalMode).toBeDefined();
		expect(colors.insertMode).toBeDefined();
		expect(colors.visualMode).toBeDefined();
		expect(colors.statusBarBg).toBeDefined();
		// Colors should be hex codes
		expect(colors.normalMode).toMatch(/^#[0-9a-f]{6}$/i);
	});

	it("should load complete theme with both syntax and UI colors", () => {
		const theme = loadCompleteTheme("nord");

		expect(theme.theme).toBe("nord");
		expect(theme.syntaxColors).toBeDefined();
		expect(theme.uiColors).toBeDefined();
		expect(theme.syntaxColors.keyword).toBeDefined();
		expect(theme.uiColors.normalMode).toBeDefined();
	});

	it("should use dracula as default when theme not found", () => {
		const colors1 = loadThemeSyntaxColors("dracula");
		const colors2 = loadThemeSyntaxColors("nonexistent-theme");

		expect(colors2.keyword).toBe(colors1.keyword);
	});

	it("should have all syntax token types defined", () => {
		const colors = loadThemeSyntaxColors("dracula");

		const expectedTokens = [
			"keyword",
			"string",
			"number",
			"comment",
			"type",
			"function",
			"variable",
			"operator",
			"punctuation",
			"constant",
			"property",
		];

		for (const token of expectedTokens) {
			expect(colors[token as keyof typeof colors]).toBeDefined();
		}
	});

	it("should have valid hex colors in all themes", () => {
		const themes = ["dracula", "nord", "one-dark", "solarized-dark", "monokai"];
		const hexRegex = /^#[0-9a-f]{6}$/i;

		for (const themeName of themes) {
			const colors = loadThemeSyntaxColors(themeName);
			for (const [key, value] of Object.entries(colors)) {
				expect(value, `${themeName}.${key} should be valid hex`).toMatch(hexRegex);
			}
		}
	});

	it("should integrate with config schema", () => {
		const config = getConfigDefaults();

		expect(config.ui.colors).toBeDefined();
		expect(config.ui.colors?.syntax).toBeDefined();
		// Should use dracula theme
		const drakulaSyntax = loadThemeSyntaxColors("dracula");
		expect(config.ui.colors?.syntax?.keyword).toBe(drakulaSyntax.keyword);
	});

	it("should have theme definitions with names and colors", () => {
		expect(dracula.name).toBe("Dracula");
		expect(dracula.colors.length).toBeGreaterThanOrEqual(16);

		expect(nord.name).toBe("Nord");
		expect(nord.colors.length).toBeGreaterThanOrEqual(16);

		expect(monokai.name).toBe("Monokai");
		expect(monokai.colors.length).toBeGreaterThanOrEqual(16);
	});
});
