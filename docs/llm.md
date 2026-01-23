# LLM Assistant Guide

> **CRITICAL:** Read `.guardrails.md` FIRST before any work. It contains mandatory rules for TUI testing.

> **Note:** This file may be symlinked as CLAUDE.md, AGENTS.md, .cursorrules, etc.
> for different AI coding tools. Edit `docs/llm.md` directly.

This document explains how to effectively use AI coding assistants with this repository.

## 🚨 MANDATORY GUARDRAILS (Read First!)

**BEFORE DOING ANY TESTING OR BASH COMMANDS:**
- Read `.guardrails.md` - Contains TUI testing rules that MUST be followed
- Ctrl is a Terminal UI app - special rules apply
- Key rule: **NEVER use `timeout` on TUI apps. ONLY use SIGINT via `process.kill(pid, "SIGINT")`**
- Violating this breaks the developer's terminal and requires shell restart

See `.guardrails.md` for complete rules and rationale.

## Documentation Structure

This repo uses documentation-as-context to help AI understand the project. All docs are in `docs/` directory.

> **Note:** Ctrl uses [CtrlSpec](https://github.com/ctrleditor/ctrlspec) for documentation management.
> To sync templates: `curl -fsSL https://ctrleditor.com/spec.sh | sh`

### Core Documentation (Read These First)
- **[requirements.md](requirements.md)** - Business requirements and project goals
- **[architecture.md](architecture.md)** - Technical architecture and system design
- **[constraints.md](constraints.md)** - Hard limitations (performance, compatibility, licensing, etc.)
- **[ctrl-specific-constraints.md](ctrl-specific-constraints.md)** - OpenTUI/OpenCode patterns and pitfalls specific to Ctrl
- **[decisions.md](decisions.md)** - Index of key decisions (full context in git commits)

### Development & Operations
- **[development-guide.md](development-guide.md)** - Setup, workflow, functional programming patterns, project structure
- **[testing.md](testing.md)** - Testing strategy, guidelines, and examples
- **[deployment.md](deployment.md)** - Release process, CI/CD, environments, and rollback procedures

### Product & Architecture Details
- **[strategy.md](strategy.md)** - Business model, go-to-market, competitive analysis, financial projections
- **[ai-integration-architecture.md](ai-integration-architecture.md)** - Phase 2 AI features design (interaction patterns, chat, completions, context management)
- **[plugin-system-architecture.md](plugin-system-architecture.md)** - Comprehensive plugin system design (manifest, API, security, lifecycle)
- **[ai-features.md](ai-features.md)** - User guide for AI features (how to use them)
- **[plugin-development.md](plugin-development.md)** - User guide for plugin development
- **[roadmap.md](roadmap.md)** - Project phases and business timelines

**Start with Core Documentation** before making significant changes. Reference detailed architecture docs for specific subsystems.

## Git Workflow

### Commits - ALWAYS Use Conventional Commits

**REQUIRED:** All commits must follow [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)

This is non-negotiable. No exceptions. Format is strict:
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Valid types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, missing semicolons, etc.)
- `refactor` - Code change that neither fixes bugs nor adds features
- `perf` - Code change that improves performance
- `test` - Adding or updating tests
- `chore` - Changes to build process, dependencies, etc.
- `ci` - Changes to CI/CD configuration

**Examples:**
```
feat: add user authentication
fix: resolve memory leak in cache
docs: update architecture decisions
feat!: breaking API change
refactor: simplify buffer management
test: add unit tests for keystroke handler
```

**For architectural decisions:** Include context in commit message:
```
feat: implement vim-style hjkl navigation

Decision: Use hjkl instead of arrow keys for navigation

Context: Vim users expect hjkl in normal mode. Arrow keys
conflict with other modal editors and are slower to reach.

Consequences: Insert mode uses Ctrl+hjkl to avoid text input
conflicts. This is standard in vim-like editors.
```

**Link:** https://www.conventionalcommits.org/en/v1.0.0/

### Semantic Versioning
Suggest semver bumps based on commits:
- `feat!` or `BREAKING CHANGE` → MAJOR
- `feat` → MINOR
- `fix`, `perf` → PATCH
- `docs`, `style`, `refactor`, `test`, `chore` → no version bump

### Before Committing

**ALWAYS ask before committing.** Do not auto-commit without explicit approval.

