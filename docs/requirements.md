# Requirements

> **💡 Pro tip:** If you use Jira/Confluence, you can auto-populate this file using the
> [Atlassian MCP server](https://github.com/atlassian/atlassian-mcp-server).
> Connect it to Claude.ai and ask: "Pull our product requirements from Jira and format them for docs/requirements.md"

## Project Overview

Ctrl is an AI-native code editor built for the terminal that treats AI as infrastructure, not a feature. It's designed for developers who want a keyboard-driven, high-performance editor with first-class AI capabilities integrated throughout the editing experience. Built on TypeScript + Zig (via OpenTUI) with a powerful plugin system and Model Context Protocol (MCP) support.

## Business Goals

- **Become the fastest, most extensible AI-aware terminal IDE**: Compete with VSCode/Vim for terminal users, differentiated by native AI capabilities
- **Build a sustainable open-source project with a hosted premium offering**: Free CLI tool + paid SaaS features for teams
- **Establish a plugin ecosystem**: Enable community to build language support, tools, and AI features without core changes
- **Demonstrate AI-as-infrastructure architecture**: Prove that treating AI as a platform layer (not bolted-on features) enables better developer experience
- **Achieve killer demos and go viral with early adopters**: Record compelling 3-minute videos showing AI-powered coding in a terminal

## Target Users

### Primary: Terminal-Native Developers
- **Who**: Vim/Neovim users, remote developers, devops engineers, sysadmins
- **Why**: Want a modern editor without leaving the terminal; appreciate keyboard-driven workflows
- **Needs**: Fast startup, low resource usage, modal editing, extensibility via plugins, persistent connection to remote machines

### Secondary: AI-Early-Adopter Developers
- **Who**: Developers experimenting with AI coding tools (Cursor, GitHub Copilot, Claude)
- **Why**: Want AI capabilities but prefer terminal workflows or need to run on remote servers
- **Needs**: Inline completions, chat interface, code explanation, refactoring suggestions, reproducible context

### Tertiary: Teams & Enterprises (Post-MVP)
- **Who**: Dev teams, startups, enterprises
- **Why**: Cost control, customization, data privacy, team configuration sharing
- **Needs**: Hosted collaboration, SSO integration, audit logging, team plugins, shared configurations

## Functional Requirements

### Core Features (MVP - 2 weeks)

1. **Modal Editing System (Vim-like)**
   - Description: Support normal, insert, visual, and command modes with modal switching
   - User story: As a Vim user, I want familiar modal editing so that I can be productive immediately
   - Acceptance criteria:
     - [ ] Normal mode with basic movements (hjkl, w/b, $/0, gg/G)
     - [ ] Insert mode with text input and completion triggers
     - [ ] Visual mode with selections
     - [ ] Mode indicator in status bar
     - [ ] Smooth transitions between modes

2. **Buffer Management & File Editing**
   - Description: Open, edit, and save files with rope-based data structure for performance
   - User story: As a developer, I want to edit files and see changes save reliably
   - Acceptance criteria:
     - [ ] Open files from filesystem
     - [ ] Edit text with undo/redo
     - [ ] Auto-save and manual save (`:w`)
     - [ ] Support for 100MB+ files without lag
     - [ ] Multiple buffers (`:e`, `:b`)

3. **Configuration System (TOML)**
   - Description: Load and hot-reload settings from TOML config files
   - User story: As a user, I want to configure the editor via TOML that I can version control
   - Acceptance criteria:
     - [ ] Load TOML config files (default, user, workspace, project)
     - [ ] Validate config with helpful error messages
     - [ ] Hot-reload on file change
     - [ ] Keybinding configuration in TOML
     - [ ] Support for themes and UI settings

4. **Plugin System**
   - Description: Load and execute isolated plugins that extend editor functionality
   - User story: As a plugin developer, I want to build features without modifying core code
   - Acceptance criteria:
     - [ ] Plugin manifest parsing (package.json-like)
     - [ ] Sandbox execution (WASM isolation or Workers)
     - [ ] Plugin activation on demand (lazy loading)
     - [ ] Basic plugin API (window, commands, workspace)
     - [ ] Permission system (filesystem, network, AI)
     - [ ] Plugin hot-reload

5. **AI Integration (Claude API)**
   - Description: Stream responses from Claude with context management
   - User story: As a developer, I want to ask Claude questions about my code right from the editor
   - Acceptance criteria:
     - [ ] Make streamed API calls to Claude
     - [ ] Build context (current buffer + diagnostics)
     - [ ] Token/cost tracking
     - [ ] Display streaming responses in real-time
     - [ ] Support multiple AI providers (extensible)

6. **Chat Interface Plugin**
   - Description: Conversational AI panel for asking questions about code
   - User story: As a developer, I want a chat panel where I can ask AI questions with full code context
   - Acceptance criteria:
     - [ ] Chat panel on left/right side
     - [ ] Message history
     - [ ] Include current file/selection in context automatically
     - [ ] Syntax highlighting for code blocks
     - [ ] `<leader>ac` to toggle chat

7. **Inline Completions Plugin**
   - Description: Ghost-text code completions powered by AI
   - User story: As a developer, I want AI suggestions to appear as I type, like Copilot
   - Acceptance criteria:
     - [ ] Trigger on `<C-Space>` in insert mode
     - [ ] Show ghost text (gray, non-intrusive)
     - [ ] `Tab` to accept, `Esc` to reject
     - [ ] Configurable trigger delay (500ms default)
     - [ ] Disable/enable via config

8. **TypeScript LSP Plugin**
   - Description: Language Server Protocol support for TypeScript/JavaScript
   - User story: As a TypeScript developer, I want completions, hover info, and diagnostics
   - Acceptance criteria:
     - [ ] Launch tsserver process
     - [ ] Hover shows type information
     - [ ] Completions via `<C-n>`
     - [ ] Diagnostics shown in editor
     - [ ] `gd` to goto definition
     - [ ] `gr` to goto references

9. **Syntax Highlighting**
   - Description: Tree-sitter powered syntax highlighting
   - User story: As a developer, I want code to be color-coded for easy reading
   - Acceptance criteria:
     - [ ] Support TypeScript/JavaScript
     - [ ] Support common languages (Python, Rust, Go, etc.)
     - [ ] Themeable colors via config

### Secondary Features (Post-MVP)

- **Multiple language support** (Python, Rust, Go, etc.)
- **Advanced LSP features** (rename, code actions, workspace symbols)
- **Git integration** (blame, diff, log, staging)
- **File tree and fuzzy finder** (file navigation)
- **Debugging integration**
- **Test runner integration**
- **Terminal buffer** (integrated terminal in editor)
- **Split windows/panes**
- **Search & replace** with regex
- **Theme marketplace**

## Non-Functional Requirements

### Performance (Hard Targets)
- **Startup time**: < 100ms cold start (plugin discovery, config loading)
- **Keystroke latency**: < 16ms (60fps, immediate visual feedback)
- **Memory usage**: < 100MB idle, < 500MB with large project loaded
- **AI first token**: < 2s (from request to first streamed response)
- **File handling**: Smooth editing of 100MB+ files
- **Syntax highlighting**: No lag with complex syntax trees

### Security
- **Plugin sandboxing**: Plugins run in isolated WASM or Worker context
- **Permission enforcement**: Fine-grained permissions (filesystem, network, AI)
- **API key management**: Store sensitive config in secure storage, never in plain text
- **Data encryption**: TLS 1.3+ for all network communication
- **Compliance**: GDPR-compliant data handling (future: SSO, audit logging for enterprise)

### Reliability
- **Crash resilience**: Auto-recovery from plugin crashes
- **Data safety**: Atomic writes, undo/redo system, no data loss on crash
- **Plugin isolation**: One bad plugin doesn't crash the editor
- **Error handling**: Graceful degradation if AI service unavailable

### Usability
- **Keyboard-first**: All features accessible via keybindings
- **Discoverability**: Command palette (`:` or `<leader>`) searchable
- **Vim compatibility**: Familiar for Vim users; not 100% compatible but aim for 80%
- **Platform support**: macOS, Linux, Windows (binaries + npm package)

## Success Metrics

### Prototype (2 weeks)
- ✅ Can edit and save TypeScript files
- ✅ Modal editing system functional
- ✅ Plugin system loads and runs plugins
- ✅ AI chat works end-to-end
- ✅ Inline completions work
- ✅ LSP provides completions and hover
- ✅ Demo video is compelling and shareable

### MVP (3 months)
- 10+ essential plugins available
- 5+ languages with LSP support
- < 100ms startup time
- < 16ms keystroke latency
- 100+ early adopter installs
- Positive feedback on AI features

### v1.0 (6 months)
- 50+ plugins in registry
- 10+ languages fully supported
- 1000+ active users
- Plugin marketplace live
- Complete documentation
- Positive reviews/press coverage

## Out of Scope

The following are explicitly out of scope for the MVP and will be addressed in Phase 2+:

- **Collaborative editing**: Multi-user sessions (future: Modo Ventures hosted version)
- **Graphical UI**: This is a terminal-only tool (no GUIs)
- **100% Vim compatibility**: We support common Vim operations, not all quirks
- **Mobile support**: Terminal editor for desktop/servers only
- **Built-in terminal emulator**: Integrate with system terminal, don't build one
- **Windows native binary** (MVP): Support via WSL or Git Bash; native Windows binary post-MVP
- **Debugger integration** (MVP): Deferred to phase 2
- **Test runners** (MVP): Deferred to phase 2

## Dependencies

### Required
- **Bun** (runtime): Package manager and JavaScript runtime
- **OpenTUI** (rendering): Terminal UI framework (TypeScript + Zig)
- **Anthropic Claude API**: For AI features (requires API key from user)
- **Tree-sitter** (syntax): Language-agnostic parser for highlighting
- **TypeScript**: Editor and plugins written in TypeScript

### External Services
- **Anthropic Claude API**: AI completions and chat
- **OpenAI GPT** (optional): Alternative AI provider
- **NPM registry**: For plugin distribution (future)
- **GitHub** (optional): For git operations via plugin

### Risks
- **OpenTUI stability**: 0.x version, may have breaking changes
- **API rate limits**: Claude API has rate limits (handled gracefully)
- **Network unavailability**: Editor works offline, AI features graceful degrade

## Assumptions

- Users have a compatible terminal (xterm-256color or better)
- Users can install via npm or download binary
- Users have an Anthropic API key or alternate AI provider
- Users are comfortable with terminal-based tools
- Developers want to build plugins for the ecosystem
- The terminal remains the primary interface for developers

## Open Questions

- [ ] Should git integration be in core or as a plugin? (Decided: plugin, but confirm scope)
- [ ] Should there be a built-in terminal buffer or external terminal? (Decided: external, but revisit)
- [ ] What's the plugin marketplace strategy? (Hosted registry, GitHub, npm?)
- [ ] How should collaborative features work in the hosted version?
- [ ] Should there be a web version of Ctrl for in-browser editing?
- [ ] Which languages to prioritize for language plugins post-MVP?
- [ ] How to handle AI costs for users? (Display costs, set limits, etc.)
