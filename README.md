# Ctrl

**Hyperextensible AI-native terminal editor.** Edit code with AI as infrastructure, not a feature.

---

## Why Ctrl?

**The core insight:** The killer feature isn't the AI—it's the escape hatch.

Terminal developers face a false choice:

- **Option A (Cursor, Zed):** AI that feels native, but you're trapped in a GUI
- **Option B (Neovim + plugins):** Terminal that feels native, but AI is clearly an afterthought
- **Option C (Ctrl):** Terminal-native AND AI-native, with the ability to completely disable AI when you don't want it

### The Problem with Ambient AI

Cursor and Zed treat AI as always-on. This creates hidden taxes:

- **Ghost text you didn't ask for** disrupts flow state
- **Context shipping on every keystroke** adds latency (even invisibly)
- **Constant micro-decisions** ("should I use this suggestion?") create cognitive load

Even if you ignore the suggestions, your brain knows they're there. Ctrl respects flow state: when you're editing, you're just editing. No ambient AI.

### Modal AI: The Vim Philosophy Extended

Ctrl extends Vim's core philosophy to AI:

- **Normal mode.** Insert mode. Visual mode. **AI mode.**
- **On when you want it.** Completely gone when you don't.

```
Standard editor:  Suggestions everywhere, all the time
                 ↓
Ctrl:            Only when you explicitly invoke it
                 One keystroke to toggle on/off
```

When you invoke AI in Ctrl, you get full-power capabilities: agentic editing, deep context, multi-turn conversations. But until you ask, AI is completely absent.

**This is the entire point.** Not a limitation—a feature.

### What This Means in Practice

You get:

- **Terminal-native:** Fast, minimal, keyboard-driven. No Electron bloat. Works over SSH, in containers, on slow connections.
- **AI-first architecture:** AI as infrastructure, not bolted-on. Multi-provider support (Claude, GPT-4, local models).
- **Modal AI:** AI is optional at the keystroke level. Your control, your choice.
- **Plugin ecosystem:** TypeScript plugins, npm distribution, zero configuration friction.
- **Modal editing:** Vim-like workflows that feel native.
- **Elegant configuration:** TOML over Lua or JSON. Readable, versionable, AI-friendly.

### How Ctrl Compares

| Aspect | Cursor | Zed | Neovim+AI | Ctrl |
|--------|--------|-----|-----------|------|
| Terminal-Native | ❌ | ❌ | ✅ | ✅ |
| AI-Native | ✅ | 🔄 | ❌ | ✅ |
| **AI Optional** | ⚠️ (present, not absent) | ⚠️ (present, not absent) | ✅ | ✅ |
| Modal Editing | ❌ | ❌ | ✅ | ✅ |
| Flow State Friendly | ❌ (ambient suggestions) | ❌ (ambient suggestions) | ✅ | ✅ |

**Ctrl's unique position:** The only editor combining terminal-native + AI-native + completely optional AI at the keystroke level.

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/ctrleditor/ctrl
cd ctrl
bun install

# Run the editor (development)
bun run src/main.tsx

# Exit editor
Press: q, Ctrl+C, or Ctrl+D

# Run tests
bun test

