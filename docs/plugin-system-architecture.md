# Plugin System Architecture

> **Note:** This is the comprehensive technical architecture. For a user-friendly plugin development guide, see [plugin-development.md](plugin-development.md).

## Executive Summary

A next-generation plugin system for the AI-native terminal IDE that enables developers to extend the editor's capabilities through a secure, performant, and type-safe API. The system draws inspiration from VSCode's extension ecosystem, Neovim's plugin architecture, and Zed's WASM approach, while being purpose-built for AI-first workflows.

## Design Philosophy

### Core Principles

**1. Security First**
Every plugin runs in an isolated sandbox with explicit permissions. Users maintain full control over what plugins can access—filesystem, network, AI capabilities, or editor internals. This prevents malicious plugins from compromising user data or system security.

**2. Type Safety by Default**
The entire plugin API is built with TypeScript-first design. Plugin developers get autocomplete, type checking, and inline documentation in their IDEs. This reduces bugs and improves the developer experience significantly.

**3. AI-Native Architecture**
Unlike traditional editors where AI is an afterthought, plugins have first-class access to:
- AI completion engines
- Chat interfaces
- Context building systems
- MCP (Model Context Protocol) servers
- Streaming response handlers

**4. Performance Without Compromise**
Plugins can be written in TypeScript for ease of development, or compiled to WASM (WebAssembly) when performance is critical. The system supports lazy loading and hot reloading to keep the editor responsive.

**5. Developer Experience Matters**
Publishing plugins should be as easy as `npm publish`. Installing should be as simple as `aiide plugin install biome-format`. Updates, versioning, and dependency management follow familiar npm patterns.

## System Architecture

### Three-Layer Design

**Layer 1: Plugin Host (Core)**
The foundation of the plugin system manages the lifecycle, security, and communication between plugins and the editor. This layer handles:
- Loading and unloading plugins dynamically
- Enforcing security boundaries and permissions
- Managing plugin state and context
- Coordinating inter-plugin communication
- Monitoring resource usage and performance

**Layer 2: Plugin API Surface**
A comprehensive, stable API that plugins interact with. This provides access to:
- **Editor APIs**: Buffer manipulation, cursor control, selections
- **UI APIs**: Status bars, panels, notifications, webviews
- **AI APIs**: Completions, chat, context building, streaming
- **LSP APIs**: Language server integration, diagnostics, code actions
- **Workspace APIs**: File operations, configuration, project management
- **Command APIs**: Registering and executing commands
- **MCP APIs**: Integration with Model Context Protocol servers

**Layer 3: Plugin Runtimes**
Multiple runtime options for different use cases:
- **TypeScript/JavaScript**: Primary runtime for most plugins, easy to develop
- **WASM**: High-performance runtime for compute-intensive operations
- **Deno**: Secure runtime with built-in TypeScript support (future)

### Component Interaction Flow

```
User Action → Command System → Plugin Handler → Editor API → Core Editor
                    ↓
              Plugin Registry
                    ↓
              Permission Check
                    ↓
              Sandbox Execution
```

## Plugin Manifest

### The `plugin.toml` File

Every plugin is described by a TOML manifest that declares its capabilities, requirements, and contributions. This file is the single source of truth for how the plugin integrates with the editor.

**Key Sections:**

**Plugin Metadata**
- Name, version, description, author, license
- Repository URL for source code
- Minimum editor version required
- Runtime environment (TypeScript, WASM, Deno)

**Capabilities Declaration**
What the plugin is capable of doing:
- Registering commands
- Defining keybindings
- Supporting specific languages
- Reading/writing files
- Making network requests
- Accessing AI features

**Permission Requirements**
Explicit permissions the plugin needs:
- Filesystem access (read/write specific paths)
- Network access
- Editor manipulation (commands, keybindings)
- AI service usage (completions, chat)
- LSP features

**Activation Events**
When the plugin should be loaded:
- On editor startup
- When specific file types are opened
- When certain commands are executed
- When file patterns are detected

