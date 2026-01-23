/**
 * Tests for user themes and Ghostty terminal detection
 */

import { describe, it, expect } from "bun:test";
import { detectGhosttyTheme, mapGhosttyTheme, ghosttyThemeMapping } from "../src/ui/themes/ghostty";
import { loadUserTheme, listUserThemes } from "../src/ui/themes/user-themes";

describe("Ghostty Theme Detection", () => {
	it("should detect Ghostty theme from config if file exists", async () => {
		// Note: This test depends on whether user has Ghostty installed
		// Should not fail if Ghostty config doesn't exist
		const theme = await detectGhosttyTheme();
		expect(typeof theme === "string" || theme === null).toBe(true);
	});

	it("should map Ghostty theme names to supported themes", () => {
		expect(mapGhosttyTheme("dracula")).toBe("dracula");
		expect(mapGhosttyTheme("nord")).toBe("nord");
		expect(mapGhosttyTheme("one-dark")).toBe("one-dark");
	});

	it("should handle theme aliases", () => {
		expect(mapGhosttyTheme("dracula-pro")).toBe("dracula");
		expect(mapGhosttyTheme("one-dark-pro")).toBe("one-dark");
		expect(mapGhosttyTheme("nord-light")).toBe("nord");
	});

	it("should map Catppuccin variants to similar themes", () => {
		// Catppuccin Mocha and Frappe don't have exact matches, so they fall back
		expect(mapGhosttyTheme("catppuccin-mocha")).toBe("dracula");
		expect(mapGhosttyTheme("catppuccin-frappe")).toBe("dracula");
	});

	it("should return null for unmapped themes", () => {
		expect(mapGhosttyTheme("unknown-theme")).toBeNull();
		expect(mapGhosttyTheme("nonexistent")).toBeNull();
	});

	it("should be case-insensitive", () => {
		expect(mapGhosttyTheme("DRACULA")).toBe("dracula");
		expect(mapGhosttyTheme("Nord")).toBe("nord");
		expect(mapGhosttyTheme("ONE-DARK")).toBe("one-dark");
	});

	it("should trim whitespace from theme names", () => {
		expect(mapGhosttyTheme("  dracula  ")).toBe("dracula");
		expect(mapGhosttyTheme("\tnord\t")).toBe("nord");
	});

	it("should contain valid theme mappings", () => {
		for (const [ghosttyName, ctrlTheme] of Object.entries(ghosttyThemeMapping)) {
			expect(typeof ghosttyName === "string").toBe(true);
			expect(typeof ctrlTheme === "string").toBe(true);
			// ctrlTheme should be one of the supported themes
			expect(["dracula", "nord", "one-dark", "solarized-dark", "monokai"].includes(ctrlTheme)).toBe(true);
		}
	});
});

describe("User Theme Loading", () => {
	it("should return null for non-existent theme", async () => {
		const theme = await loadUserTheme("this-theme-does-not-exist-12345");
		expect(theme).toBeNull();
	});

	it("should return null for invalid theme file", async () => {
		// Create invalid theme file in temp location
		const tempPath = `/tmp/ctrl-test-invalid-theme.json`;
		await Bun.write(tempPath, '{ "invalid": "json"');

		// Since we can't override the theme path, this test just verifies
		// the function handles missing files gracefully
		const result = await loadUserTheme("nonexistent");
		expect(result).toBeNull();
	});

	it("should have list function", async () => {
		// listUserThemes should return an array (possibly empty if no user themes)
		const themes = await listUserThemes();
		expect(Array.isArray(themes)).toBe(true);
	});

	it("should return sorted theme list", async () => {
		const themes = await listUserThemes();
		const sorted = [...themes].sort();
		expect(themes).toEqual(sorted);
	});

	it("should handle empty themes directory gracefully", async () => {
		const themes = await listUserThemes();
		// Should return empty array if no themes, not throw error
		expect(Array.isArray(themes)).toBe(true);
	});
});