# Format and lint
bun run format
bun run lint
```

**Note:** NPM package coming soon. Currently dev-only.

## Features

**Currently Working:**
- **Modal editing** (normal, insert, visual, command modes)
- **Buffer editing** (insert text, delete, vim-style hjkl navigation)
- **Configuration system** (TOML-based UI colors, keybindings)
- **Command palette** (`:` in normal mode)
- **Help menu** (Ctrl+P shows all keybindings)
- **Cursor navigation** (hjkl in normal mode, Ctrl+hjkl in insert mode)

**Coming Soon:**
- **AI chat** with context awareness
- **Inline completions** (ghost text)
- **Selection-based AI actions** (explain, refactor, fix, test, document)
- **TypeScript LSP** with hover, completions, diagnostics
- **Syntax highlighting** (tree-sitter powered)
- **Plugin system** (TypeScript, extensible)
- **Config hot-reload** (file watching)
- **Performance targets** (< 100ms startup, < 16ms keystroke latency)

---

## Documentation

### Core Docs
- **[Requirements](docs/requirements.md)** - Features, goals, and success metrics
- **[Roadmap](docs/roadmap.md)** - Phase-by-phase plan and business model

### For Users
- **[AI Features Guide](docs/ai-features.md)** - Chat, completions, AI actions
- **[Configuration](docs/requirements.md#configuration)** - Keybindings, settings, plugins

### For Developers
- **[Development Guide](docs/development-guide.md)** - Setup, workflow, OpenTUI patterns
- **[Plugin Development](docs/plugin-development.md)** - Build and publish plugins
- **[Architecture](docs/architecture.md)** - System design and technical approach
- **[Testing](docs/testing.md)** - Testing strategy and guidelines
- **[Decisions](docs/decisions.md)** - Key architectural decisions

### For Contributors & Stakeholders
- **[Strategy](docs/strategy.md)** - Business model, competitive analysis, financials
- **[Constraints](docs/constraints.md)** - Hard limitations and performance targets
- **[Build & Deploy](docs/deployment.md)** - Release process

### For Architects
- **[AI Integration Architecture](docs/ai-integration-architecture.md)** - Phase 2 AI design
- **[Plugin System Architecture](docs/plugin-system-architecture.md)** - Plugin design
- **[Ctrl-Specific Constraints](docs/ctrl-specific-constraints.md)** - OpenTUI/OpenCode patterns

### For AI Tools
- **[CLAUDE.md](CLAUDE.md)** - AI assistant guide (symlinked to `docs/llm.md`)

---

## Roadmap

**Phase 1 (v0.1 - Week 2):** Core editor, modal editing, AI chat, basic plugins
**Phase 2 (v0.5 - Month 3):** Selection-based AI, multiple buffers, more languages
**Phase 3 (v1.0 - Month 6):** Plugin marketplace, team features, enterprise support
**Phase 4 (v2.0 - Month 12+):** Collaboration, advanced AI workflows, mobile companion

See [Full Roadmap](docs/roadmap.md) for detailed timeline, business model, and success metrics.

---

## Installation

### From Source (Current)
```bash
git clone https://github.com/ctrleditor/ctrl
cd ctrl
bun install
bun run src/main.tsx
```

### From npm (Coming Soon)
```bash
npm install -g ctrl
ctrl
```

### Requirements
- **Bun** 1.0+ (faster than Node.js, required for this project)
- **Terminal** with 256+ colors (TERM=xterm-256color or better)
- **OS:** Linux, macOS, or Windows (WSL2) - tested with zsh, bash
- **Disk:** ~50MB (node_modules)

---

## Configuration

Ctrl uses TOML for configuration (XDG Base Directory spec):

```bash
~/.config/ctrl/config.toml
```

Currently, config is loaded on startup. **Note:** Hot-reload on file changes is not yet working.

### Example Configuration

```toml
[ui.colors]
normalMode = "#88BB22"       # Green for normal mode
insertMode = "#22AAFF"       # Blue for insert mode
visualMode = "#FF9922"       # Orange for visual mode
commandMode = "#FFFF00"      # Yellow for command mode
statusBarBg = "#1a1a1a"      # Dark background
textFg = "#FFFFFF"           # White text

[keybinds.normal]
# Navigation (vim-style, already defaults)
h = "move_left"
j = "move_down"
k = "move_up"
l = "move_right"

# Mode changes
i = "enter_insert"
v = "enter_visual"
":" = "enter_command"

[keybinds.insert]
# Insert mode uses Ctrl+hjkl for navigation
# Esc returns to normal mode (built-in)
```

### Default Keybindings (Vim Style)

All keybindings are customizable via config. Defaults:

**Normal Mode:**
- `h/j/k/l` - Move cursor left/down/up/right
- `i` - Enter insert mode
- `v` - Enter visual mode
- `:` - Enter command mode
- `Ctrl+P` - Show keybinding help
- `q/Ctrl+C/Ctrl+D` - Exit editor

**Insert Mode:**
- `Esc` - Return to normal mode
- `Ctrl+h/j/k/l` - Move cursor
- Any character - Insert text
- `Backspace` - Delete character before cursor
- `Enter` - Insert newline

See [Configuration Guide](docs/requirements.md) for complete option list.

---

## Using AI (Coming Soon)

AI features are coming in the next phase. Planned:

- **Inline Completions** - Ghost text suggestions as you type
- **AI Chat** - Ask Claude about your code
- **Selection Actions** - Explain, refactor, fix, test, or document selected code
- **MCP Integration** - Use Claude's Model Context Protocol tools
- **Multiple Providers** - Claude, GPT-4, local models

See [Roadmap](docs/roadmap.md) for timeline and [AI Features Guide](docs/ai-features.md) for planned functionality.

---

## Plugins

Ctrl is built on a plugin-first architecture. Everything except the core editor is extensible:

```bash
# Install plugin
ctrl plugin install biome-format

# List plugins
ctrl plugin list

# Develop a plugin
npx @aiide/create-plugin my-plugin
ctrl --dev-plugin ./my-plugin

