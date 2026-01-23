# Development Guide

## Functional Programming Patterns

This guide explains the core functional programming patterns used throughout the Ctrl codebase. All code must follow these patterns - no exceptions.

### 1. Pure Functions

```typescript
// ✅ Good: Pure function
const insertText = (buffer: TextBuffer, pos: Position, text: string): TextBuffer => {
  const newContent = buffer.content + text;
  return { ...buffer, content: newContent, isDirty: true };
};

// ❌ Bad: Mutates state
const insertText = (buffer: TextBuffer, text: string) => {
  buffer.content += text;  // NO!
};
```

All functions must:
- Return the same output for the same input
- Not have side effects (except at application boundaries)
- Never mutate input parameters

### 2. Immutable Data

```typescript
// ✅ Good: Readonly properties
interface TextBuffer {
  readonly id: string;
  readonly content: string;
}

// Update by spreading
const newBuffer = { ...oldBuffer, content: newContent };

// ❌ Bad: Mutable
interface TextBuffer {
  id: string;
  content: string;  // Mutable!
}
```

Use `readonly` keyword on all interface properties. When updating objects, use spread operator: `{ ...obj, prop: newValue }`.

### 3. Result Types (No Exceptions)

```typescript
// ✅ Good: Result type
type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

const loadConfig = (): Result<Config, string> => {
  try {
    return { ok: true, value: config };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
};

// Usage: check result
const result = loadConfig();
if (result.ok) {
  console.log(result.value);
} else {
  console.error(result.error);
}

// ❌ Bad: Exceptions
const loadConfig = () => {
  throw new Error("oops");  // Hard to recover
};
```

Avoid throwing exceptions for control flow. Instead, return Result types. This makes error handling explicit and testable.

### 4. Zod Validation

```typescript
// ✅ Good: Type-safe validation
const ConfigSchema = z.object({
  tabWidth: z.number().int().min(1).max(8),
});

const result = ConfigSchema.safeParse(userInput);
if (result.success) {
  const config = result.data;  // Type is inferred!
}
```

Use Zod for all user input, configuration, and API responses. Never skip validation.

### 5. Barrel Imports (Explicit Exports Only)

```typescript
// ✅ Good: Explicit exports in src/core/buffer/index.ts
export { createBuffer, insertText, deleteRange } from "./buffer";

// ✅ Good: Clean imports using barrel
import { insertText, createBuffer } from "~/core/buffer";

// ❌ Bad: Wildcard exports (unclear dependencies)
export * from "./buffer";

// ❌ Bad: Importing from implementation file
import { insertText } from "~/core/buffer/buffer";
```

Each import/export is traceable and tree-shakeable. You can see exactly what's exported without digging into files.

## Development Workflow

### Setup

```bash
# Install project dependencies (minimal!)
bun install

# Install global tools (via system package manager or Nix)
# Bun: https://bun.sh/docs/installation
# Biome: https://biomejs.dev/guides/getting-started/
```

### Development

```bash
# Run app (Bun handles TypeScript natively)
bun run dev

# Format code
bun run format

# Lint code
bun run lint

# Check formatting & linting without applying
bun run check
```

### Testing

```bash
# Run tests
bun test

# Watch mode
bun test --watch

# Coverage
bun test --coverage
```

### Testing the CLI

```bash
# Show help
bun src/cli/main.ts --help

# Test edit command
bun src/cli/main.ts edit --help
bun src/cli/main.ts edit --file myfile.ts

# Test plugin command
bun src/cli/main.ts plugin --help
```

**Note:** bunli will show a warning about missing `/.bunli/commands.gen.ts`. This is optional for development and can be generated with `bunli generate` if desired (adds type safety for generated command types).

### Testing TUI Apps (IMPORTANT!)

**Ctrl is a Terminal UI application. Testing requires special handling.**

**🚨 CRITICAL LLM RULE: NEVER USE `timeout` - ALWAYS USE SIGINT 🚨**

❌ **NEVER use `timeout` to kill the app**
```bash
# WRONG - Forces hard kill, leaves terminal broken
timeout 5 bun run dev
# This is true for: timeout, kill -9, or any force-kill
```

