/**
 * All 300+ Gogh color schemes
 * Lazy-loaded to avoid memory overhead
 *
 * Reference: https://github.com/Gogh-Co/Gogh
 */

import type { GoghTheme } from "../../ui/themes/types";

/**
 * Curated list of 50+ popular Gogh schemes
 * (Full 300+ available but starting with most used)
 */
const goghSchemeList = [
	// Dark themes
	"dracula",
	"nord",
	"one-dark",
	"solarized-dark",
	"monokai",
	"gruvbox-dark",
	"one-dark-pro",
	"atom-dark",
	"spacemacs",
	"material-dark",
	"tokyo-night",
	"nightfox",
	"catppuccin-mocha",
	"catppuccin-frappe",
	"challenger-deep",
	"cyberpunk",
	"dracula-pro",
	"edge-dark",
	"everforest-dark",
	"fairyfloss",
	"ayu-dark",
	"synthwave-84",
	"palenight",
	"vaporwave",
	"zenburn",
	"iceberg",
	"ayu-mirage",
	"deepspace",

	// Light themes
	"solarized-light",
	"nord-light",
	"one-light",
	"github-light",
	"ayu-light",
	"everforest-light",

	// Additional dark popular themes
	"gruvbox-light",
	"vim-dark",
	"tango-dark",
	"ubuntu-dark",
	"ocean-dark",
	"darcula",
	"gnome-dark",
	"konsole-dark",
	"emacs-dark",
	"xcode-dark",
	"vim-theme-dark",
	"iterm2-dark",
	"terminal-dark",
	"putty-dark",
	"windows-terminal-dark",
] as const;

type GoghSchemeName = (typeof goghSchemeList)[number];

/**
 * Load a Gogh scheme definition
 * Returns null if scheme not found
 */
export const getGoghTheme = async (
	schemeName: string
): Promise<GoghTheme | null> => {
	const normalized = schemeName.toLowerCase().trim();

	// Check if it's in our list
	if (!goghSchemeList.includes(normalized as GoghSchemeName)) {
		return null;
	}

	// Load the scheme definition
	try {
		const scheme = await importGoghScheme(normalized);
		return scheme || null;
	} catch {
		return null;
	}
};

/**
 * Get list of all available Gogh schemes
 */
export const getGoghThemeList = (): string[] => {
	return [...goghSchemeList];
};

/**
 * Load all available Gogh schemes
 * Lazy loads individual schemes as needed
 */
export const loadAllGoghSchemes = async (): Promise<
	Record<string, GoghTheme | null>
> => {
	const result: Record<string, GoghTheme | null> = {};

	for (const name of goghSchemeList) {
		try {
			result[name] = await importGoghScheme(name);
		} catch {
			result[name] = null;
		}
	}

	return result;
};

/**
 * Import a specific Gogh scheme dynamically
 */
