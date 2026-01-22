# Ctrl: Project-Specific Constraints & Patterns

> **Purpose:** Practical do's and don'ts for Ctrl development, derived from deep analysis of OpenTUI and OpenCode source code. These are lessons learned from production codebases running the same architecture.

## A. Performance Constraints (Hard Limits from Architecture)

### A.1 Rendering Performance: < 16ms Frame Time (60 FPS)

**Constraint:** Every keystroke must produce a new frame rendered and displayed within 16ms.

**What we learned from OpenCode/OpenTUI:**
- OpenTUI achieves this via frame diffing (only send ANSI sequences for changed cells)
- Current Ctrl implementation sends full React tree on every change
- OpenCode hit this wall with O(n) rope traversal at 100%+ CPU during streaming

**What to do:**
```typescript
// ✅ GOOD: Measure rendering time
const startRender = performance.now();
const frame = renderComponent();
const elapsed = performance.now() - startRender;
if (elapsed > 16) {
  console.warn(`Slow render: ${elapsed.toFixed(2)}ms`);
}
```

```typescript
// ✅ GOOD: Cache expensive calculations
// Don't recalculate virtual line positions on every frame
const virtualLines = useMemo(() => calculateVirtualLines(buffer), [buffer]);
```

**What NOT to do:**
```typescript
// ❌ BAD: O(n) traversals on every render
function renderBuffer(buffer: TextBuffer) {
  buffer.rope.walkNode((node) => {  // RECURSIVE on every frame!
    // Process every node in tree
  });
}
```

```typescript
// ❌ BAD: Send entire buffer on every keystroke
// Current React pattern does this implicitly
// If you see sustained high CPU, this is likely the cause
```

**How to detect violations:**
- Run keystroke performance test: Type 100 characters rapidly
- Check CPU usage: Should stay < 20%, not 100%
- Profile rendering: `bun run perf` or Chrome DevTools

**Mitigation if performance degrades:**
1. Implement viewport-based rendering (only render visible lines)
2. Cache virtual line calculations and invalidate selectively
3. Batch multiple edits before re-rendering (debounce)
4. Consider frame diffing at ANSI output level

---

### A.2 Keystroke Latency: < 16ms Input-to-Render

**Constraint:** Time from keyboard event received to new frame displayed must be < 16ms.

**Breakdown:**
```
Keyboard event arrives (0ms)
  ↓ (< 2ms) Parse keystroke
  ↓ (< 2ms) Update state (buffer/cursor)
  ↓ (< 10ms) Render component tree
  ↓ (< 2ms) Output ANSI sequences
Frame displayed (< 16ms total)
```

**What to do:**
- Profile with actual keyboard input (not synthetic)
- Test with Vim keybindings (mode switching adds latency)
- Measure with external tools: `xte` (Linux), keyboard event logging

**What NOT to do:**
- Don't use `setTimeout` in keystroke handlers (introduces 1-4ms delay)
- Don't process all open files on every keystroke
- Don't rebuild entire AST on every character (that's LSP's job)

---

### A.3 Startup Time: < 100ms

**Constraint:** Time from `ctrl` invocation to editor responsive must be < 100ms.

**Breakdown:**
```
Program start (0ms)
  ↓ (< 20ms) Parse CLI arguments with bunli
  ↓ (< 20ms) Load config from ~/.config/ctrl/config.toml
  ↓ (< 30ms) Open and read file
  ↓ (< 15ms) Initialize OpenTUI renderer
  ↓ (< 15ms) First render
Editor responsive (< 100ms total)
```

**What to do:**
```typescript
// ✅ GOOD: Lazy-load plugins and features
const plugins = await loadPluginsAsync();  // Don't block startup
const syntaxHighlighter = await loadSyntaxHighlighterAsync();
```

**What NOT to do:**
```typescript
// ❌ BAD: Load all plugins synchronously at startup
const plugins = loadAllPlugins();  // Blocks editor until done
```

**Monitoring:**
```bash
time ctrl /tmp/test.txt
# Should show < 100ms total time
```

---

## B. State Management Constraints