✅ **ALWAYS send SIGINT (Ctrl+C) only**
```typescript
// Correct: Spawn process and exit with SIGINT
const proc = Bun.spawn(["bun", "run", "dev"], { ... });
await new Promise(resolve => setTimeout(resolve, 3000)); // Let it initialize

// Test while running (e.g., modify config)
writeFileSync(configPath, newConfig);
await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for changes

// Exit cleanly with SIGINT
process.kill(proc.pid, "SIGINT");
await new Promise(resolve => setTimeout(resolve, 1000)); // Let cleanup run

// Now verify output
const output = readFileSync(OUTPUT_FILE, "utf-8");
```

**Why This Matters:**
- TUI apps manage terminal "raw mode" for keyboard input
- On exit, they must restore cursor, echo, and clean up OpenTUI renderer
- `timeout` forcibly kills the process → cleanup never runs → terminal broken
- `SIGINT` triggers the app's exit handler → clean terminal restoration

**When Running from CLI:**
```bash
bun run dev          # Start editor
# ... use normally ...
# Ctrl+C to exit gracefully
```

**Testing Checklist:**
- [ ] App initializes without errors
- [ ] App responds to keyboard (hjkl, Escape, Ctrl+C)
- [ ] App exits cleanly on Ctrl+C (SIGINT)
- [ ] Terminal is restored after exit (cursor visible, input echo works)
- [ ] No leftover terminal artifacts