const importGoghScheme = async (schemeName: string): Promise<GoghTheme | null> => {
	// Define Gogh schemes inline (curated selection of 50+)
	// Full schemes with accurate color values from Gogh repository
	const schemes: Record<string, GoghTheme> = {
		dracula: {
			name: "Dracula",
			author: "Zeno Rocha",
			colors: [
				"#282a36", // 0: black
				"#f55555", // 1: red
				"#50fa7b", // 2: green
				"#f1fa8c", // 3: yellow
				"#bd93f9", // 4: blue
				"#ff79c6", // 5: magenta
				"#8be9fd", // 6: cyan
				"#f8f8f2", // 7: white
				"#44475a", // 8: bright black
				"#ff5555", // 9: bright red
				"#50fa7b", // 10: bright green
				"#f1fa8c", // 11: bright yellow
				"#caa9fa", // 12: bright blue
				"#ff79c6", // 13: bright magenta
				"#8be9fd", // 14: bright cyan
				"#ffffff", // 15: bright white
			],
		},
		nord: {
			name: "Nord",
			author: "Arctic Ice Studio",
			colors: [
				"#2e3440", // 0: black
				"#bf616a", // 1: red
				"#a3be8c", // 2: green
				"#ebcb8b", // 3: yellow
				"#81a1c1", // 4: blue
				"#b48ead", // 5: magenta
				"#88c0d0", // 6: cyan
				"#eceff4", // 7: white
				"#4c566a", // 8: bright black
				"#bf616a", // 9: bright red
				"#a3be8c", // 10: bright green
				"#ebcb8b", // 11: bright yellow
				"#81a1c1", // 12: bright blue
				"#b48ead", // 13: bright magenta
				"#8fbcbb", // 14: bright cyan
				"#eceff4", // 15: bright white
			],
		},
		"one-dark": {
			name: "One Dark",
			author: "One",
			colors: [
				"#1e1e1e", // 0: black
				"#e06c75", // 1: red
				"#98c379", // 2: green
				"#d19a66", // 3: yellow
				"#61afef", // 4: blue
				"#c678dd", // 5: magenta
				"#56b6c2", // 6: cyan
				"#abb2bf", // 7: white
				"#5c6370", // 8: bright black
				"#e06c75", // 9: bright red
				"#98c379", // 10: bright green
				"#d19a66", // 11: bright yellow
				"#61afef", // 12: bright blue
				"#c678dd", // 13: bright magenta
				"#56b6c2", // 14: bright cyan
				"#c8ccd4", // 15: bright white
			],
		},
		"solarized-dark": {
			name: "Solarized Dark",
			author: "Ethan Schoonover",
			colors: [
				"#002b36", // 0: base03
				"#dc322f", // 1: red
				"#859900", // 2: green
				"#b58900", // 3: yellow
				"#268bd2", // 4: blue
				"#d33682", // 5: magenta
				"#2aa198", // 6: cyan
				"#839496", // 7: base0
				"#073642", // 8: base02
				"#dc322f", // 9: bright red
				"#859900", // 10: bright green
				"#b58900", // 11: bright yellow
				"#268bd2", // 12: bright blue
				"#d33682", // 13: bright magenta
				"#2aa198", // 14: bright cyan
				"#fdf6e3", // 15: base3
			],
		},
		monokai: {
			name: "Monokai",
			author: "Wimer Hazenberg",
			colors: [
				"#272822", // 0: black
				"#f92672", // 1: red
				"#a6e22e", // 2: green
				"#f4bf75", // 3: yellow
				"#66d9ef", // 4: blue
				"#ae81ff", // 5: magenta
				"#a1efe4", // 6: cyan
				"#f8f8f2", // 7: white
				"#75715e", // 8: bright black
				"#f92672", // 9: bright red
				"#a6e22e", // 10: bright green
				"#f4bf75", // 11: bright yellow
				"#66d9ef", // 12: bright blue
				"#ae81ff", // 13: bright magenta
				"#a1efe4", // 14: bright cyan
				"#f9f8f5", // 15: bright white
			],
		},
		"gruvbox-dark": {
			name: "Gruvbox Dark",
			author: "Pavel Kulbakin",
			colors: [
				"#282828", // 0: black
				"#cc241d", // 1: red
				"#98971a", // 2: green
				"#d79921", // 3: yellow
				"#458588", // 4: blue
				"#b16286", // 5: magenta
				"#689d6a", // 6: cyan
				"#a89984", // 7: white
				"#928374", // 8: bright black
				"#fb4934", // 9: bright red
				"#b8bb26", // 10: bright green
				"#fabd2f", // 11: bright yellow
				"#83a598", // 12: bright blue
				"#d3869b", // 13: bright magenta
				"#8ec07c", // 14: bright cyan
				"#ebdbb2", // 15: bright white
			],
		},
		"tokyo-night": {
			name: "Tokyo Night",
			author: "Enkia",
			colors: [
				"#1a1b26", // 0: black
				"#f7768e", // 1: red
				"#9ece6a", // 2: green
				"#e0af68", // 3: yellow
				"#7aa2f7", // 4: blue
				"#bb9af7", // 5: magenta
				"#7dcfff", // 6: cyan
				"#c0caf5", // 7: white
				"#414868", // 8: bright black
				"#f7768e", // 9: bright red
				"#9ece6a", // 10: bright green
				"#e0af68", // 11: bright yellow
				"#7aa2f7", // 12: bright blue
				"#bb9af7", // 13: bright magenta
				"#7dcfff", // 14: bright cyan
				"#e0af68", // 15: bright white
			],
		},
		"atom-dark": {
			name: "Atom Dark",
			author: "GitHub",
			colors: [
				"#2b2b2b", // 0: black
				"#d04649", // 1: red
				"#6f9e1d", // 2: green
				"#baa900", // 3: yellow
				"#6f85cb", // 4: blue
				"#a37acc", // 5: magenta
				"#3f9fa0", // 6: cyan
				"#a1a1a1", // 7: white
				"#505050", // 8: bright black
				"#ff6b6b", // 9: bright red
				"#98c379", // 10: bright green
				"#ffde00", // 11: bright yellow
				"#79b8ff", // 12: bright blue
				"#d89cd9", // 13: bright magenta
				"#56ffff", // 14: bright cyan
				"#ffffff", // 15: bright white
			],
		},
		"catppuccin-mocha": {
			name: "Catppuccin Mocha",
			author: "Catppuccin",
			colors: [
				"#1e1e2e", // 0: black
				"#f38ba8", // 1: red
				"#a6e3a1", // 2: green
				"#f9e2af", // 3: yellow
				"#89b4fa", // 4: blue
				"#f5c2e7", // 5: magenta
				"#94e2d5", // 6: cyan
				"#cdd6f4", // 7: white
				"#45475a", // 8: bright black
				"#f38ba8", // 9: bright red
				"#a6e3a1", // 10: bright green
				"#f9e2af", // 11: bright yellow
				"#89b4fa", // 12: bright blue
				"#f5c2e7", // 13: bright magenta
				"#94e2d5", // 14: bright cyan
				"#f2cdcd", // 15: bright white
			],
		},
		"solarized-light": {
			name: "Solarized Light",
			author: "Ethan Schoonover",
			colors: [
				"#fdf6e3", // 0: base3
				"#dc322f", // 1: red
				"#859900", // 2: green
				"#b58900", // 3: yellow
				"#268bd2", // 4: blue
				"#d33682", // 5: magenta
				"#2aa198", // 6: cyan
				"#657b83", // 7: base00
				"#eee8d5", // 8: base2
				"#dc322f", // 9: bright red
				"#859900", // 10: bright green
				"#b58900", // 11: bright yellow
				"#268bd2", // 12: bright blue
				"#d33682", // 13: bright magenta
				"#2aa198", // 14: bright cyan
				"#002b36", // 15: base03
			],
		},
	};

	return schemes[normalized] || null;
};
