# Plugin Development Guide

Build extensions for Ctrl using TypeScript and ship to the plugin registry in minutes.

## Quick Start

### Create a Plugin

```bash
# Generate scaffold
npx @aiide/create-plugin my-awesome-plugin

cd my-awesome-plugin
cat plugin.toml        # Manifest
cat src/index.ts       # Entry point
```

### Plugin Structure

```
my-plugin/
├── plugin.toml         # Plugin metadata and manifest
├── package.json        # npm dependencies
├── src/
│   └── index.ts        # Entry point (activate function)
├── dist/               # Built files (generated)
├── test/               # Test files
├── README.md           # Plugin documentation
└── LICENSE             # Apache 2.0 recommended
```

### Minimal Example

**plugin.toml:**
```toml
[plugin]
name = "hello-world"
version = "0.1.0"
description = "A simple hello world plugin"
author = "Your Name"
main = "dist/index.js"
runtime = "typescript"

[capabilities]
commands = true

[permissions]
editor.commands = ["hello.world"]

[activation]
on_command = ["hello.world"]

[[contributes.commands]]
command = "hello.world"
title = "Hello World"
category = "Greetings"
```

**src/index.ts:**
```typescript
import { ExtensionContext, commands, window } from '@aiide/plugin-api';

export function activate(context: ExtensionContext) {
  // Register command
  const disposable = commands.registerCommand('hello.world', async () => {
    await window.showInformation('Hello, World!');
  });

  // Add to cleanup list
  context.subscriptions.push(disposable);
}

export function deactivate() {
  // Cleanup on deactivation
}
```

### Build & Test

```bash
# Build
bun run build

# Test locally
ctrl --dev-plugin ./my-plugin

# Test in Ctrl editor, press <leader>cp to open command palette
# Type "hello" and run "Hello World" command
```

### Publish

```bash
# Authenticate
ctrl plugin login

# Publish
ctrl plugin publish

# Your plugin is now available:
# ctrl plugin install hello-world
```

---

## Plugin Manifest (plugin.toml)

The manifest is the contract between your plugin and the editor.

### Plugin Metadata

```toml
[plugin]
name = "my-plugin"           # Unique identifier (kebab-case)
version = "1.0.0"            # Semantic versioning
description = "What it does"
author = "Your Name"
license = "Apache-2.0"       # Recommended
repository = "https://github.com/..."
homepage = "https://..."
main = "dist/index.js"       # Compiled entry point
runtime = "typescript"       # "typescript" or "wasm"
min_editor_version = "0.1.0" # Minimum Ctrl version required
```

### Capabilities

What your plugin can do:

```toml
[capabilities]
commands = true              # Can register commands
keybindings = true          # Can register keybindings
languages = ["typescript"]  # Language support
file_operations = ["read"]  # "read", "write", "delete"
ui_views = true             # Can create panels/sidebars
ai_features = true          # Uses AI API
lsp = true                  # Manages language servers
```

### Permissions

Explicit permissions required:

```toml
[permissions]
# Editor permissions
editor.commands = ["my-command", "other-command"]
editor.keybindings = true
editor.ui_modification = true

# Filesystem permissions (glob patterns)
filesystem.read = ["**/*.ts", "**/*.json", "**/tsconfig.json"]
filesystem.write = ["**/*.ts"]
filesystem.delete = []  # Be careful!

# Network permissions (domains)
network.domains = ["api.github.com", "*.example.com"]

# AI permissions
ai.completions = true
ai.chat = true
ai.mcp_tools = ["filesystem", "github"]  # Which MCP tools to access

# Environment
environment.read = ["NODE_ENV", "USER"]
```

### Activation Events

When your plugin loads:

```toml
[activation]
on_startup = true                           # Load immediately
on_language = ["typescript", "javascript"]  # When files open
on_command = ["my-plugin.command"]          # When command executes
on_file_pattern = ["**/tsconfig.json"]      # When files matching pattern exist
on_view = "explorer"                        # When specific view opens
```

### Contributions

What your plugin adds to the editor:

```toml
[[contributes.commands]]
command = "my-plugin.format"
title = "Format with MyFormatter"
category = "MyPlugin"
when = "editorTextFocus"  # Only show when editing

[[contributes.keybindings]]
command = "my-plugin.format"
key = "<leader>mf"
when = "editorTextFocus"

[contributes.configuration]
title = "My Plugin Settings"

[contributes.configuration.properties]
"myPlugin.enable" = {
  type = "boolean",
  default = true,
  description = "Enable my plugin"
}
"myPlugin.style" = {
  type = "string",
  enum = ["compact", "detailed"],
  default = "compact",
  description = "Output style"
}

[[contributes.views]]
id = "myPlugin.explorer"
name = "My Explorer"
container = "sidebar"  # "sidebar", "bottomPanel", "mainPanel"
```