### B.1 Modal State: Always Immutable, Never Mutate

**Constraint:** All state transitions must be pure functions returning new objects.

**Why:** Vim users expect predictable mode behavior. Mutable state causes mysterious bugs with mode switching.

**What to do:**
```typescript
// ✅ GOOD: Pure function returning new state
const enterInsertMode = (modal: ModalState): ModalState => ({
  ...modal,
  currentMode: 'insert',
  cursorStyle: 'line'  // Change cursor style
});

// Use it:
const newModal = enterInsertMode(currentModal);
setState(newModal);
```

**What NOT to do:**
```typescript
// ❌ BAD: Mutating state
currentModal.currentMode = 'insert';  // NO!
currentModal.cursorStyle = 'line';

// This causes bugs when code is refactored or optimized
// React's rendering assumptions break
```

**Testing immutability:**
```typescript
const before = { ...modalState };
const after = enterInsertMode(modalState);
expect(before).toEqual(modalState);  // Original unchanged
expect(after).not.toEqual(modalState);  // New object
```

---

### B.2 Buffer State: Use Rope Data Structure for Large Files

**Constraint:** Text buffers must support O(log n) insertions/deletions for files 100MB+.

**Why learned from OpenCode:**
- Gap buffer approach is O(n) for insertions
- Array of lines requires copying entire strings
- Rope (tree of string segments) is O(log n)

**Current state:**
- Ctrl implements buffer with rope data structure ✅

**What to do:**
```typescript
// ✅ GOOD: Rope structure for efficient edits
interface TextBuffer {
  readonly rope: Rope;  // Tree-based string structure
  readonly cursor: Position;
}

// Insertion is O(log n)
const newBuffer = insertText(buffer, position, "new text");
```

**What NOT to do:**
```typescript
// ❌ BAD: String concatenation for every edit
buffer.content = buffer.content.slice(0, pos) + "new" + buffer.content.slice(pos);
// O(n) operation on every keystroke
```

**Monitoring rope health:**
```typescript
// After large insertions, verify tree is balanced
expect(rope.height).toBeLessThan(Math.ceil(Math.log2(rope.length)) + 2);
```

---

### B.3 LSP Diagnostics: Bounded Buffer with Circular Replacement

**Constraint:** Diagnostics from LSP must not accumulate unbounded in memory.

**Why learned from OpenCode:**
- Long editing sessions accumulate LSP diagnostics
- Old diagnostics never cleaned up
- Memory usage grows throughout session

**What to do:**
```typescript
// ✅ GOOD: Keep only recent diagnostics
const diagnosticsMap = new Map<string, Diagnostic[]>();
const maxDiagnosticsPerFile = 100;  // Circular buffer

function addDiagnostic(file: string, diagnostic: Diagnostic) {
  const list = diagnosticsMap.get(file) || [];
  if (list.length >= maxDiagnosticsPerFile) {
    list.shift();  // Remove oldest
  }
  list.push(diagnostic);
  diagnosticsMap.set(file, list);
}
```

**What NOT to do:**
```typescript
// ❌ BAD: Accumulate diagnostics indefinitely
const allDiagnostics: Diagnostic[] = [];  // Growing list
function addDiagnostic(diagnostic: Diagnostic) {
  allDiagnostics.push(diagnostic);  // Never removed
}
```

**Monitoring:**
- Log diagnostics count after each LSP update
- Alert if count exceeds threshold for file size

---

## C. Configuration Management Constraints

### C.1 Config Hot-Reload: File Watch → Event → Update

**Constraint:** Changes to `~/.config/ctrl/config.toml` must apply without restarting editor.

**Current status:** ⚠️ File watcher implemented but not working
- Watcher is created but not firing events on file changes
- Or events firing but not triggering re-render

**What to do:**
```typescript
// ✅ GOOD: Event-driven config reload pattern
// 1. Watch file for changes
watchFile('~/.config/ctrl/config.toml', () => {
  // 2. Emit event
  configEmitter.emit('config:changed');
});

// 3. Subscribe to event
configEmitter.on('config:changed', async () => {
  // 4. Re-parse config
  const newConfig = await loadConfig();

  // 5. Validate it
  const validated = ConfigSchema.parse(newConfig);

  // 6. Update editor state
  setConfig(validated);

  // 7. Trigger full re-render
  requestRender();
});
```