**Contributions**
What the plugin adds to the editor:
- New commands with titles and categories
- Keybindings for those commands
- Language definitions and file associations
- Configuration options for users
- UI views (panels, sidebars)
- Themes and color schemes

### Example: Biome Formatter Plugin Manifest

```toml
[plugin]
name = "biome-format"
version = "1.0.0"
description = "Format and lint code using Biome - the fast JavaScript/TypeScript toolchain"
author = "AI-IDE Community"
repository = "https://github.com/aiide/biome-plugin"
main = "dist/index.js"
runtime = "typescript"

[capabilities]
commands = true
keybindings = true
languages = ["javascript", "typescript", "json", "jsx", "tsx"]
file_operations = ["read", "write"]

[permissions]
editor.commands = ["format-document", "lint-document"]
filesystem.read = ["**/*.{js,ts,json,jsx,tsx}", "**/biome.json"]
filesystem.write = ["**/*.{js,ts,json,jsx,tsx}"]

[activation]
on_language = ["javascript", "typescript", "json"]
on_command = ["biome.format", "biome.lint"]
on_file_pattern = ["**/biome.json"]

# Commands contributed by this plugin
[[contributes.commands]]
command = "biome.format"
title = "Format with Biome"
category = "Biome"
when = "editorTextFocus"

[[contributes.commands]]
command = "biome.lint"
title = "Lint with Biome"
category = "Biome"

[[contributes.commands]]
command = "biome.check"
title = "Format and Lint"
category = "Biome"

# Keybindings
[[contributes.keybindings]]
command = "biome.format"
key = "<leader>bf"
when = "editorTextFocus"

# Configuration options users can customize
[contributes.configuration]
title = "Biome"

[contributes.configuration.properties]
"biome.enable" = {
  type = "boolean",
  default = true,
  description = "Enable Biome formatting and linting"
}
"biome.formatOnSave" = {
  type = "boolean",
  default = false,
  description = "Format files with Biome on save"
}
"biome.lintOnSave" = {
  type = "boolean",
  default = true,
  description = "Lint files with Biome on save"
}
```

## Plugin API Overview

### API Design Principles

The plugin API follows a namespace-based organization similar to VSCode, making it familiar to developers while adding AI-native capabilities that are unique to this editor.

**Stability Guarantees**
The API is versioned and maintains backward compatibility. Breaking changes only occur in major versions, and deprecated APIs remain functional with warnings for at least one major version cycle.

**Async-First**
All API methods that could potentially block (file operations, network requests, AI calls) are asynchronous and return Promises. This keeps the editor responsive even when plugins perform long-running operations.

**Type-Safe**
Complete TypeScript definitions are provided through the `@aiide/plugin-api` package. Plugins get full autocomplete and type checking during development.

### Core API Namespaces

#### Window API
Controls the editor's UI and user interactions:
- **Messaging**: Show information, warning, and error messages to users
- **Input**: Prompt for text input or quick-pick selections
- **Editor Access**: Get the active editor, visible editors, cursor positions
- **Output Channels**: Create logging channels for plugin output
- **Status Bar**: Add items to the status bar with text and icons
- **Webviews**: Create rich UI panels with HTML/CSS/JavaScript
- **Tree Views**: Register sidebar tree views with custom data

#### Workspace API
Manages files, configuration, and project-level operations:
- **File Operations**: Open, read, write, and watch files
- **Configuration**: Read and update editor and plugin settings
- **Project Info**: Access workspace folders and root paths
- **File Search**: Find files matching patterns with glob syntax
- **Text Documents**: Manage open documents and their content

#### Commands API
Handles command registration and execution:
- **Register Commands**: Define new commands plugins can invoke
- **Execute Commands**: Run editor or plugin commands programmatically
- **Command Discovery**: Query available commands

#### Languages API
Extends language support with LSP-like features:
- **Completions**: Provide code completion suggestions
- **Hover**: Show type information and documentation on hover
- **Diagnostics**: Report errors, warnings, and information messages
- **Code Actions**: Suggest quick fixes and refactorings
- **Formatting**: Register document and selection formatters
- **Signature Help**: Show function signature information