---

## Plugin API Overview

### Core Namespaces

**window** - UI and user interactions
```typescript
import { window } from '@aiide/plugin-api';

await window.showInformation('Message');
await window.showWarning('Warning');
await window.showError('Error');

const input = await window.showInputBox({ prompt: 'Enter value' });
const choice = await window.showQuickPick(['Option 1', 'Option 2']);

window.createStatusBarItem('my-status', { text: 'Ready' });
window.createOutputChannel('my-plugin');  // Logging
```

**workspace** - Files and configuration
```typescript
import { workspace } from '@aiide/plugin-api';

const files = await workspace.findFiles('**/*.ts');
const content = await workspace.readFile('path/to/file');
await workspace.writeFile('path/to/file', 'content');
await workspace.deleteFile('path/to/file');

const config = workspace.getConfiguration('myPlugin');
const value = config.get('setting');
await config.update('setting', newValue);
```

**commands** - Command registration and execution
```typescript
import { commands } from '@aiide/plugin-api';

const disposable = commands.registerCommand('my-plugin.action', async () => {
  // Command logic
});

await commands.executeCommand('my-plugin.action');
```

**languages** - LSP and code intelligence
```typescript
import { languages } from '@aiide/plugin-api';

languages.registerCompletionProvider('typescript', {
  provideCompletions(document, position) {
    return [{ label: 'suggestion', insertText: 'suggestion' }];
  }
});

languages.registerHoverProvider('typescript', {
  provideHover(document, position) {
    return { contents: 'Hover information' };
  }
});
```

**ai** - AI capabilities
```typescript
import { ai } from '@aiide/plugin-api';

// Chat with streaming
const response = await ai.streamChat([
  { role: 'user', content: 'Explain this code' }
]);

for await (const chunk of response) {
  console.log(chunk);  // Print as it arrives
}

// Inline completions
ai.registerInlineCompletionProvider('typescript', {
  async provideInlineCompletion(document, position) {
    return { text: 'suggestion', range: [position, position] };
  }
});
```

**ai context** - Build context for AI requests
```typescript
import { ai } from '@aiide/plugin-api';

const context = ai.createContextBuilder()
  .addFile(document)           // Current file
  .addDiagnostics()            // LSP diagnostics
  .addOpenFiles(5)             // 5 most recent files
  .build();

const response = await ai.streamChat(messages, { context });
```

### Extension Context

Passed to your `activate()` function:

```typescript
export function activate(context: ExtensionContext) {
  // Storage
  const globalState = context.globalState;  // Persists across sessions
  const workspaceState = context.workspaceState;  // Persists per workspace
  const secrets = context.secrets;  // Encrypted storage for passwords/tokens

  // Logging
  const logger = context.logger;
  logger.log('Debug message');
  logger.warn('Warning');
  logger.error('Error');

  // Cleanup
  context.subscriptions.push(disposable);  // Auto-disposed on deactivation

  // Metadata
  console.log(context.extensionPath);  // Plugin's directory
  console.log(context.extensionId);    // Plugin's ID
  console.log(context.environment);    // Environment variables
}
```

---

## Security & Permissions

### Understanding Permissions

Your plugin must declare what it needs. Users can:
- ✅ Grant permanently
- ⏱️ Grant for this session only
- ❌ Deny the permission
- 👀 View why you're asking

### Permission Examples

**Low Risk** (theme plugin):
```toml
[permissions]
# No filesystem, network, or AI access needed
```

**Medium Risk** (formatter):
```toml
[permissions]
filesystem.read = ["**/*.ts", "**/*.json"]
filesystem.write = ["**/*.ts"]
```

**High Risk** (AI assistant):
```toml
[permissions]
ai.completions = true
ai.chat = true
filesystem.read = ["**"]  # Full read access
network.domains = ["*"]   # Any network call
```

### Best Practices

- **Principle of least privilege**: Request only what you need
- **Specific patterns**: Use glob patterns, not `**`
- **Explain in docs**: Tell users why you need permissions
- **Validate user input**: Never trust workspace files
- **No credential storage**: Use secrets API for sensitive data

---

## Publishing Your Plugin

### Before Publishing

1. **Test thoroughly**
   ```bash
   bun run build
   ctrl --dev-plugin ./my-plugin
   # Test all features
   ```