**Debugging checklist for config hot-reload:**
```typescript
// Add logging to isolate the issue
watchFile(configPath, (eventType, filename) => {
  console.log(`File changed: ${filename}, event: ${eventType}`);  // Is this firing?

  configEmitter.emit('config:changed');
});

configEmitter.on('config:changed', () => {
  console.log('Event received');  // Is this being heard?

  const config = loadConfig();
  console.log('Config loaded', config);  // Does it parse?

  const validated = ConfigSchema.parse(config);
  console.log('Config validated', validated);  // Valid?

  setConfig(validated);
  console.log('Config state updated');  // State changed?

  requestRender();
  console.log('Render requested');  // Did we trigger re-render?
});
```

**What NOT to do:**
```typescript
// ❌ BAD: Just reload config, don't update state
watchFile(configPath, () => {
  configFile = readConfigFile();  // Loaded but not used
  // No state update, no re-render → appears broken
});
```

---

### C.2 Config Validation: Zod, Not Manual Parsing

**Constraint:** All configuration must be validated with Zod before use.

**Why:** Type-safe at runtime, helpful error messages, catches typos early.

**What to do:**
```typescript
// ✅ GOOD: Zod schema validation
const ConfigSchema = z.object({
  editor: z.object({
    tabWidth: z.number().int().min(1).max(8),
    lineNumbers: z.boolean().default(true),
  }),
  keybindings: z.record(z.string(), z.string()).optional(),
});

const result = ConfigSchema.safeParse(loadedConfig);
if (!result.success) {
  // User-friendly error message
  console.error(`Config error: ${result.error.message}`);
  return defaultConfig;
}
```

**What NOT to do:**
```typescript
// ❌ BAD: Manual validation
const config = loadConfig();
if (config.tabWidth && typeof config.tabWidth === 'number') {
  // Manual checks scattered everywhere
  // No type inference
  // Inconsistent error handling
}
```

---

## D. AI Integration Constraints (Phase 2)

### D.1 Streaming Responses: One Event Per AI Delta

**Constraint:** Each AI streaming event must be a discrete unit with no ordering assumptions.

**Why learned from OpenCode:**
- LiteLLM → AWS Bedrock sends events out of order sometimes
- Out-of-order events break assumption of incremental concatenation
- Need explicit handling for out-of-order events

**What to do:**
```typescript
// ✅ GOOD: Handle events flexibly
interface StreamEvent {
  readonly sequence?: number;  // Optional sequence for sorting
  readonly timestamp: number;
  readonly type: 'text_delta' | 'tool_call' | 'tool_result';
  readonly content: string;
}

function processStreamEvents(events: StreamEvent[]) {
  // Sort by sequence if provided, fall back to timestamp
  const sorted = events.sort((a, b) =>
    (a.sequence ?? a.timestamp) - (b.sequence ?? b.timestamp)
  );

  // Process in order
  return sorted.reduce((acc, event) => acc + event.content, '');
}
```

**What NOT to do:**
```typescript
// ❌ BAD: Assume strict event ordering
function processStreamEvents(events: StreamEvent[]) {
  return events.map(e => e.content).join('');
  // If events arrive out of order, text gets scrambled
}
```

**Testing:**
- Send events out of order, verify correct assembly
- Test with multiple AI providers (they might send different orders)

---

### D.2 Context Management: Compact Before Overflow, Not After

**Constraint:** Monitor context window fill during streaming. Compact proactively at 75% full, not reactively at 100%.

**Why learned from OpenCode:**
- Reactive compaction (on overflow) causes sudden slowdown mid-stream
- User perceives editor as "freezing"
- Proactive compaction prevents this