#### AI API
First-class AI integration capabilities:
- **AI Client**: Access to Claude or other configured AI models
- **Streaming**: Handle streamed responses for chat and completions
- **Inline Completions**: Provide ghost-text suggestions as users type
- **Chat Participants**: Register custom chat commands and behaviors
- **Context Building**: Access editor context (files, diagnostics, selections)
- **MCP Integration**: Call tools from Model Context Protocol servers

#### LSP API
Language Server Protocol integration:
- **Client Registration**: Start and manage language servers
- **Server Options**: Configure server startup and transport
- **Client Options**: Define document selectors and synchronization
- **Custom Protocols**: Extend LSP with custom messages

### Plugin Context

When a plugin is activated, it receives an `ExtensionContext` object that provides:

**Storage**
- **Global State**: Persists across workspace sessions
- **Workspace State**: Persists within the current workspace
- **Secrets**: Encrypted storage for sensitive data (API keys, tokens)

**Lifecycle Management**
- **Subscriptions**: Array of disposables cleaned up on deactivation
- **Logger**: Scoped logging for debugging and monitoring

**Metadata**
- **Extension Path**: Filesystem location of the plugin
- **Extension ID**: Unique identifier for the plugin
- **Environment**: Access to environment variables

### Example: Biome Plugin Conceptual Flow

When a user presses `<leader>bf` to format with Biome:

1. **Keybinding Triggered**: Editor recognizes the key sequence
2. **Command Lookup**: Finds `biome.format` command registered by plugin
3. **Permission Check**: Verifies plugin has filesystem read/write access
4. **Plugin Execution**: Calls the command handler in the Biome plugin
5. **Buffer Access**: Plugin reads the current document content via Editor API
6. **External Tool**: Plugin spawns Biome process or uses its library
7. **Buffer Update**: Plugin writes formatted content back via Editor API
8. **UI Feedback**: Plugin shows success message via Window API

All of this happens in milliseconds, maintaining editor responsiveness.

## Plugin Lifecycle Management

### Loading and Activation

**Plugin Discovery**
When the editor starts, it scans the plugins directory (`~/.aiide/plugins`) for installed plugins. Each plugin's manifest is parsed to understand its capabilities and requirements.

**Lazy Loading**
Plugins are not loaded immediately. Instead, they remain dormant until an activation event occurs. This keeps editor startup fast and memory usage low.

**Activation Events**
Plugins activate when:
- A file of a specific language is opened
- A command they provide is executed
- The editor starts (if configured)
- A file matching a pattern is detected
- Another plugin or feature requests it

**Initialization**
When activated, the plugin's entry point function receives a context object with:
- Storage APIs for persisting data
- Access to the plugin API
- Logging capabilities
- A subscriptions array for cleanup

**Runtime**
The plugin executes in a sandboxed environment with restricted access to system resources. All API calls go through permission checks before execution.

**Deactivation**
When the editor closes or the plugin is disabled:
- All registered subscriptions are disposed
- The deactivation function (if provided) is called
- Resources are cleaned up
- State is persisted

### Hot Reloading

During development, plugins can be reloaded without restarting the editor:
1. Plugin is deactivated and cleaned up
2. New plugin code is loaded from disk
3. Plugin is re-activated with fresh context
4. Previous state is restored from storage

This dramatically speeds up plugin development iteration cycles.

## Security and Permissions

### Sandboxed Execution

Every plugin runs in an isolated sandbox that prevents:
- Direct access to the filesystem outside allowed paths
- Unrestricted network access
- Spawning arbitrary processes
- Reading environment variables without permission
- Accessing other plugins' data

### Permission Model

**Explicit Declarations**
Permissions must be declared in the plugin manifest. A plugin requesting filesystem read access must specify exactly which file patterns it can read.

**Runtime Checks**
Before executing any privileged operation, the plugin host verifies the plugin has the required permission. Unauthorized attempts are blocked and logged.

