# Testing Guidelines

## Philosophy

**For the Prototype (Week 1-2):**
- Focus on demonstrable features over comprehensive tests
- Write tests for core primitives (buffer operations, modal transitions, rope data structure)
- Manual testing and dogfooding take priority
- Plugin system gets smoke tests only

**For the MVP (Weeks 3-12):**
- Adopt a testing pyramid: Many unit tests, fewer integration tests, selective E2E tests
- TDD for bug fixes (write test that fails, fix bug, test passes)
- Post-code testing for new features (build → demonstrate → write tests)
- Critical paths (buffer corruption, plugin crashes, AI context building) have 100% coverage

**For v1.0:**
- 70%+ overall test coverage
- 100% coverage on critical paths (buffer, plugin sandbox, AI platform)
- All plugin APIs have integration tests
- E2E tests for core workflows

**Testing Pyramid Ratio:**
- 70% Unit tests (functions, components, buffer operations)
- 20% Integration tests (plugin API, buffer + modal interactions, AI + context)
- 10% E2E tests (editing a file, using chat plugin, syntax highlighting)

## Test Structure

### Directory Layout
```
src/
  core/
    buffer/
      buffer.ts
      buffer.test.ts        # Unit tests for Buffer class
      rope.ts
      rope.test.ts          # Rope data structure tests
    modal/
      modes.ts
      modes.test.ts         # Mode transition tests
    commands/
      registry.ts
      registry.test.ts
  platform/
    ai/
      client.ts
      client.test.ts        # AI client abstraction
      providers/
        anthropic.ts
        anthropic.test.ts    # Provider-specific tests

tests/
  integration/
    core/
      buffer-modal.test.ts  # Buffer + modal integration
      config-hot-reload.test.ts
    plugin-system/
      plugin-api.test.ts    # Plugin API contracts
      sandbox.test.ts       # Plugin isolation
    ai-platform/
      context-builder.test.ts
      streaming.test.ts

  fixtures/
    sample-files/          # Sample code files for testing
    test-configs/          # TOML configs for testing

  e2e/
    edit-file.test.ts      # Edit and save a file
    modal-navigation.test.ts
    chat-workflow.test.ts   # Open chat, ask question, verify response
    inline-completions.test.ts
```

### Naming Conventions
- Test files: `*.test.ts` (colocated with source) or in `tests/` subdirectories
- Test suites: `describe('Component/Function Name', () => { ... })`
- Test cases: `it('should [expected behavior] when [condition]', () => { ... })`
- Examples:
  - ✅ `it('should insert text at cursor position')`
  - ✅ `it('should respect rope tree balance during large insertions')`
  - ❌ `it('works')`

## Running Tests

### Commands
```bash
bun test                    # All tests (watch mode by default)
bun test --no-watch        # Run once and exit
bun test --coverage        # With coverage report
bun test src/core/buffer   # Only buffer tests
bun test --filter="rope"   # Fuzzy match "rope" tests
```

### CI/CD
- **Pre-commit hook**: No (but can add in post-MVP)
- **Pull request**: Yes, tests must pass
- **Before deployment**: Yes, full test suite blocks main branch merge
- **GitHub Actions**: Run on every push to main/develop, on PRs

## Testing TUI (Terminal UI) Applications

**CRITICAL:** Ctrl is a TUI app, not a standard program. Testing requires special handling.

### How to Exit the App Correctly

❌ **DON'T use `timeout` command**
```bash
# WRONG - Will forcibly kill after N seconds, leaving terminal broken
timeout 5 bun run dev
```

✅ **DO send SIGINT (Ctrl+C) to let the app exit gracefully**
```bash
# RIGHT - Allows the app's exit handler to run
process.kill(proc.pid, "SIGINT");
await new Promise(r => setTimeout(r, 1000)); // Give it time to cleanup
```

### Why This Matters

TUI apps like Ctrl manage the terminal in "raw mode" (for keyboard input). On exit, they must:
1. Disable raw mode
2. Restore cursor position and visibility
3. Clean up OpenTUI renderer