**What to do:**
```typescript
// ✅ GOOD: Proactive compaction
const contextLimit = 200000;  // tokens
const compactThreshold = contextLimit * 0.75;  // 75%

async function streamWithAutoCompaction(messages) {
  while (tokensUsed < contextLimit) {
    const event = await stream.next();
    tokensUsed += event.tokens;

    // Check threshold BEFORE hitting limit
    if (tokensUsed > compactThreshold) {
      // Compact now, not later
      const summary = await ai.summarize(conversationHistory);
      replaceOldMessages(summary);
      tokensUsed = calculateTokens();  // Recalculate
    }
  }
}
```

**What NOT to do:**
```typescript
// ❌ BAD: Reactive compaction
async function stream(messages) {
  while (tokensUsed < contextLimit) {
    const event = await stream.next();
    tokensUsed += event.tokens;

    // Only compact AFTER hitting limit
    if (tokensUsed > contextLimit) {  // Too late!
      const summary = await ai.summarize(conversationHistory);
      // User already experienced slowdown
    }
  }
}
```

---

### D.3 Diagnostics in AI Context: Real-Time Feedback Loop

**Constraint:** LSP diagnostics must be fed to AI for grounding. Update AI context with latest diagnostics.

**Why learned from OpenCode:**
- AI model edits code → LSP reports diagnostics → Feed back to model
- Model learns from actual errors, not hallucinations
- Avoids infinite loop of the same mistake

**What to do:**
```typescript
// ✅ GOOD: Feedback loop
async function refactorWithDiagnostics(code: string) {
  const response = await ai.refactor(code);

  // Apply changes
  buffer.content = response;

  // Get fresh diagnostics from LSP
  const diagnostics = await lsp.getDiagnostics(buffer.path);

  // If still has errors, feed back to AI
  if (diagnostics.length > 0) {
    const nextResponse = await ai.fixErrors(
      buffer.content,
      diagnostics  // Include diagnostics in context
    );
    buffer.content = nextResponse;
  }
}
```

---

## E. Plugin System Constraints (Phase 2)

### E.1 Plugin Isolation: One Broken Plugin Doesn't Crash Editor

**Constraint:** Each plugin runs in isolated context. Plugin crash must not propagate to core.

**Why:** Long-running editor sessions need reliability. One bad plugin shouldn't destroy session.

**What to do:**
```typescript
// ✅ GOOD: Try-catch around plugin execution
async function executePluginCommand(command: string) {
  try {
    const handler = pluginRegistry.get(command);
    if (!handler) throw new Error(`Unknown command: ${command}`);

    return await handler();
  } catch (error) {
    // Don't re-throw, show user message
    showError(`Plugin error: ${error.message}`);
    return undefined;
  }
}
```

**What NOT to do:**
```typescript
// ❌ BAD: Let plugin errors propagate
async function executePluginCommand(command: string) {
  const handler = pluginRegistry.get(command);
  return await handler();  // Crashes editor if plugin crashes
}
```

---

### E.2 Plugin Permissions: Explicit Permission Model

**Constraint:** Plugins must declare required permissions in manifest. Deny all by default.

**Why learned from OpenCode:**
- Prevents malicious plugins from reading user files
- Prevents accidental leaks of sensitive data
- Users can review what each plugin does

**What to do:**
```toml
# plugin.toml - Plugin must declare all permissions
[permissions]
editor.commands = ["my-command"]          # Only register specific commands
filesystem.read = ["**/*.ts", "*.json"]   # Only read specific file types
network = []                               # No network access by default
```

```typescript
// ✅ GOOD: Check permissions before operation
function readFile(pluginId: string, path: string) {
  const permissions = getPluginPermissions(pluginId);

  if (!matchesGlob(path, permissions.filesystem.read)) {
    throw new PermissionDenied(`${pluginId} cannot read ${path}`);
  }

  return fs.readFileSync(path, 'utf-8');
}
```

---

## F. Error Handling Constraints

### F.1 Fail Fast on Validation, Not on Execution

**Constraint:** Validate all inputs early (config, plugin manifests, user input). Only execute known-good data.

**Why:** Easier to debug validation errors than execution errors.