**User Consent**
When a plugin requests sensitive permissions (network access, AI usage), users can:
- Grant the permission permanently
- Grant for this session only
- Deny the permission
- View why the permission is needed

**Granular Controls**
Permissions are fine-grained:
- Filesystem: Separate read/write/delete per path pattern
- Network: Allow/deny specific domains
- AI: Control access to completions vs. chat vs. MCP tools
- Editor: Control command registration vs. keybinding modification

### Permission Examples

**Low Risk**: A theme plugin only needs UI permissions
**Medium Risk**: A formatter needs filesystem read/write for specific file types
**High Risk**: An AI assistant needs network access and AI API access

Users can review and revoke permissions at any time through the settings UI.

## Plugin Distribution and Management

### Plugin Registry

A centralized registry hosts approved plugins:
- **Discovery**: Search and browse available plugins
- **Metadata**: Version history, download counts, ratings
- **Security**: All plugins are scanned for malicious code
- **Updates**: Automatic notification of new versions

### Installation Flow

**User Experience:**
1. User searches for "biome" in plugin manager UI
2. Selects "biome-format" from results
3. Reviews permissions requested
4. Clicks install
5. Plugin downloads and activates automatically

**Under the Hood:**
1. Registry API returns plugin metadata
2. Plugin package is downloaded
3. Manifest is parsed and validated
4. Dependencies are resolved and installed
5. Plugin is registered with the host
6. Activation events are registered

### CLI Management

Power users can manage plugins from the command line:
- `aiide plugin install biome-format` - Install a plugin
- `aiide plugin uninstall biome-format` - Remove a plugin
- `aiide plugin update` - Update all plugins
- `aiide plugin list` - Show installed plugins
- `aiide plugin search linter` - Search registry
- `aiide plugin enable biome-format` - Enable a disabled plugin
- `aiide plugin disable biome-format` - Disable without uninstalling

### Versioning

Plugins follow semantic versioning:
- **Major**: Breaking API changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes

The editor can specify minimum/maximum plugin API versions it supports, preventing incompatible plugins from loading.

## Developer Experience

### Plugin Development Kit

**Scaffolding**
Generate a new plugin with all boilerplate:
```bash
npx @aiide/create-plugin my-plugin
```

This creates a complete plugin project with:
- TypeScript configuration
- Example code demonstrating API usage
- Test setup
- Build scripts
- Manifest template

**Type Definitions**
Install `@aiide/plugin-api` for full TypeScript support:
- Autocomplete for all API methods
- Inline documentation
- Type checking
- JSDoc examples

**Development Mode**
Load local plugins for testing:
```bash
aiide --dev-plugin ./my-plugin
```

Changes to plugin code trigger automatic reloading.

**Testing Framework**
Write tests using provided utilities:
- Mock editor state
- Simulate user actions
- Verify API calls
- Test activation/deactivation

**Debugging**
Plugins can use standard debugging tools:
- Console logging through the Logger API
- Breakpoints in TypeScript debuggers
- Performance profiling
- Error stack traces

### Publishing Process

**Preparation**
1. Ensure manifest is complete and accurate
2. Write documentation (README)
3. Test thoroughly across file types and scenarios
4. Bump version number

**Publishing**
1. Authenticate with registry: `aiide plugin login`
2. Publish: `aiide plugin publish`
3. Registry validates manifest and permissions
4. Package is uploaded and indexed
5. Users can now discover and install

**Updates**
Simply bump the version and publish again. Users with auto-update enabled will be notified.

## Advanced Capabilities

### Language Server Integration

Plugins can bundle and manage their own language servers:
- Start server process on plugin activation
- Configure server capabilities and settings
- Handle server lifecycle (restart on crash)
- Provide custom LSP extensions

This enables plugins to add full IDE features for new languages.

### Custom UI Components

Beyond standard API methods, plugins can create rich UIs:

**Webview Panels**
Render HTML/CSS/JavaScript in panels:
- Dashboard displays
- Settings interfaces
- Visualizations
- Interactive tools