# Publish
ctrl plugin login
ctrl plugin publish
```

See [Plugin Development Guide](docs/plugin-development.md) for API reference and examples.

---

## Keyboard Shortcuts (Default - Vim Style)

**Normal Mode:**
| Shortcut | Action |
|----------|--------|
| `h` | Move cursor left |
| `j` | Move cursor down |
| `k` | Move cursor up |
| `l` | Move cursor right |
| `i` | Enter insert mode |
| `v` | Enter visual mode (experimental) |
| `:` | Enter command mode |
| `Ctrl+P` | Show help menu (all keybindings) |
| `q` / `Ctrl+C` / `Ctrl+D` | Exit editor |

**Insert Mode:**
| Shortcut | Action |
|----------|--------|
| `Esc` | Return to normal mode |
| `Ctrl+H` | Move cursor left |
| `Ctrl+J` | Move cursor down |
| `Ctrl+K` | Move cursor up |
| `Ctrl+L` | Move cursor right |

**Coming Soon:**
| Shortcut | Action |
|----------|--------|
| `<leader>ac` | Toggle AI chat |
| `<leader>a` | AI actions menu |
| `<leader>ff` | Find files (fuzzy) |

See [Configuration](docs/requirements.md) to customize keybindings or create `~/.config/ctrl/config.toml`.

---

## Performance

Ctrl is built for speed:

| Metric | Target | Progress |
|--------|--------|----------|
| Startup time | < 100ms | 🔨 |
| Keystroke latency | < 16ms | 🔨 |
| Idle memory | < 100MB | 🔨 |
| AI first token | < 2s | 🔨 |
| Large files (100MB+) | Smooth | 🔨 |

See [Constraints](docs/constraints.md) for performance requirements and strategy.

---

## Resources

### Learn More
- **[OpenTUI](https://github.com/anomalyco/opentui)** (7.8k⭐) - Terminal UI framework Ctrl uses
- **[OpenCode](https://github.com/anomalyco/opencode)** (83.8k⭐) - Reference implementation for TUI patterns
- **[CtrlSpec](https://github.com/ctrleditor/ctrlspec)** - Documentation templates

### Clone for Local Reference
```bash
# Clone OpenTUI to explore rendering patterns
git clone https://github.com/anomalyco/opentui /tmp/opentui

# Clone OpenCode to study performance and architecture
git clone https://github.com/anomalyco/opencode /tmp/opencode
```

### Documentation Index
See [docs/](docs/) directory for complete documentation:
- `requirements.md` - Features and business goals
- `architecture.md` - System design
- `constraints.md` - Performance targets and hard limits
- `ctrl-specific-constraints.md` - Patterns from OpenCode and OpenTUI
- `decisions.md` - Key architectural decisions
- `roadmap.md` - Timeline, business model, success metrics
- `development-guide.md` - Setup, workflow, code patterns
- `testing.md` - Testing strategy
- `plugin-system-architecture.md` - Plugin design
- `ai-integration-architecture.md` - AI interaction patterns

---

## Contributing

We'd love your help!

**Before contributing, read:**
- **[CLAUDE.md](CLAUDE.md)** - AI assistant guide + commit requirements
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and technical approach
- **[docs/development-guide.md](docs/development-guide.md)** - Setup and patterns

**Commit Requirements:**
- **MUST use [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)**
- All commits follow strict format: `<type>: <description>`
- Examples: `feat: add hjkl navigation`, `fix: cursor boundary bug`, `docs: update README`
- This is non-negotiable and enforced for all PRs

**Development:**
- `bun install` - Install dependencies
- `bun run src/main.tsx` - Run editor
- `bun run format` - Format code
- `bun run lint` - Check code style
- `bun run test` - Run tests

See [CLAUDE.md](CLAUDE.md) for full development guidelines.

---

## Community

- **Discord:** [ctrl community](https://discord.gg/ctrl) (coming Month 2)
- **GitHub Discussions:** [ctrleditor/ctrl](https://github.com/ctrleditor/ctrl/discussions)
- **GitHub Issues:** [Report bugs](https://github.com/ctrleditor/ctrl/issues)
- **Twitter/X:** [@ctrleditor](https://twitter.com/ctrleditor)

---

## License

Apache 2.0 - See [LICENSE](LICENSE) file for details

---

## Status

**Current Phase:** Prototype (v0.1) - Core Editor MVP
**Timeline:** Jan 22 - Feb 5, 2026 (core editor done, starting AI features)
**Project:** Rebranded to Ctrl (github.com/ctrleditor)
**Status:** ✅ Core editor working | 🔨 AI features next

**Completed (✅):**
- ✅ Modal editing system (normal, insert, visual, command modes)
- ✅ Buffer text editing (insert, delete, backspace, enter)
- ✅ Vim-style hjkl navigation
- ✅ Config file loading from `~/.config/ctrl/config.toml` (XDG compliant)
- ✅ Config-driven UI colors (status bar, mode indicators)
- ✅ Command palette (`:` in normal mode)
- ✅ Help menu (Ctrl+P shows all keybindings)
- ✅ Clean exit (q, Ctrl+C, Ctrl+D)
- ✅ React + OpenTUI rendering
- ✅ Cursor display with inverse video
- ✅ TOML schema validation (Zod)

**Known Limitations (⚠️):**
- Config hot-reload not yet working (file watching implemented but needs debugging)
- Visual mode exists as mode but selection not fully implemented
- Command mode shows palette but commands not yet executed
- No AI features yet

**Next (🔨):**
- AI chat and completions
- Selection-based AI actions
- LSP integration for TypeScript
- Syntax highlighting
- Plugin system

See [Roadmap](docs/roadmap.md) for full timeline and milestones.