**Sending SIGINT triggers the cleanup:**
```typescript
// src/ui/renderer.tsx - Exit sequence
renderer.keyInput.on("keypress", (keyEvent: KeyEvent) => {
  if ((keyEvent.ctrl && (key === "c" || key === "d")) || key === "q") {
    shouldExit = true;  // ← SIGINT sets this
    return;
  }
});

// Then cleanup runs:
try {
  await renderer.destroy?.();  // Restore terminal state
} catch {
  // Ignore cleanup errors
}
process.exit(0);
```

**If you use `timeout`**, the process dies without running cleanup, leaving the terminal in a broken state (no input echo, broken cursor, etc.).

### Testing Pattern for TUI Apps

```typescript
// ✅ CORRECT: Spawn process, test while running, exit with SIGINT
const proc = Bun.spawn(["bun", "run", "dev"], {
  stdout: "pipe",
  stderr: "pipe",
});

// Wait for app to initialize
await new Promise(resolve => setTimeout(resolve, 3000));

// Test while app is running (e.g., modify config file)
writeFileSync(configPath, modifiedConfig);
await new Promise(resolve => setTimeout(resolve, 2000));

// Exit cleanly with SIGINT
process.kill(proc.pid, "SIGINT");
await new Promise(resolve => setTimeout(resolve, 1000));

// Now read captured output for verification
const output = readFileSync(OUTPUT_FILE, "utf-8");
// Assert on output
```

### Testing Checklist for TUI Features

- [ ] App starts and renders without errors
- [ ] App responds to keyboard input (hjkl, Escape, Ctrl+C)
- [ ] App exits cleanly on Ctrl+C, Ctrl+D, or 'q' (no terminal artifacts)
- [ ] Terminal is restored to normal state after exit (cursor visible, input echo on)
- [ ] Config hot-reload works (file changes detected and applied while running)
- [ ] No debug output corrupts terminal rendering

## Coverage Requirements

### Targets (Progressive)

**Prototype (Week 2):**
- Core buffer operations: 80%+
- Modal system: 70%+
- Config loader: 70%+
- Critical paths: 100%

**MVP (3 months):**
- Overall coverage: 60%+
- Critical paths (buffer, modal, plugin sandbox, AI context): 100%
- Plugin API: 80%+
- New code: 100% (before merge)

**v1.0 (6 months):**
- Overall coverage: 70%+
- Critical paths: 100%
- Excluded code (types, config, test helpers): tracked separately

### Critical Paths (Must Be 100%)
- `buffer/rope.ts` - Rope insertion/deletion
- `modal/transitions.ts` - Mode changes
- `plugins/sandbox.ts` - Plugin isolation
- `platform/ai/client.ts` - AI request/response handling
- `core/commands/registry.ts` - Command execution (no crashes)

### Exclusions
- Type definitions (`*.d.ts`)
- Configuration files (`*.toml`)
- Test utilities and fixtures
- Generated code (syntax highlighting grammars, etc.)
- CLI help text and messages

## Writing Tests

### Unit Tests