**Tree Views**
Add collapsible tree structures to sidebars:
- File explorers
- Outline views
- Search results
- Custom hierarchies

**Status Bar Items**
Add indicators and controls to the status bar:
- Git branch and status
- Line/column position
- Language mode
- Custom metrics

### AI-Powered Features

Plugins have unprecedented access to AI capabilities:

**Inline Completions**
Provide ghost-text suggestions as users type, powered by AI that understands the full codebase context.

**Chat Integration**
Add custom chat commands that users can invoke in the AI panel:
```
/review-code - Analyze selected code for issues
/generate-tests - Create unit tests for functions
/explain - Explain complex code sections
```

**Context Providers**
Supply additional context for AI requests:
- Project structure
- Dependencies
- Recent git commits
- Related documentation

**MCP Tool Integration**
Call external tools through Model Context Protocol:
- Query databases
- Fetch API data
- Run build commands
- Access external services

### Performance Optimization

**WASM Plugins**
For compute-intensive operations (syntax highlighting, parsing, formatting), plugins can be compiled to WebAssembly:
- 10-100x faster than JavaScript
- Near-native performance
- Compiled from Rust, C++, or other languages
- Same API surface as TypeScript plugins

**Worker Threads**
Long-running operations can run in background threads:
- Keeps UI responsive
- Parallel processing
- Message passing for communication

**Caching**
Plugin host provides caching mechanisms:
- File content caching
- Parse tree caching
- Configuration caching
- Custom data caching

## Example Use Cases

### Biome Formatter & Linter

**What it does:**
- Formats JavaScript/TypeScript code on save or command
- Provides real-time linting diagnostics
- Suggests fixes for common issues
- Respects biome.json configuration

**How it works:**
- Spawns Biome CLI process or uses WASM build
- Reads file content through Editor API
- Runs formatting/linting
- Applies changes or shows diagnostics
- Integrates with LSP for code actions

### Git Integration

**What it does:**
- Shows git status in file tree
- Displays diff gutter signs
- Provides commit, push, pull commands
- Shows blame information on hover

**Permissions needed:**
- Filesystem read (workspace)
- Process spawn (git commands)
- UI modification (gutter, status bar)

### AI Pair Programmer

**What it does:**
- Analyzes code as you type
- Suggests completions based on project context
- Answers questions about the codebase
- Generates documentation
- Refactors code intelligently

**Permissions needed:**
- AI completions
- AI chat
- Filesystem read (for context)
- Editor manipulation

### REST API Client

**What it does:**
- Sends HTTP requests from editor
- Displays responses formatted
- Saves request collections
- Environment variable support

**Permissions needed:**
- Network access (user-specified domains)
- Filesystem read/write (for collections)
- UI panels (for response display)

## Future Enhancements

### Plugin Marketplace

Beyond the basic registry:
- **Featured Plugins**: Curated list of high-quality plugins
- **Categories**: Browse by functionality
- **Reviews**: User ratings and feedback
- **Screenshots**: Visual previews of plugin functionality
- **Verified Publishers**: Trusted developers and organizations

### Remote Plugins

Run plugins on remote servers:
- Offload compute-intensive operations
- Access resources not available locally
- Share plugin state across machines
- Collaborate with team members

### Plugin Composition

Plugins can build on each other:
- Export APIs for other plugins to use
- Compose multiple plugins into workflows
- Share services (caching, network, AI)
- Create plugin ecosystems

### Analytics and Monitoring

Track plugin performance and usage:
- Activation time
- Memory consumption
- API call patterns
- Error rates
- User engagement

This helps plugin developers optimize their code and prioritize features.

---

**Summary**

The plugin system is designed to make extending the editor as easy as possible while maintaining security and performance. Whether you're building a simple syntax highlighter or a complex AI-powered refactoring tool, the API provides the primitives you need. The combination of TypeScript development, WASM performance, and AI-native capabilities makes this plugin system uniquely powerful for modern development workflows.
