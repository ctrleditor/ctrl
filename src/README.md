# Ctrl Editor - Source Code Guide

This codebase uses **functional programming exclusively**. No classes, no OOP.

## Architecture Overview

```
src/
├── core/                 # Core editor functionality
│   ├── buffer/          # Text buffer operations (immutable)
│   ├── modal/           # Modal editing system (state machine)
│   └── commands/        # Command registry (pure functions)
├── platform/            # AI platform (future)
├── plugins/             # Plugin system (future)
├── config/              # Configuration & validation (Zod)
├── types/               # TypeScript type definitions
├── ui/                  # Terminal UI (future)
├── cli/                 # Command-line interface
└── main.tsx             # Application entry point
```

## Core Principles

### 1. Pure Functions Only

Every function in the core should be **pure**: same inputs → same outputs, no side effects.

✅ **Good:**
```typescript
const insertText = (buffer: TextBuffer, pos: Position, text: string): TextBuffer => {
  return { ...buffer, content: newContent };
};
```

❌ **Bad:**
```typescript
// Mutates state
const insertText = (buffer: TextBuffer, text: string) => {
  buffer.content += text;  // NO! This mutates
};

// Has side effects
const insertText = (buffer: TextBuffer, text: string): TextBuffer => {
  console.log("Inserting");  // Side effect
  sendAnalytics();           // Side effect
  return { ...buffer, content: newContent };
};
```

### 2. Immutability

All data structures are **immutable**. Use `readonly` keyword extensively.

```typescript
// ✅ Good: readonly properties
interface TextBuffer {
  readonly id: string;
  readonly content: string;
  readonly isDirty: boolean;
}

// Update by creating new object
const newBuffer = { ...oldBuffer, content: updatedContent };

// ✅ Good: readonly arrays
function processLines(buffer: TextBuffer, lines: readonly string[]): string[] {
  return lines.map(line => line.toUpperCase());
}
```

### 3. No Classes - Use Interfaces + Functions

TypeScript interfaces define **types**, not classes.

```typescript
// ✅ Good: Interface + functions
interface User {
  readonly id: string;
  readonly name: string;
}

const createUser = (id: string, name: string): User => ({ id, name });
const getName = (user: User): string => user.name;

// ❌ Bad: Class definition
class User {
  id: string;
  name: string;
  constructor(id, name) { this.id = id; this.name = name; }
  getName() { return this.name; }
}
```

### 4. Validation with Zod

All external input (config files, API responses, user input) must be validated.

```typescript
import { z } from "zod";

const ConfigSchema = z.object({
  editor: z.object({
    tabWidth: z.number().int().min(1).max(8),
    insertSpaces: z.boolean(),
  }),
});

const validateConfig = (data: unknown) => {
  const result = ConfigSchema.safeParse(data);
  if (result.success) {
    return { ok: true, value: result.data };
  } else {
    return { ok: false, error: result.error.errors };
  }
};
```

### 5. Error Handling with Result Types

Instead of throwing exceptions, use discriminated unions (Result types).

```typescript
type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

const saveFile = (path: string, content: string): Result<void, string> => {
  try {
    fs.writeFileSync(path, content);
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
};

// Usage: check result before proceeding
const result = saveFile("file.ts", "code");
if (result.ok) {
  console.log("Saved!");
} else {
  console.error("Error:", result.error);
}
```

## Patterns & Examples

### Buffer Operations

All buffer operations return a **new buffer**, never mutate the original.

```typescript
// ✅ Correct: Returns new buffer
const modified = insertText(buffer, position, "text");
console.log(buffer.content);      // Unchanged
console.log(modified.content);    // Updated
```

### Modal System

Modal state is a **simple state machine**. Transitions are pure functions.

```typescript
// Create initial state
let state = createModalState();  // { currentMode: "normal", ... }

// Transition to new mode
state = enterMode(state, "insert");

// Back to normal
state = exitMode(state);
```

### Commands

Commands are **pure functions** registered in a registry.

```typescript
interface Command {
  readonly id: string;
  readonly handler: (context: CommandContext) => Promise<void> | void;
}

// Registration is pure (returns new registry)
const registry = registerCommand(
  oldRegistry,
  "move_left",
  async (context) => {
    console.log("Moving left from", context.position);
  }
);
```

## Module Organization

### Explicit Imports and Exports

All imports and exports are **explicit**. No wildcard imports (`import *`).

✅ **Good: Explicit imports**
```typescript
import { createBuffer, insertText } from "@/core/buffer";
import type { TextBuffer, Position } from "@/types";
```

✅ **Good: Explicit exports in index.ts**
```typescript
// src/core/buffer/index.ts
export { createBuffer, insertText, deleteRange } from "./buffer";
```

❌ **Bad: Wildcard imports**
```typescript
import * from "@/core/buffer";  // Unclear what's imported
export * from "./buffer";       // Unclear what's exported
```

### Barrel Exports (index.ts)

Each module uses an `index.ts` file with explicit named exports:

```
src/core/
├── buffer/
│   ├── buffer.ts         (implementations)
│   └── index.ts          (explicit exports)
├── modal/
│   ├── modal.ts          (implementations)
│   └── index.ts          (explicit exports)
└── index.ts              (re-exports from submodules)
```

This makes dependencies **traceable and tree-shakeable**.

## CLI with bunli

The CLI uses **bunli** ([bunli.dev](https://bunli.dev)) for type-safe command handling.

### Command Definition

Commands are defined using `defineCommand` with Zod schemas:

```typescript
// src/cli/commands/edit.ts
import { defineCommand, option } from "@bunli/core";
import { z } from "zod";

export default defineCommand({
  name: "edit",
  description: "Open file in editor",
  options: {
    file: option(z.string().optional(), {
      description: "File to open",
      short: "f",
    }),
  },
  handler: async ({ flags }) => {
    const file = flags.file as string | undefined;
    if (!file) {
      console.error("No file specified");
      process.exit(1);
    }
    console.log(`Opening: ${file}`);
  },
});
```

### Command Export

Commands are exported from `src/cli/commands/index.ts`:

```typescript
export { default as edit } from "./edit";
export { default as plugin } from "./plugin";
```

**Benefits:**
- Zero manual argument parsing
- Zod validation for all options
- Type inference for flags
- Automatic `--help` and `--version`
- Built for Bun

## Testing

Testing pure functions is **straightforward**. No mocking needed.

```typescript
describe("insertText", () => {
  it("should insert text at position", () => {
    const buffer = createBuffer("id", "file.ts", "hello", "typescript");
    const result = insertText(buffer, { line: 0, column: 5 }, " world");

    expect(result.content).toBe("hello world");
    expect(buffer.content).toBe("hello");  // Original unchanged
  });
});
```

## Running the Code

### Development
```bash
bun run dev
```

### Build
```bash
bun run build
```

### Build Binary (Bun executable)
```bash
# See: https://bun.com/docs/bundler/executables
bun run build:binary
```

### Format & Lint (Biome only, no tsc/prettier/eslint)
```bash
bun run format   # Format code with Biome
bun run lint     # Lint code with Biome
bun run check    # Check formatting and linting (no changes)
```

### Tests
```bash
bun test
bun test --watch
bun test --coverage
```

## Key Files

- **src/types/index.ts** - All TypeScript interfaces and type definitions
- **src/core/buffer/buffer.ts** - Immutable buffer operations
- **src/core/modal/modal.ts** - Modal state machine
- **src/core/commands/registry.ts** - Command registration and execution
- **src/config/schema.ts** - Configuration validation with Zod
- **src/main.tsx** - Application entry point

## Dependency Injection Pattern

Since there are no classes, we use **pure functions** with explicit parameters:

```typescript
// ❌ Bad: Hidden dependencies (implicit)
const deleteBuffer = () => {
  fileSystem.delete(currentBuffer.path);  // Where did fileSystem come from?
};

// ✅ Good: Explicit dependencies (dependency injection)
const deleteBuffer = (fs: FileSystem, buffer: TextBuffer): Result<void, string> => {
  return fs.delete(buffer.path);
};

// Usage
const result = deleteBuffer(fileSystem, buffer);
```

## Migration from Existing Code

When refactoring existing code to be functional:

1. **Remove classes** → Use interfaces + functions
2. **Make data immutable** → Use `readonly`, spread operators (`{ ...obj }`)
3. **Move side effects to boundaries** → Keep functions pure
4. **Add validation** → Use Zod schemas
5. **Use Result types** → No throwing exceptions
6. **Add tests** → Easy with pure functions!

## Common Mistakes to Avoid

### ❌ Mutating objects
```typescript
const buffer = createBuffer(...);
buffer.content += "text";  // NO!
```

### ✅ Creating new objects
```typescript
const newBuffer = { ...buffer, content: buffer.content + "text" };
```

---

### ❌ Side effects in pure functions
```typescript
const insertText = (buffer, text) => {
  saveToDatabase();  // Side effect!
  return { ...buffer, content: buffer.content + text };
};
```

### ✅ Keep functions pure
```typescript
const insertText = (buffer, text) => {
  return { ...buffer, content: buffer.content + text };
};

// Call side effects at boundaries
const result = insertText(buffer, text);
if (result.ok) saveToDatabase();
```

---

### ❌ Exceptions for control flow
```typescript
try {
  const result = loadConfig();
  // What's the type of result?
} catch (e) {
  console.error(e);
}
```

### ✅ Use Result types
```typescript
const result = loadConfig();
if (result.ok) {
  // result.value is typed
} else {
  // result.error is typed
}
```

## Resources

- **Functional Programming:** https://www.typescriptlang.org/docs/handbook/
- **Zod validation:** https://zod.dev
- **Bun docs:** https://bun.sh/docs
- **TypeScript best practices:** https://www.typescriptlang.org/docs/handbook/declaration-files/
