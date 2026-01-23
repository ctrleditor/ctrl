# Ctrl Theme System

Ctrl uses **Gogh** color schemes for terminal-accurate syntax highlighting and UI theming. This document explains how to use and customize themes.

## Quick Start

### Built-in Themes

Ctrl includes 5 carefully curated themes:

- **dracula** (default) - Dark, vibrant theme
- **nord** - Arctic, professional palette
- **one-dark** - Atom editor inspired
- **solarized-dark** - CIELAB precision colors
- **monokai** - Sublime Text classic

### Switching Themes

Use the `/theme` command in command mode (enter with `/`):

```
/theme nord
/theme dracula
/theme one-dark
```

Type the command and press Enter to switch immediately. Your theme preference persists via Ctrl's config hot-reload system.

### Auto-Detection

If you use **Ghostty** terminal, Ctrl automatically detects your terminal theme on startup. Supported Ghostty themes:

- dracula, dracula-pro
- nord, nord-light
- one-dark, one-dark-pro
- solarized-dark, solarized-light
- monokai, monokai-pro
- catppuccin variants (fallback to dracula)

No configuration needed - just use Ghostty's theme and Ctrl follows.

## Configuration

### Theme Location

Ctrl reads config from: `~/.config/ctrl/config.toml`

### Basic Theme Configuration

```toml
[ui]
theme = "nord"
```

### Per-Token Color Customization

Override specific syntax highlight colors while keeping the rest from the theme:

```toml
[ui.colors.syntax]
# Override keyword color only, keep others from theme
keyword = "#FF6B6B"
# Other colors inherit from "nord" theme
```

Available token types for customization:

- `keyword` - Keywords (const, if, function, etc.)
- `string` - String literals
- `number` - Numbers and boolean literals
- `comment` - Code comments
- `type` - Type names and generics
- `function` - Function/method names
- `variable` - Variable names
- `operator` - Operators (=, +, -, etc.)
- `punctuation` - Brackets, semicolons, dots
- `constant` - Named constants
- `property` - Object properties

### Full Color Configuration Example

```toml
[ui.colors]
normalMode = "#88BB22"     # Normal mode indicator
insertMode = "#22AAFF"     # Insert mode indicator
visualMode = "#FF9922"     # Visual mode indicator
commandMode = "#FFFF00"    # Command mode indicator
statusBarBg = "#1a1a1a"    # Status bar background
textFg = "#FFFFFF"         # Default text color

[ui.colors.syntax]
keyword = "#569CD6"        # Blue
string = "#CE9178"         # Orange
number = "#B5CEA8"         # Green
comment = "#6A9955"        # Green (dimmed)
type = "#4EC9B0"           # Teal
function = "#DCDCAA"       # Yellow
variable = "#9CDCFE"       # Light blue
operator = "#D4D4D4"       # White
punctuation = "#808080"    # Gray
constant = "#4FC1FF"       # Cyan
property = "#9CDCFE"       # Light blue
```

## User-Defined Themes

Create custom themes in `~/.config/ctrl/themes/` as JSON files.

### Theme File Format

Create `~/.config/ctrl/themes/my-theme.json`:

```json
{
  "name": "My Custom Theme",
  "author": "Your Name",
  "colors": [
    "#000000", // 0: black
    "#ff0000", // 1: red
    "#00ff00", // 2: green
    "#ffff00", // 3: yellow
    "#0000ff", // 4: blue
    "#ff00ff", // 5: magenta
    "#00ffff", // 6: cyan
    "#ffffff", // 7: white
    "#808080", // 8: bright black
    "#ff6666", // 9: bright red
    "#66ff66", // 10: bright green
    "#ffff66", // 11: bright yellow
    "#6666ff", // 12: bright blue
    "#ff66ff", // 13: bright magenta
    "#66ffff", // 14: bright cyan
    "#e0e0e0"  // 15: bright white
  ]
}
```

### Using Custom Themes

Once created, use via command or config:

```toml
[ui]
theme = "my-theme"
```

Or via command:

```
/theme my-theme
```

## Available Gogh Schemes

Ctrl supports 50+ Gogh color schemes. Popular ones include:

**Dark themes:**
- dracula, nord, one-dark, solarized-dark, monokai
- gruvbox-dark, tokyo-night, catppuccin-mocha
- atom-dark, challenger-deep, everforest-dark
- ayu-dark, nightfox, synthwave-84

**Light themes:**
- solarized-light, nord-light, one-light
- github-light, ayu-light

Try different themes with `/theme <name>`.

## Theme Priority

Ctrl applies themes in this order:

1. **User override** - Custom colors in `config.toml` take highest priority
2. **User theme** - Custom JSON file in `~/.config/ctrl/themes/`
3. **Gogh scheme** - Built-in or available Gogh theme
4. **Terminal detection** - Ghostty theme auto-detection (if available)
5. **Default** - Dracula theme

## Hex Color Format

All colors must be valid hex codes: `#RRGGBB`

Examples:
- `#000000` - black
- `#FFFFFF` - white
- `#FF5555` - bright red
- `#88BB22` - light green

## Tips & Tricks

### Color Picker

Use an online hex color picker to find colors:
https://www.color-hex.com/

### Testing Colors

Add colors to `config.toml`, save, and they apply immediately via hot-reload.

### Theme Variants

Create multiple theme files for different moods:
- `~/.config/ctrl/themes/work.json` - professional theme
- `~/.config/ctrl/themes/night.json` - low-contrast for late work
- `~/.config/ctrl/themes/colorful.json` - vibrant theme

Switch with `/theme work` or `/theme night`.

## Troubleshooting

### Theme not loading

1. Check file path: `~/.config/ctrl/themes/my-theme.json`
2. Validate JSON: use https://jsonlint.com/
3. Ensure 16+ colors in array
4. Restart Ctrl to reload config

### Colors look wrong

1. Terminal might override colors - check terminal settings
2. Try different theme to verify system works
3. Check hex values are valid format `#RRGGBB`

### Ghostty not detecting

1. Ensure `~/.config/ghostty/config` exists
2. Set `theme = my-theme` in Ghostty config
3. Restart Ctrl

## See Also

- [Gogh themes](https://gogh-co.github.io/Gogh/)
- [Color standards](https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit)
- [Development guide](./development-guide.md)