**What to do:**
```typescript
// ✅ GOOD: Validate early
async function loadPlugin(pluginPath: string) {
  // 1. Validate manifest exists and is valid TOML
  const manifest = await validatePluginManifest(pluginPath);

  // 2. Validate required fields present
  PluginManifestSchema.parse(manifest);  // Throws on invalid

  // 3. Now we know it's safe to load
  const plugin = await import(manifest.main);
  return plugin;
}
```

**What NOT to do:**
```typescript
// ❌ BAD: Validate during execution
async function loadPlugin(pluginPath: string) {
  const plugin = await import(pluginPath);  // Crash if bad
  const manifest = plugin.manifest;
  if (!manifest.name) {  // Check too late
    throw new Error('Missing name');
  }
}
```

---

### F.2 Return Errors, Don't Throw (At Boundaries)

**Constraint:** Application boundaries (config loading, plugin initialization) should return Results, not throw.

**Why:** Throwing exceptions hard to recover from. Results are explicit and testable.

**What to do:**
```typescript
// ✅ GOOD: Result type for boundaries
type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

async function loadConfig(path: string): Promise<Result<Config, string>> {
  try {
    const file = await Bun.file(path).text();
    const data = JSON.parse(file);
    const config = ConfigSchema.parse(data);
    return { ok: true, value: config };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// Usage
const result = await loadConfig(configPath);
if (result.ok) {
  useConfig(result.value);
} else {
  showError(result.error);
  useDefaultConfig();
}
```

**What NOT to do:**
```typescript
// ❌ BAD: Throw from boundaries
async function loadConfig(path: string): Promise<Config> {
  const file = await Bun.file(path).text();
  const data = JSON.parse(file);  // Throws on parse error
  return ConfigSchema.parse(data);  // Throws on validation
}

// Usage - hard to recover
try {
  const config = await loadConfig(configPath);
} catch (error) {
  // What do we do? Which step failed?
  // Hard to provide good fallback
}
```

---

## G. Testing Constraints

### G.1 Headless Testing: Mock Terminal, No Real TTY

**Constraint:** Test modal state changes and rendering without needing interactive terminal in CI/CD.

**Why:** Deterministic testing, works in containers, parallel execution.

**What to do:**
```typescript
// ✅ GOOD: Render to buffer, assert on output
function testModalSwitch() {
  const buffer = createMockBuffer('hello');
  const modal = createModalState();
  const renderer = createMockRenderer();

  // Simulate keystroke
  const newModal = handleKeystroke(modal, 'i');  // Enter insert
  const output = renderer.render(buffer, newModal);

  // Assert on rendered output
  expect(output).toContain('-- INSERT --');  // Mode indicator
}
```

**What NOT to do:**
```typescript
// ❌ BAD: Test only logic, not output
function testModalSwitch() {
  const modal = createModalState();
  const newModal = handleKeystroke(modal, 'i');

  expect(newModal.currentMode).toBe('insert');
  // But we never tested that UI renders correctly
}
```

---

### G.2 Test Large Files: Performance Isn't Just for Code

**Constraint:** Test buffer operations with 10k+ line files. Measure keystroke latency at scale.

**Why learned from OpenCode:**
- O(n) rendering becomes obvious with large files
- Small files hide performance bugs that surface in production
- Need to know if performance degrades with file size

**What to do:**
```typescript
// ✅ GOOD: Performance test with large files
function testLargeFilePerformance() {
  const largeBuffer = createBuffer(
    Array(10000).fill('line of code\n').join('')
  );

  const startTime = performance.now();
  const newBuffer = insertText(largeBuffer, { line: 5000, col: 0 }, 'x');
  const elapsed = performance.now() - startTime;

  expect(elapsed).toBeLessThan(5);  // Should be fast (O(log n))
}
```

---

## H. Platform-Specific Constraints

### H.1 Keyboard Protocol Compatibility

**Constraint:** Support multiple keyboard protocols. Don't assume VT100-only.

**Why learned from OpenTUI:**
- Modern terminals (Kitty, iTerm2) have extended protocols
- SSH and containers use VT100 strictly
- Graceful fallback needed

