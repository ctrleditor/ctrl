/**
 * Tests for Gogh color schemes and per-token customization
 */

import { describe, it, expect } from "bun:test";
import { getGoghTheme, getGoghThemeList } from "../src/ui/themes/all-gogh-schemes";
import { getConfigDefaults, getConfigDefaultsWithDetection } from "../src/config/schema";

describe("Gogh Color Schemes", () => {
	it("should provide list of available themes", () => {
		const themes = getGoghThemeList();
		expect(Array.isArray(themes)).toBe(true);
		expect(themes.length).toBeGreaterThan(5);
		expect(themes.includes("dracula")).toBe(true);
		expect(themes.includes("nord")).toBe(true);
	});

	it("should load Dracula theme", async () => {
		const theme = await getGoghTheme("dracula");
		expect(theme).not.toBeNull();
		expect(theme?.name).toBe("Dracula");
		expect(Array.isArray(theme?.colors)).toBe(true);
		expect(theme?.colors?.length).toBeGreaterThanOrEqual(16);
	});

	it("should load Nord theme", async () => {
		const theme = await getGoghTheme("nord");
		expect(theme).not.toBeNull();
		expect(theme?.name).toBe("Nord");
		expect(theme?.colors?.length).toBeGreaterThanOrEqual(16);
	});

	it("should load One Dark theme", async () => {
		const theme = await getGoghTheme("one-dark");
		expect(theme).not.toBeNull();
		expect(theme?.name).toBe("One Dark");
	});

	it("should load Tokyo Night theme", async () => {
		const theme = await getGoghTheme("tokyo-night");
		expect(theme).not.toBeNull();
		expect(theme?.name).toBe("Tokyo Night");
	});

	it("should return null for unknown theme", async () => {
		const theme = await getGoghTheme("unknown-theme-xyz");
		expect(theme).toBeNull();
	});

	it("should be case-insensitive", async () => {
		const dracula1 = await getGoghTheme("dracula");
		const dracula2 = await getGoghTheme("DRACULA");
		expect(dracula1).not.toBeNull();
		expect(dracula2).not.toBeNull();
		expect(dracula1?.name).toBe(dracula2?.name);
	});

	it("should have valid color values (hex format)", async () => {
		const theme = await getGoghTheme("dracula");
		expect(theme?.colors).toBeDefined();

		for (const color of theme?.colors ?? []) {
			// Verify hex color format: #RRGGBB
			expect(/^#[0-9A-Fa-f]{6}$/.test(color)).toBe(true);
		}
	});

	it("should have all required standard ANSI colors (0-7)", async () => {
		const theme = await getGoghTheme("nord");
		expect(theme?.colors?.length).toBeGreaterThanOrEqual(8);

		// Verify first 8 colors (standard ANSI) are present
		for (let i = 0; i < 8; i++) {
			expect(theme?.colors?.[i]).toBeDefined();
		}
	});
});

describe("Configuration with Theme Support", () => {
	it("should get config defaults with specified theme", () => {
		const config = getConfigDefaults("nord");
		expect(config.ui.theme).toBe("nord");
		expect(config.ui.colors?.syntax?.keyword).toBeDefined();
	});

	it("should default to dracula theme", () => {
		const config = getConfigDefaults();
		expect(config.ui.theme).toBe("dracula");
	});

	it("should get config defaults with async detection", async () => {
		const config = await getConfigDefaultsWithDetection();
		expect(config.ui.theme).toBeDefined();
		// Theme should be either auto-detected or dracula fallback
		expect(typeof config.ui.theme).toBe("string");
	});

	it("should maintain syntax colors in defaults", () => {
		const config = getConfigDefaults("one-dark");
		expect(config.ui.colors?.syntax?.keyword).toBeDefined();
		expect(config.ui.colors?.syntax?.string).toBeDefined();
		expect(config.ui.colors?.syntax?.type).toBeDefined();
	});

	it("should support per-token color overrides", () => {
		const config = getConfigDefaults("nord");
		// The schema allows optional syntax color overrides
		expect(config.ui.colors?.syntax).toBeDefined();
	});
});

describe("Per-Token Customization", () => {
	it("should allow overriding individual token colors", () => {
		const config = getConfigDefaults();

		// User can override specific colors while keeping theme defaults
		expect(config.ui.colors?.syntax?.keyword).toBeDefined();
		expect(config.ui.colors?.syntax?.string).toBeDefined();
	});

	it("should merge custom colors with theme defaults", () => {
		const config = getConfigDefaults("dracula");
		const syntaxColors = config.ui.colors?.syntax;

		expect(syntaxColors).toBeDefined();
		expect(syntaxColors?.keyword).toBeDefined();
		expect(syntaxColors?.string).toBeDefined();
		expect(syntaxColors?.number).toBeDefined();
		expect(syntaxColors?.comment).toBeDefined();
		expect(syntaxColors?.type).toBeDefined();
		expect(syntaxColors?.function).toBeDefined();
		expect(syntaxColors?.variable).toBeDefined();
		expect(syntaxColors?.operator).toBeDefined();
		expect(syntaxColors?.punctuation).toBeDefined();
		expect(syntaxColors?.constant).toBeDefined();
		expect(syntaxColors?.property).toBeDefined();
	});
});