**Process:**
1. Make changes to code or docs
2. Show the user what changed (`git diff`, test output, etc.)
3. Ask: "Ready to commit?" or "Should I commit this?"
4. Wait for confirmation
5. Only then run `git commit`

**Exception:** Only skip the ask if the user explicitly says "commit" as their request. Example: "fix the watcher and commit" = clear commitment request.

**Never assume** that:
- Showing working code = permission to commit
- Changes are ready = permission to commit
- Feedback like "that timeout won't work" = permission to commit

Default to asking. It takes 5 seconds and prevents commits that shouldn't exist.

## Development Guidelines

### Before Making Changes
1. Read relevant docs (requirements, architecture, constraints)
2. Check ROADMAP.md for planned work
3. Review recent commits for context
4. Check docs/decisions.md for related decisions

### When Making Decisions
- Capture rationale in commit messages
- Add entry to docs/decisions.md if it's a major architectural choice
- Update relevant docs (architecture.md, constraints.md) if decision changes them

### Code Conventions

**Commit Messages (CRITICAL):**
- All commits MUST use Conventional Commits format
- Reference: https://www.conventionalcommits.org/en/v1.0.0/
- No exceptions - this is enforced

**Language/Framework:**
- TypeScript for all source code
- Pure functional architecture (no classes)
- React for UI components
- Zod for schema validation
- Bun as runtime

**Testing:**
- Write tests for new features
- Use `bun test` to run tests
- Aim for >80% coverage on critical paths

**Code Style:**
- Use `bun run format` before committing
- Use `bun run lint` to check for issues
- Use `bun run check` for final verification
- Follow Biome defaults (no custom config needed)

## Asking for Help

**Good prompts:**
- "Review the requirements and suggest an approach for [feature]"
- "Does this change align with our architecture decisions?"
- "What version bump does this warrant?"
- "Check if this violates any constraints"

**Provide context:**
- Link to relevant docs: "See docs/constraints.md for performance requirements"
- Reference decisions: "This relates to the postgres migration decision"
- Point to roadmap: "This is part of the Q4 auth work"

## Keeping Documentation Fresh

Documentation lives with code and evolves with it:
- Update docs in the same commit as code changes
- If you find docs are wrong, fix them immediately
- Stale docs are worse than no docs

## Documentation Management via CtrlSpec