**What to do:**
```typescript
// ✅ GOOD: Protocol detection and fallback
const keyboardProtocol = detectTerminalCapabilities();

function parseKeystroke(sequence: string) {
  if (keyboardProtocol === 'kitty') {
    return parseKittyKeyboard(sequence);
  } else if (keyboardProtocol === 'csi') {
    return parseCSIKeyboard(sequence);
  } else {
    // Fallback to VT100 (oldest, most compatible)
    return parseVT100Keyboard(sequence);
  }
}
```

---

### H.2 Avoid Zig FFI Until Profiling Shows Need

**Constraint:** Keep implementation in pure TypeScript. Only add Zig if profiling shows rendering < 16ms is unachievable.

**Why:** TypeScript is simpler, Zig adds complexity and platform-specific binary management.

**Current state:** ✅ Pure TypeScript, no Zig dependency

**What to do:**
- Profile first: `bun run perf`
- Identify bottleneck (rendering? LSP? AI?)
- Only then consider Zig for that specific component
- Measure FFI overhead before committing to it

---

## I. Deployment Constraints

### I.1 Test Across Platforms Before Release

**Constraint:** Test binary on macOS, Linux, Windows (WSL) before shipping release.

**Why learned from OpenCode:**
- Library initialization failures in containers
- SSH terminal size negotiation differences
- Permission issues on restricted systems

**What to do:**
```bash
# Before releasing:
bun run build:binary

# Test on:
# 1. macOS (Intel + Apple Silicon)
./dist/ctrl --version
./dist/ctrl /tmp/test.ts  # Actually use it

# 2. Linux (system shell + container)
./dist/ctrl --version
./dist/ctrl /tmp/test.ts

# 3. Windows WSL2
./dist/ctrl --version
./dist/ctrl /tmp/test.ts

# 4. SSH remote session
ssh user@server
./ctrl --version
```

---

### I.2 Document Known Limitations Clearly

**Constraint:** Every release must document:
- What terminal emulators are supported
- What keyboard protocols work
- What OS versions are tested
- Known issues and workarounds

**Why:** Prevents user frustration when features don't work on their setup.

---

## J. Code Organization Constraints

### J.1 Barrel Imports Only: Never Import From Implementation Files

**Constraint:** Always import from index.ts barrels, never from module files directly.

**Why:** Makes dependencies traceable, enables tree-shaking.

**What to do:**
```typescript
// ✅ GOOD: Import from barrel
import { insertText, createBuffer } from '~/core/buffer';

// ✅ Implementation file (src/core/buffer/buffer.ts)
export function insertText(...) { ... }

// ✅ Barrel export (src/core/buffer/index.ts)
export { insertText, createBuffer } from './buffer';
```

**What NOT to do:**
```typescript
// ❌ BAD: Import from implementation
import { insertText } from '~/core/buffer/buffer';
// This breaks tree-shaking and makes refactoring risky
```

---

### J.2 Pure Functions Only: No Classes, No Mutations

**Constraint:** All code is pure functions returning new objects. Zero mutations.

**Why:** Easier to reason about, testable without mocks, aligns with React's expectations.

**This is already in constraints.md, but reinforcing here because OpenCode/OpenTUI rely on this heavily.**

---

## K. Common Pitfalls (From OpenCode Issues)

### K.1 SSE Empty Events Crash Parser

**Pitfall:** Empty SSE event objects cause parser to hang.

**Prevention:**
```typescript
// ✅ GOOD: Validate before streaming
function streamToSSE(event: SSEEvent) {
  if (!event.data || event.data.trim() === '') {
    return;  // Skip empty events
  }

  response.write(`data: ${JSON.stringify(event)}\n\n`);
}
```

---

### K.2 O(n) Rendering with Large Files

**Pitfall:** Recursive tree traversal on every render frame causes 100%+ CPU.

**Detection:**
- Open 10k+ line file
- If CPU > 50%, rendering is the issue
- Profile rendering time with `performance.now()`

**Prevention:**
- Don't do recursive traversals in hot paths
- Cache results and invalidate selectively
- Test with 10k+ line files during development

---

### K.3 Config Changes Don't Trigger Re-render