See [testing.md](testing.md#testing-tui-terminal-ui-applications) for detailed examples.

### Building

```bash
# Build TypeScript → JavaScript
bun run build

# Create standalone executable
# See: https://bun.com/docs/bundler/executables
bun run build:binary
# Output: ./ctrl (executable for your platform)
```

## Project Structure

```
ctrl/
├── src/
│   ├── types/                  # TypeScript interfaces (no classes!)
│   │   ├── index.ts           # Core type definitions
│   │   ├── app.ts             # AppState interface
│   │   └── syntax.ts          # SyntaxToken, SyntaxHighlighting types
│   │
│   ├── core/                   # Core editor functionality
│   │   ├── buffer/            # Text buffer operations (immutable)
│   │   │   ├── buffer.ts      # Functions: insertText, deleteRange, etc
│   │   │   ├── buffer.test.ts # Tests (pure = simple testing)
│   │   │   └── index.ts       # Barrel export
│   │   │
│   │   ├── modal/             # Modal editing system (state machine)
│   │   │   ├── modal.ts       # Functions: createModalState, enterMode, etc
│   │   │   └── index.ts       # Barrel export
│   │   │
│   │   ├── commands/          # Command registry & keybind system (fully dynamic)
│   │   │   ├── keybind-executor.ts  # 25+ pure command handlers (motion, mode, edit)
│   │   │   ├── keybind-matcher.ts   # Parse keybind patterns (ctrl, shift, meta)
│   │   │   ├── registry.ts          # Command registry (extensible for plugins)
│   │   │   └── index.ts             # Barrel export
│   │   │
│   │   ├── syntax/            # Syntax highlighting
│   │   │   ├── parser.ts      # Tree-sitter integration
│   │   │   ├── parser.test.ts # Parser unit tests
│   │   │   └── index.ts       # Barrel export
│   │   │
│   │   └── index.ts           # Core barrel export
│   │
│   ├── config/                 # Configuration & validation
│   │   ├── schema.ts          # Zod schemas + syntax colors
│   │   └── index.ts           # Barrel export
│   │
│   ├── platform/              # AI platform (future)
│   ├── plugins/               # Plugin system (future)
│   ├── ui/                    # Terminal UI (OpenTUI)
│   │   ├── renderer.tsx       # React component rendering (text segments)
│   │   ├── statusBar/         # Customizable status bar system
│   │   │   ├── renderer.tsx   # StatusBar component and renderStatusBarComponent()
│   │   │   └── index.ts       # Barrel export
│   │   └── themes/            # Color schemes (Gogh integration)
│   │       ├── types.ts       # GoghTheme interface, token mapping types
│   │       ├── schemes.ts     # 5 bundled themes (dracula, nord, one-dark, etc)
│   │       ├── loader.ts      # loadCompleteTheme, color mapping functions
│   │       ├── all-gogh-schemes.ts  # 50+ Gogh schemes (lazy-loaded)
│   │       ├── ghostty.ts     # Ghostty config parser, auto-detection
│   │       ├── user-themes.ts # Load custom themes from ~/.config/ctrl/themes/
│   │       └── index.ts       # Barrel export
│   │
│   │
│   ├── cli/                   # Command-line interface (bunli)
│   │   ├── commands/          # CLI command definitions
│   │   │   ├── edit.ts        # Edit command (open file)
│   │   │   ├── plugin.ts      # Plugin command (manage plugins)
│   │   │   └── index.ts       # Barrel export
│   │   └── main.ts            # CLI entry point (bunli setup)
│   │
│   ├── main.tsx               # Application entry point
│   └── README.md              # Functional patterns guide
│
├── dist/                      # Built output (generated)
├── node_modules/              # Dependencies (Bun)
├── package.json              # Bun package config
├── tsconfig.json             # TypeScript strict config
├── biome.jsonc               # Biome format + lint config
├── bun.lock                  # Lock file (like yarn.lock)
│
├── docs/                     # Documentation (filled out!)
├── SETUP.md                  # This file
├── ARCHITECTURE.md           # Technical design
├── STRATEGY.md               # Business & marketing
├── PLUGIN_SYSTEM.md          # Plugin architecture
├── AI_INTEGRATION.md         # AI interaction design
├── README.md                 # User-facing README
└── CHANGELOG.md              # Release notes
```

## Customizable Status Bar

The status bar is fully customizable via configuration. Users can define custom components and arrange them in left/center/right zones without any code changes.

### Built-in Component Types

**Mode Indicator**
```toml
[ui.statusBar.components.mode]
type = "mode"
# Optional per-mode colors
[ui.statusBar.components.mode.colors]
normal = "#88BB22"
insert = "#22AAFF"
visual = "#FF9922"
command = "#FFFF00"
```

**File Path**
```toml
[ui.statusBar.components.filePath]
type = "filePath"
truncate = 50  # Truncate long paths to this width
```

**Cursor Position**
```toml
[ui.statusBar.components.position]
type = "position"
format = "Ln {line}, Col {col}"  # Use {line} and {col} placeholders
```

**Modified Indicator**
```toml
[ui.statusBar.components.modified]
type = "modified"
text = "[+]"
fg = "#FF6B6B"
```

**File Size**
```toml
[ui.statusBar.components.fileSize]
type = "fileSize"
format = "human"  # Options: "bytes", "kb", "human"
```

**Line Count**
```toml
[ui.statusBar.components.lineCount]
type = "lineCount"
```

**Static Text**
```toml
[ui.statusBar.components.separator]
type = "text"
text = " | "
fg = "#666666"
```

**Git Branch** (placeholder, not yet implemented)
```toml
[ui.statusBar.components.branch]
type = "gitBranch"
ifExists = false  # Only show if in git repo
```

### Layout Configuration

Define the status bar layout with left, center, and right zones:

```toml
[ui.statusBar]
enabled = true
height = 1
backgroundColor = "#1a1a1a"

# Define components (referenced by ID in layout below)
[ui.statusBar.components.mode]
type = "mode"

[ui.statusBar.components.filePath]
type = "filePath"
truncate = 50

[ui.statusBar.components.position]
type = "position"
format = "Ln {line}, Col {col}"

# Layout with three zones
[ui.statusBar.layout]
left = ["mode"]
center = ["filePath"]
right = ["position"]
```

### Adding New Component Types (for Contributors)

To add a new component type:

1. **Update schema** (`src/config/schema.ts`):
   ```typescript
   z.object({
     type: z.literal("myComponent"),
     customProp: z.string().optional(),
   })
   ```

2. **Add renderer** (`src/ui/statusBar/renderer.tsx`):
   ```typescript
   case "myComponent": {
     return {
       text: `My Output: ${state.buffer.content.length}`,
       fg: "#FFFFFF",
     };
   }
   ```

3. **Add tests** (`test/statusBar.test.ts`):
   ```typescript
   it("should render myComponent", () => {
     const result = renderStatusBarComponent("myComponent", component, state);
     expect(result.text).toBe("My Output: 17");
   });
   ```

### Implementation Details

- **Pure function rendering**: `renderStatusBarComponent()` is a pure function that takes component definition, state, and returns `{text, fg?}`
- **React layout**: `StatusBar` component uses OpenTUI flexbox to arrange zones (left aligned, center growing, right aligned)
- **Performance**: Rendering happens every keystroke, should be < 1ms per component
- **No side effects**: All component data comes from AppState, no API calls or file I/O

## Configuration

### `biome.jsonc` (Configuration for Global Biome)
- Format: 2-space indents, 100 char lines
- Lint: Recommended rules + strict checks
- TypeScript: Double quotes, trailing commas
- Organize imports: Automatic
- **Note:** Biome is installed globally, not in node_modules

### `package.json` (Already Configured!)
- `"type": "module"` - ES modules only
- Scripts for: dev, build, test, format, lint, check
- Dependencies: `zod`, `@bunli/core` only
- Dev dependencies: **none** (all tools installed globally)
- Binary entry point: `ctrl` → `dist/cli/main.js`
- **Note:** TypeScript compilation is handled natively by Bun (no tsc needed)

### `tsconfig.json` (Configuration, Not Executed!)
- Bun respects tsconfig settings for IDE support and type checking
- `strict: true` - Maximum type safety
- `noUnusedLocals: true`, `noUnusedParameters: true` - Catch unused code
- Path aliases: `@/*` → `src/*`
- **Not executed directly** - Bun compiles on the fly

### `bunli.config.ts` (Already Configured!)
- CLI name, version, description
- Commands directory: `./src/cli/commands`
- Build configuration for standalone binaries
- Auto-discovers commands from directory
- See: [bunli.dev](https://bunli.dev)

## Important Constraints to Remember

### ❌ NEVER
- Use `class` keyword
- Mutate state (use spread operators)
- Throw exceptions for control flow (use Result types)
- Use Prettier or ESLint (use Biome)
- Use Node.js APIs outside Bun compatibility
- Use higher-order functions (skip for now)

### ✅ ALWAYS
- Write pure functions
- Use `readonly` keyword
- Validate with Zod
- Return Result types instead of throwing
- Use barrel imports
- Format with Biome
- Test pure functions (no mocks needed!)

## File Size & Performance

### Target Code Metrics
- **Startup time**: < 100ms
- **Keystroke latency**: < 16ms
- **Memory**: < 100MB idle
- **Binary size**: < 50MB (with Bun executable)

### Code Quality
- **Type coverage**: 100% (strict mode)
- **Test coverage**: 70%+ overall, 100% on critical paths
- **No unused code**: Biome catches it
- **No dead imports**: Biome organizes automatically

## Troubleshooting

### `bun: command not found`
Install Bun: `curl -fsSL https://bun.sh/install | bash`
See: https://bun.sh/docs/installation

### Editor TypeScript Support
Bun handles TypeScript natively. Most editors (VS Code, Vim, etc.) support TypeScript out of the box.
- Configure your IDE to use Bun's TypeScript: See IDE integration at https://bun.sh/docs

### `Cannot find module '@/*'`
This should already be configured in `tsconfig.json` with path aliases.
Restart your IDE/editor to pick up the configuration.

### Biome formatting disagrees with my style
Biome is the authority. Don't fight it! Update `biome.jsonc` config or change your code.
See: https://biomejs.dev/reference/configuration/

### Tests failing with import errors
Make sure to use barrel imports:
- ✅ `import { func } from "~/core/buffer"`
- ❌ `import { func } from "~/core/buffer/buffer"`

### Executable won't build
Check: `bun run build:binary` output
Ensure `src/cli/main.ts` is valid entry point
See: [Bun Executable Docs](https://bun.com/docs/bundler/executables)

## References

### Core Runtime & Build Tools
- **Bun** - https://bun.sh
  - Docs: https://bun.sh/docs
  - API Reference: https://bun.sh/docs/api/
  - Bundler: https://bun.sh/docs/bundler
  - Executables: https://bun.com/docs/bundler/executables

### CLI Framework
- **bunli** - https://bunli.dev
  - CLI Framework for Bun: https://bunli.dev
  - Type-safe command definitions with Zod validation

### Runtime Type Safety
- **TypeScript** - https://www.typescriptlang.org
  - Handbook: https://www.typescriptlang.org/docs/handbook/
  - Config Reference: https://www.typescriptlang.org/tsconfig
  - Strict Mode: https://www.typescriptlang.org/tsconfig#strict

- **Zod** - https://zod.dev
  - Runtime Schema Validation: https://zod.dev
  - Documentation: https://zod.dev/?id=readme

### Code Quality & Formatting
- **Biome** - https://biomejs.dev
  - Documentation: https://biomejs.dev/
  - Linter Rules: https://biomejs.dev/linter/
  - Configuration: https://biomejs.dev/reference/configuration/

### Terminal UI (Current)
- **OpenTUI** - https://github.com/anomalyco/opentui (TypeScript + Zig, v0.1.74+)
  - Official website: https://opentui.com/
  - Monorepo with `@opentui/core`, `@opentui/react`, `@opentui/solid`
  - Proven in production: OpenCode (83.8k⭐) built on same stack
- **Tree-sitter** - https://tree-sitter.github.io/tree-sitter/

#### OpenTUI Implementation Patterns

**Setup & Rendering (`src/ui/renderer.tsx`):**
```typescript
import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";

const renderer = await createCliRenderer({
  exitOnCtrlC: false,          // Handle manually
  useKittyKeyboard: {},        // Modern keyboard protocol
});

const root = createRoot(renderer);
root.render(<AppComponent state={state} uiConfig={config} />);
```

**JSX Components:**
```typescript
// Box (flex container) with text
<box width="100%" height={1} backgroundColor="#1a1a1a">
  <text fg="#88BB22">NORMAL</text>
  <text> | main.ts</text>
</box>

// Editor view with flex layout
<box width="100%" height="100%" flexDirection="column">
  <box flexGrow={1}>{/* Content */}</box>
  <box height={1}>{/* Status bar */}</box>
</box>
```

**Keystroke Handling:**
```typescript
renderer.keyInput.on("keypress", (keyEvent: KeyEvent) => {
  const key = keyEvent.name;  // "a", "enter", "escape", etc.

  // Handle keystroke (pure function)
  const newState = handleKeystroke(currentState, key, keyEvent);

  // Re-render on state change
  if (newState !== currentState) {
    currentState = newState;
    root.render(<AppComponent state={currentState} />);
  }
});
```

**Critical Exit Sequence:**
```typescript
// MUST call renderer.destroy() then process.exit(0)
// NO setTimeout, NO Promise.race—await synchronously
try {
  await renderer.destroy?.();
} catch {
  // Ignore cleanup errors
}
process.exit(0);
```

**Performance Targets:**
- Keystroke latency: < 16ms (60fps, frame diffing handles optimization)
- Startup time: < 100ms
- Frame diffing: Automatic (only ANSI escapes for changed cells)

**For Deeper Understanding:**
```bash
# Clone to /tmp to read actual source
git clone https://github.com/anomalyco/opentui /tmp/opentui
git clone https://github.com/anomalyco/opencode /tmp/opencode

# Find rendering patterns
grep -r "createRoot" /tmp/opentui/packages/react/src/
grep -r "createCliRenderer" /tmp/opencode/src/
find /tmp/opencode/src -name "*renderer*"
```

### AI Integration
- **Anthropic SDK** - https://github.com/anthropics/anthropic-sdk-python
- **Claude API** - https://docs.anthropic.com

### Ctrl Documentation
- **Architecture:** See [../ARCHITECTURE.md](../ARCHITECTURE.md)
- **Constraints:** See [constraints.md](constraints.md)
- **Decisions:** See [decisions.md](decisions.md)
- **Plugin System:** See [plugin-system-architecture.md](plugin-system-architecture.md)
- **AI Features:** See [ai-features.md](ai-features.md)

### Learning Resources
- **Functional Programming:** https://en.wikipedia.org/wiki/Functional_programming
- **TypeScript for FP:** https://www.typescriptlang.org/docs/handbook/2/types-from-types.html
- **Result Types:** https://www.typescriptlang.org/docs/handbook/2/types-from-types.html