**What to test:**
- Individual functions/methods (rope insertions, cursor movements, command execution)
- Immutable operations (buffer state doesn't leak)
- Edge cases (empty buffers, large files, unicode)
- Error handling (invalid parameters, out of bounds)

**Example:**
```typescript
import { describe, it, expect } from 'bun:test';
import { Buffer } from './buffer';
import { Rope } from './rope';

describe('Rope', () => {
  it('should insert text at position', () => {
    const rope = new Rope('hello');
    rope.insert(5, ' world');
    expect(rope.toString()).toBe('hello world');
  });

  it('should delete text range', () => {
    const rope = new Rope('hello world');
    rope.delete(5, 11);
    expect(rope.toString()).toBe('hello');
  });

  it('should handle unicode correctly', () => {
    const rope = new Rope('café');
    expect(rope.length).toBe(4);
    rope.insert(3, 's');
    expect(rope.toString()).toBe('cafés');
  });

  it('should maintain balance after many inserts', () => {
    const rope = new Rope('');
    for (let i = 0; i < 1000; i++) {
      rope.insert(rope.length, `line ${i}\n`);
    }
    expect(rope.length).toBeGreaterThan(5000);
    expect(rope.height).toBeLessThan(15); // Log(n) height
  });

  it('should throw on out-of-bounds delete', () => {
    const rope = new Rope('hello');
    expect(() => rope.delete(0, 100)).toThrow();
  });
});

describe('Buffer', () => {
  it('should track cursor position', () => {
    const buf = new Buffer('hello\nworld');
    buf.setCursor(0, 0);
    expect(buf.cursor).toEqual({ line: 0, col: 0 });
    buf.moveRight();
    expect(buf.cursor).toEqual({ line: 0, col: 1 });
  });

  it('should not expose internal state mutations', () => {
    const buf = new Buffer('hello');
    const cursor1 = buf.cursor;
    buf.moveRight();
    expect(cursor1).toEqual({ line: 0, col: 0 }); // Original unchanged
  });
});
```

### Integration Tests

**What to test:**
- Plugin API contracts (plugins can register commands, access workspace)
- Buffer + Modal system interactions (editing in different modes)
- AI platform with mock providers
- Config loading + hot-reload triggers
- Command execution through registry

**Example:**
```typescript
import { describe, it, expect } from 'bun:test';
import { PluginHost } from './plugin-host';
import { createMockContext } from '../test-utils';

describe('Plugin API', () => {
  it('should allow plugin to register command', async () => {
    const host = new PluginHost();
    const context = createMockContext();

    // Simulate plugin activation
    context.commands.register('my-command', async () => {
      return 'success';
    });

    const result = await host.executeCommand('my-command');
    expect(result).toBe('success');
  });

  it('should enforce permissions on filesystem access', async () => {
    const host = new PluginHost();
    const context = createMockContext({ permissions: { filesystem: 'denied' } });

    expect(() => {
      context.workspace.readFile('/etc/passwd');
    }).toThrow('Permission denied: filesystem');
  });
});

describe('Buffer + Modal Integration', () => {
  it('should exit insert mode on Escape', () => {
    const buffer = new Buffer('hello');
    const modal = new ModalSystem(buffer);

    modal.enter('insert');
    expect(modal.currentMode).toBe('insert');

    modal.handle('Escape');
    expect(modal.currentMode).toBe('normal');
  });

  it('should undo multi-character insert as single operation', () => {
    const buffer = new Buffer('');
    const modal = new ModalSystem(buffer);

    modal.enter('insert');
    modal.handle('a'); // Insert "a"
    modal.handle('b'); // Insert "b"
    modal.handle('c'); // Insert "c"

    expect(buffer.text).toBe('abc');
    buffer.undo();
    expect(buffer.text).toBe(''); // All 3 chars undone as one
  });
});
```

### E2E Tests

**What to test:**
- Critical workflows (start editor, edit file, save)
- Plugin interactions (activate plugin, use its features)
- AI features (chat, completions, context building)

**Tools:** Custom TUI test harness (no Playwright - it's terminal, not browser)

**Example:**
```typescript
import { EditorSession } from '../test-utils';

describe('E2E: Edit and Save', () => {
  it('should edit a file and save it', async () => {
    const session = new EditorSession();

    // Open a file
    await session.command('edit tests/fixtures/sample.ts');

    // Type some text
    session.key('i'); // Enter insert mode
    session.type('console.log("hello");');
    session.key('Escape'); // Exit insert mode

    // Save
    session.key(':');
    session.type('w');
    session.key('Enter');

    const saved = await session.readFile('tests/fixtures/sample.ts');
    expect(saved).toContain('console.log("hello");');

    session.close();
  });
});

describe('E2E: AI Chat', () => {
  it('should open chat and ask a question', async () => {
    const session = new EditorSession({
      mockAI: { provider: 'mock', responses: ['This is a test response'] }
    });

    // Open chat
    session.key('<leader>'); // Leader key
    session.key('a');
    session.key('c'); // ai_chat_toggle

    expect(session.panelVisible('chat')).toBe(true);

    // Ask a question
    session.type('What does this function do?');
    session.key('Enter');

    const response = await session.waitFor('response', 2000);
    expect(response).toContain('test response');
  });
});
```

## Mocking Strategy

### When to Mock
- **External APIs** (Claude, OpenAI): Always mock in unit/integration tests
- **File system**: Use in-memory or temp files; avoid hitting real disk in most tests
- **Time/dates**: Mock `Date.now()` for deterministic tests
- **Network**: Mock HTTP calls (no real API calls in tests)
- **Terminal rendering**: Mock OpenTUI rendering for unit tests

### How to Mock
- **AI providers**: Create mock provider implementing `AIProvider` interface
- **File system**: Use `memfs` or temp directories
- **Functions**: Bun's `mock()` function or manual test doubles
- **Time**: Use `beforeEach()` to mock `Date.now()`

**Example:**
```typescript
import { mock } from 'bun:test';

describe('AI Platform', () => {
  it('should stream response from mock provider', async () => {
    const mockProvider = {
      name: 'mock',
      models: ['test-model'],
      async *stream(messages) {
        yield { type: 'content_block_start', content_block: { type: 'text', text: '' } };
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } };
        yield { type: 'message_stop' };
      }
    };

    const client = new AIClient(mockProvider);
    const response = await client.streamComplete([{ role: 'user', content: 'Hi' }]);

    let text = '';
    for await (const chunk of response) {
      text += chunk;
    }
    expect(text).toBe('Hello');
  });
});
```

## Test Data

### Fixtures
- Location: `tests/fixtures/`
- Format: Real files (sample code, config files) to test realistic scenarios
- Examples:
  - `tests/fixtures/sample.ts` - TypeScript file for testing syntax highlighting
  - `tests/fixtures/large-file.js` - 10MB file for performance testing
  - `tests/fixtures/test-config.toml` - Valid/invalid configs for testing loader

### Factories
```typescript
// tests/fixtures/builders.ts
import { faker } from '@faker-js/faker'; // or equivalent

export function createFile(overrides = {}) {
  return {
    path: faker.system.filePath(),
    content: faker.lorem.paragraph(),
    ...overrides
  };
}

export function createBuffer(content = 'hello') {
  return new Buffer(content);
}

export function createConfig(overrides = {}) {
  return {
    editor: { lineNumbers: true, tabWidth: 2 },
    keymaps: { normal: { 'h': 'move_left' } },
    ...overrides
  };
}
```

## Testing Utilities

### Custom Matchers
```typescript
// tests/matchers.ts
import { expect } from 'bun:test';

// Check if rope height is balanced
expect.extend({
  toBeBalanced(received: Rope) {
    const maxHeight = Math.ceil(Math.log2(received.length)) + 2;
    const pass = received.height <= maxHeight;
    return {
      pass,
      message: () => `Expected rope to be balanced, got height ${received.height}, max ${maxHeight}`
    };
  }
});
```

### Helpers
```typescript
// tests/test-utils.ts
import { Buffer } from '../src/core/buffer';
import { ModalSystem } from '../src/core/modal';

export function createEditorState(text = '') {
  const buffer = new Buffer(text);
  const modal = new ModalSystem(buffer);
  return { buffer, modal };
}

export function createMockContext(overrides = {}) {
  return {
    commands: new CommandRegistry(),
    workspace: new MockWorkspace(),
    window: new MockWindow(),
    permissions: { filesystem: 'allow', network: 'allow', ...overrides.permissions },
    ...overrides
  };
}

export async function waitFor(condition: () => boolean, timeout = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (condition()) return true;
    await new Promise(r => setTimeout(r, 10));
  }
  throw new Error('waitFor timeout');
}
```

## Common Patterns

### Async Testing
```typescript
describe('AI Client', () => {
  it('should stream response from provider', async () => {
    const client = new AIClient(mockProvider);
    const stream = client.streamComplete([...]);

    let result = '';
    for await (const chunk of stream) {
      result += chunk;
    }

    expect(result).toContain('expected text');
  });

  it('should handle provider timeout', async () => {
    const slowProvider = {
      async *stream() {
        await new Promise(r => setTimeout(r, 10000));
      }
    };

    const client = new AIClient(slowProvider, { timeout: 100 });

    expect(async () => {
      for await (const _ of client.streamComplete([...])) {}
    }).rejects.toThrow('timeout');
  });
});
```

### Error Testing
```typescript
describe('Buffer', () => {
  it('should throw on invalid line number', () => {
    const buf = new Buffer('hello');
    expect(() => buf.setCursor(100, 0)).toThrow('Line number out of bounds');
  });

  it('should give helpful error for malformed config', async () => {
    const error = await expect(() => loadConfig('invalid.toml'))
      .toThrow(/TOML parse error/);
    expect(error.message).toContain('line 3');
  });
});
```

### Terminal UI Testing
```typescript
describe('Modal System', () => {
  it('should display mode indicator', () => {
    const editor = createEditorState('hello');
    expect(editor.modal.currentMode).toBe('normal');
    expect(editor.modal.getStatusBarText()).toContain('NORMAL');

    editor.modal.enter('insert');
    expect(editor.modal.getStatusBarText()).toContain('INSERT');
  });
});
```

## Performance Testing
[TODO: If applicable]
- Load testing: [tools, when to run]
- Benchmarking: [what to measure]

## Debugging Tests

### Failed Tests
[TODO: How to debug]
```bash
npm test -- --verbose
npm test -- --no-coverage  # Faster runs
npm test -- --runInBand     # Sequential execution
```

### VS Code Integration
[TODO: IDE setup if relevant]
- Use Jest extension
- Breakpoints work in debug mode

## Best Practices

### Do's
- **Write descriptive test names**: `it('should undo multi-char insert as single operation')`
- **Test behavior, not implementation**: Test that rope is balanced, not its internal structure
- **Keep tests independent**: Each test should be runnable in isolation, in any order
- **Use arrange-act-assert pattern**: Setup → Execute → Verify
- **Test edge cases**: Empty buffer, huge files, unicode, concurrent operations
- **Mock external dependencies**: Mock AI, file system, time
- **Test error paths**: What happens when AI call fails? Plugin crashes?
- **Make assertions specific**: `expect(rope.height).toBeLessThan(15)` not just `expect(rope).toBeTruthy()`

### Don'ts
- **Don't test framework code**: Trust Bun's test framework; don't write tests for `expect()`
- **Don't share state between tests**: Use `beforeEach()` to reset, not shared variables
- **Don't make tests dependent**: Test B shouldn't require Test A to run first
- **Don't over-mock**: Mock external APIs, but not your own functions (test the integration)
- **Don't test implementation details**: Don't assert on tree structure; assert on behavior
- **Don't ignore flaky tests**: Fix or skip them, don't let them red-herring the suite
- **Don't write tests without purpose**: Skip tests for obvious code (getters, simple setters)

## Performance Testing

For Ctrl, performance testing is critical (< 16ms keystroke latency, < 100ms startup):

```typescript
describe('Performance', () => {
  it('should insert 10k characters in < 100ms', () => {
    const rope = new Rope('');
    const start = performance.now();

    for (let i = 0; i < 10000; i++) {
      rope.insert(rope.length, 'x');
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('should render keystroke within 16ms', () => {
    // Simulate keystroke → buffer update → render
    const buffer = new Buffer('hello');
    const start = performance.now();

    buffer.insert(0, 'a');
    // (Rendering would happen here in real editor)

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(16);
  });
});
```

## For LLMs

When generating tests:
- Follow existing test patterns in the codebase
- Use descriptive test names that explain what's being tested
- Include edge cases and error scenarios
- Mock external dependencies appropriately
- Ensure tests are deterministic (no random data, fixed dates)
- Add comments for complex test setup