**Pitfall:** Config loaded but editor state not updated, so UI doesn't change.

**Prevention:**
```typescript
// ✅ GOOD: Update state after loading config
configEmitter.on('config:changed', async () => {
  const config = await loadConfig();
  const validated = ConfigSchema.parse(config);
  setConfig(validated);  // THIS LINE IS CRITICAL
  requestRender();
});
```

---

## L. Measurement & Monitoring

### L.1 Metrics to Track

**During development:**
- Keystroke latency: Measure time from keystroke to render
- Startup time: Time from `ctrl` invocation to first keystroke response
- Memory usage: Baseline idle, peak while editing 100k line file
- CPU usage: Should be near-zero when idle, <20% while editing

**Post-release:**
```bash
# Create simple perf test
echo "Testing keystroke latency..."
time ctrl /tmp/largefile.ts << EOF
i
hello world
ESC
:q
EOF
```

---

### L.2 Profiling Tools

**Built-in:**
```bash
bun run perf              # Run perf tests if configured
bun run lint              # Check code quality
bun run check             # Full validation
```

**External:**
```bash
# Measure startup time
time ctrl --version

# Profile CPU (Linux)
perf record -g ./dist/ctrl /tmp/test.ts
perf report

# Monitor memory (any OS)
node -e "const proc = require('child_process').spawn('./dist/ctrl', ['/tmp/test.ts']); setInterval(() => console.log(Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'), 1000)"
```

---

## M. Decision Matrix: What to Do If...

| Scenario | What to Do | Why |
|----------|-----------|-----|
| Keystroke latency > 16ms | Profile rendering, implement viewport rendering | Affects every user action |
| Memory grows during long sessions | Add circular buffer cleanup, profile allocations | Long-running editing sessions break |
| Config hot-reload doesn't work | Check file watcher callback is firing, verify re-render | User expects immediate changes |
| Crashes with large files (10k+ lines) | Test with 10k lines, check for O(n) ops, use profiler | Common in production |
| Plugin makes editor slow | Isolate plugin, measure before/after, ask plugin author for profile | One bad plugin breaks everyone |
| Out-of-order AI streaming events | Add sequence numbers, implement sorting/validation | Scrambled output breaks UX |
| Context window fills during AI chat | Proactive compaction at 75%, not reactive at 100% | Prevents mid-stream slowdown |

---

## N. Checklist Before Each Release

- [ ] All tests passing: `bun test`
- [ ] Code formatted: `bun run format`
- [ ] No lint errors: `bun run lint`
- [ ] Performance profiling:
  - [ ] Keystroke latency < 16ms
  - [ ] Startup time < 100ms
  - [ ] Memory stable with 100k-line file
  - [ ] CPU near-zero when idle
- [ ] Config hot-reload works
- [ ] Plugin system isolated (broken plugin doesn't crash editor)
- [ ] Cross-platform testing:
  - [ ] macOS (Intel + ARM)
  - [ ] Linux (system + container)
  - [ ] Windows (WSL)
- [ ] Keyboard protocols tested (VT100, Kitty, CSI)
- [ ] Known limitations documented

---

## O. References

### OpenTUI & OpenCode Source Analysis
- [OpenTUI Repository](https://github.com/sst/opentui) - Frame diffing, rendering pipeline
- [OpenCode Repository](https://github.com/sst/opencode) - Session management, context compaction
- [Performance Issue #6172](https://github.com/sst/opencode/issues/6172) - O(n) rendering analysis
- [Stream Ordering Issue #3596](https://github.com/sst/opencode/issues/3596) - SSE event ordering

### Related Ctrl Documentation
- See [constraints.md](constraints.md) for technical stack constraints
- See [development-guide.md](development-guide.md) for functional programming patterns
- See [testing.md](testing.md) for testing infrastructure
- See [ai-integration-architecture.md](ai-integration-architecture.md) for AI-specific design

---

**Document Version:** 1.0
**Last Updated:** January 22, 2026
**Based on:** Deep source analysis of OpenTUI and OpenCode
**Maintainer:** Erik Wright (@erikperkins)