Ctrl uses [CtrlSpec](https://github.com/ctrleditor/ctrlspec) for documentation templates and management:

**Template docs** (from CtrlSpec):
- `docs/requirements.md`, `architecture.md`, `constraints.md`, `decisions.md`
- `docs/testing.md`, `deployment.md`, `llm.md`

**Ctrl-specific docs** (in addition to templates):
- `docs/ai-features.md` - User guide for AI features
- `docs/ai-integration-architecture.md` - Phase 2 AI design
- `docs/plugin-system-architecture.md` - Plugin system design
- `docs/plugin-development.md` - Plugin developer guide
- `docs/ctrl-specific-constraints.md` - OpenTUI/OpenCode patterns
- `docs/development-guide.md` - Setup and coding patterns
- `docs/strategy.md` - Business model and go-to-market
- `docs/roadmap.md` - Project timeline

**Syncing templates:**
If CtrlSpec templates need updating:
```bash
curl -fsSL https://ctrleditor.com/spec.sh | sh
```

This preserves Ctrl-specific docs while updating core templates.

---

## Current Project Status (Jan 23, 2026)

**Project Name:** Ctrl
**Repository:** https://github.com/ctrleditor/ctrl
**Documentation:** Uses [CtrlSpec](https://github.com/ctrleditor/ctrlspec) templates
**Status:** Core Editor Prototype - Fully Functional MVP

### What's Working ✅
- **Modal editing system** (normal, insert, visual, command modes)
- **Buffer text editing** (insert, delete, backspace, enter with proper keybinds)
- **Vim-style navigation** (h/j/k/l in normal mode, Ctrl+h/j/k/l in insert mode)
- **Config file loading** from ~/.config/ctrl/config.toml (XDG compliant)
- **Fully dynamic keybindings** - All keybinds come from config.toml (25+ commands)
- **Config-driven UI colors** (TOML with Zod validation)
- **Syntax highlighting** with per-token colored rendering (TypeScript/JavaScript)
- **Asynchronous parsing** with tree-sitter (debounced 100ms)
- **11 syntax token types** (keywords, strings, types, functions, comments, etc.)
- **Gogh color schemes** - 50+ built-in themes (dracula, nord, one-dark, tokyo-night, etc.)
- **User-defined themes** - Load custom themes from ~/.config/ctrl/themes/
- **Ghostty auto-detection** - Auto-detects terminal theme from Ghostty config
- **Per-token customization** - Override individual syntax colors in config
- **Theme switching** - `/theme <name>` command for live theme switching
- **Command palette** - Accessible via `/` in normal mode (AI-native feel)
- **Help menu** (Ctrl+P) showing all keybindings from config
- **Text rendering** with proper OpenTUI span-based coloring (no jumping/wrapping)
- **Clean exit** (q, Ctrl+C, Ctrl+D) without shell artifacts
- **Cursor display** with visual feedback
- **React + OpenTUI** rendering with proper layout

### Known Issues ⚠️
- Keywords not yet captured by tree-sitter highlights query (will improve with LSP)
- (Resolved ✅) Text rendering - proper span-based coloring in OpenTUI
- (Resolved ✅) Insert mode keybinds - all commands wired up
- (Resolved ✅) Theme system fully implemented with Gogh schemes
- (Resolved ✅) Config hot-reload working
- (Resolved ✅) Visual mode selection fully implemented

### Recent Fixes & Implementation 🎯
- **Dynamic Keybind System** - All keybindings configured via config.toml
- **Command Executor Pattern** - 25+ pure command handlers for testability
- **Keybind Matcher** - Parse and match complex keybind patterns (ctrl+shift+c, etc.)
- **Fixed Text Rendering** - Proper OpenTUI span-based coloring (no more jumping)
- **Fixed Insert Mode** - Added return, backspace, Ctrl+hjkl keybinds
- **50+ tests** - Syntax, themes, keybinds, rendering integration

### Next Phase 🔨
1. **LSP Integration** - TypeScript language server for better highlighting
2. **AI chat interface**
3. **Inline completions** (ghost text)
4. **Plugin system**
5. **Multiple buffers/split windows**

### Critical Code Patterns to Know

**Exit Sequence (CRITICAL - DO NOT MODIFY):**
```typescript
// DO NOT use setTimeout, Promise.race, or delays
// Exact sequence required:
try {
  await renderer.destroy?.();
} catch {
  // Ignore cleanup errors
}
process.exit(0);
```
This pattern ensures clean terminal state without shell artifacts (tested with zsh).

**Vim Navigation (Default Keybinds):**
- Normal mode: h/j/k/l for movement
- Insert mode: Ctrl+h/j/k/l for movement, Esc to return normal
- All modes: q/Ctrl+C/Ctrl+D to exit

**Config Loading:**
- Path: `~/.config/ctrl/config.toml` (XDG spec)
- Parsed via: `import(configPath, { with: { type: "toml" } })`
- Validated with Zod schema
- Falls back to defaults if file missing

### File Structure Overview
```
src/
├── main.tsx                           # App entry, init
├── ui/
│   ├── renderer.tsx                   # React rendering + keystroke handling
│   │                                  # Includes TextSegment rendering for syntax colors
│   └── themes/                        # Gogh theme system (fully implemented)
│       ├── types.ts                   # Type definitions
│       ├── schemes.ts                 # 5 bundled themes
│       ├── loader.ts                  # Theme loading functions
│       ├── all-gogh-schemes.ts        # 50+ Gogh schemes (lazy-loaded)
│       ├── ghostty.ts                 # Ghostty auto-detection
│       ├── user-themes.ts             # User-defined themes
│       └── index.ts                   # Barrel export
├── core/
│   ├── buffer/                        # Text buffer management
│   ├── modal/                         # Mode system (normal, insert, visual, command)
│   ├── commands/                      # Command registry
│   └── syntax/                        # Syntax highlighting
│       ├── parser.ts                  # Tree-sitter integration
│       └── parser.test.ts             # Parser unit tests
├── config/
│   ├── loader.ts                      # Load ~/.config/ctrl/config.toml
│   ├── schema.ts                      # Zod schemas + syntax colors
│   └── watcher.ts                     # File watching (dual-mode, working)
└── types/
    ├── app.ts                         # AppState interface (includes syntax field)
    ├── syntax.ts                      # SyntaxToken, SyntaxHighlighting types
    └── index.ts                       # Core type definitions
```