2. **Update manifest**
   - Bump version
   - Update description
   - Verify all fields

3. **Write README.md**
   - What does it do?
   - Installation instructions
   - Configuration options
   - Examples
   - License

4. **License**
   - Add LICENSE file
   - Apache 2.0 or MIT recommended

### Publish

```bash
# First time: authenticate
ctrl plugin login
# Follow prompts with your registry account

# Publish
ctrl plugin publish

# Check it worked
ctrl plugin search my-plugin
```

### Updates

```bash
# Bump version in plugin.toml and package.json
echo "0.2.0" > version.txt

# Rebuild
bun run build

# Publish new version
ctrl plugin publish

# Users with auto-update get it automatically
```

---

## Testing Your Plugin

### Unit Tests

```typescript
// test/commands.test.ts
import { describe, it, expect } from 'bun:test';
import { mockExtensionContext, mockCommands } from '@aiide/plugin-test';

describe('My Plugin', () => {
  it('should register commands', async () => {
    const context = mockExtensionContext();
    const commands = mockCommands();

    // Activate plugin
    activate(context);

    // Check command is registered
    expect(commands.registered()).toContain('my-plugin.action');
  });

  it('should execute command', async () => {
    const context = mockExtensionContext();
    const commands = mockCommands();

    activate(context);

    // Execute command
    const result = await commands.execute('my-plugin.action');
    expect(result).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// test/integration.test.ts
import { describe, it, expect } from 'bun:test';
import { EditorSession } from '@aiide/plugin-test';

describe('Plugin Integration', () => {
  it('should work in editor', async () => {
    const session = new EditorSession();

    // Load plugin
    await session.loadPlugin('./dist/index.js');

    // Open file
    await session.openFile('test.ts');

    // Run command
    const result = await session.executeCommand('my-plugin.action');
    expect(result.success).toBe(true);

    session.close();
  });
});
```

### Run Tests

```bash
bun test
```

---

## Advanced Topics

### Language Server Integration

Bundle a language server:

```typescript
import { languages, workspace } from '@aiide/plugin-api';
import { spawn } from 'child_process';

export function activate(context: ExtensionContext) {
  // Start language server
  const serverProcess = spawn('my-language-server');

  // Register with editor
  const client = languages.createLanguageClient({
    name: 'My Language',
    serverOptions: {
      run: { command: 'my-language-server' },
      debug: { command: 'my-language-server', args: ['--debug'] }
    },
    documentSelector: [{ scheme: 'file', language: 'mylang' }]
  });

  client.start();
  context.subscriptions.push({ dispose: () => client.stop() });
}
```

### Custom UI with Webviews

```typescript
export function activate(context: ExtensionContext) {
  window.createWebviewPanel({
    viewType: 'myWebview',
    title: 'My Dashboard',
    html: `
      <html>
        <body>
          <h1>Welcome</h1>
          <button onclick="sendMessage('hello')">Click me</button>
          <script>
            function sendMessage(msg) {
              vscode.postMessage({ command: msg });
            }
          </script>
        </body>
      </html>
    `,
    onMessage: (message) => {
      window.showInformation(`Received: ${message.command}`);
    }
  });
}
```

### WASM Plugins (High Performance)

For compute-intensive operations, compile to WebAssembly:

```bash
# In Rust
#[wasm_bindgen]
pub fn format_code(code: String) -> String {
  // Formatting logic
  code.trim().to_string()
}

# Compile to WASM
wasm-pack build --target bundler

# In plugin.toml
[plugin]
runtime = "wasm"
main = "pkg/my_plugin.js"
```

---

## Troubleshooting

**Plugin not loading?**
- Check activation events match your usage
- Run `ctrl plugin list` to see if installed
- Check logs: `ctrl --log-level debug`

**Command not appearing?**
- Ensure command is registered in activate()
- Check permissions in manifest
- Verify keybinding is correct

**Performance issues?**
- Use WASM for intensive operations
- Implement caching for expensive work
- Profile with DevTools

**API not available?**
- Check `@aiide/plugin-api` version matches editor
- Ensure you imported correctly
- File issue if missing API

---

## Resources

- **API Reference**: [api.getcap.sh](https://api.getcap.sh)
- **Examples**: [github.com/ctrleditor/plugin-examples](https://github.com/ctrleditor/plugin-examples)
- **Discord**: [ctrl community](https://discord.gg/ctrl)
- **Issue Tracker**: [github.com/ctrleditor/ctrl/issues](https://github.com/ctrleditor/ctrl/issues)
