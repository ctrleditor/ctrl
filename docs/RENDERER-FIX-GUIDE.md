# Renderer Event Loop Fix Guide

**Status:** Investigation Complete - Fix Needed

## The Problem

The Ctrl editor process exits immediately instead of staying alive to wait for keyboard input. Tests show:
- Process initialized successfully
- But exits before accepting input
- Root cause: Blocking while loop conflicts with OpenTUI's setTimeout-based event loop

## Root Cause Analysis

### Current Implementation (BROKEN)
**File:** `src/ui/renderer.tsx:500-516`

```typescript
// Event loop - wait until user exits (Ctrl+C, Ctrl+D, or 'q')
while (!shouldExit) {
  await new Promise(resolve => setTimeout(resolve, 100));  // 100ms sleep
}

// CRITICAL: Exit cleanup sequence - DO NOT MODIFY
try {
  await renderer.destroy?.();
} catch {
  // Ignore cleanup errors
}

process.exit(0);
```

### Why This is Broken

1. **Node.js Event Loop Model**
   - Node.js is event-driven, not thread-blocking
   - Activities like keyboard input rely on event listeners firing while the event loop is free

2. **Our Blocking Pattern**
   - `while (!shouldExit) { await new Promise(r => setTimeout(r, 100)) }`
   - This continuously schedules 100ms sleeps
   - While sleeping, keyboard events can fire, setting `shouldExit = true`
   - But the event loop is still waiting for the next 100ms timeout
   - This creates a race condition and prevents proper event handling

3. **OpenTUI's Event Loop**
   - OpenTUI uses `setTimeout` scheduling internally
   - It doesn't use blocking loops
   - The renderer has its own frame loop: `requestAnimationFrame` → `setTimeout` → next frame
   - Calling `stdin.resume()` makes the process stay alive naturally

4. **The Race Condition**
   - When keyInput listener fires (e.g., Ctrl+C), it sets `shouldExit = true`
   - But the while loop might be mid-sleep
   - This causes timing issues that can result in the renderer being destroyed before properly initializing

## The Solution

### Key Insight from OpenTUI
OpenTUI doesn't use blocking while loops. The process stays alive because:
1. `stdin.resume()` is called by the renderer (keeps stdin active)
2. The renderer's `setTimeout` loop keeps scheduling frames
3. Node.js event loop never becomes empty
4. When exit is needed, `renderer.destroy()` handles cleanup

### The Fix Pattern

```typescript
export const runApp = async (
  initialState: AppState,
  handleKeystroke: KeystrokeHandler,
  uiConfig: UIConfigType,
  setupConfigReload?: (...) => void
): Promise<void> => {
  let currentState = initialState;
  let shouldExit = false;

  // Create the CLI renderer
  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
    useKittyKeyboard: {},
  });

  // Create React root and render component
  const root = createRoot(renderer);
  let currentUiConfig = uiConfig;

  const render = () => {
    root.render(<AppComponent state={currentState} uiConfig={currentUiConfig} />);
  };

  render();

  // Handle config reload
  if (setupConfigReload) {
    setupConfigReload((newConfig) => {
      currentState = { ...currentState, config: newConfig };
      currentUiConfig = newConfig.ui;
      render();
    });
  }

  // Handle keyboard input
  renderer.keyInput.on("keypress", (keyEvent: KeyEvent) => {
    const key = keyEvent.name;

    // Exit on Ctrl+C, Ctrl+D, or 'q'
    if ((keyEvent.ctrl && (key === "c" || key === "d")) || key === "q") {
      shouldExit = true;
      return;
    }

    // Handle keystroke
    const newState = handleKeystroke(currentState, key, keyEvent);
    if (newState !== currentState) {
      currentState = newState;
      render();
    }
  });

  // ❌ REMOVE THIS BLOCKING LOOP:
  // while (!shouldExit) {
  //   await new Promise(resolve => setTimeout(resolve, 100));
  // }

  // ✅ INSTEAD: Let OpenTUI handle the event loop
  // The renderer's setTimeout loop and stdin listener keep the process alive
  // We just need to wait for the exit flag to be set

  // Approach 1: Use an event emitter (preferred)
  // When shouldExit is set, the keyInput handler will set it and we exit on next check

  // Approach 2: Use a promise-based approach
  await new Promise<void>((resolve) => {
    // Override the keypress handler to resolve when exit is requested
    const originalHandler = renderer.keyInput.listeners("keypress")?.[0];

    renderer.keyInput.off("keypress", originalHandler);
    renderer.keyInput.on("keypress", (keyEvent: KeyEvent) => {
      const key = keyEvent.name;

      // Exit on Ctrl+C, Ctrl+D, or 'q'
      if ((keyEvent.ctrl && (key === "c" || key === "d")) || key === "q") {
        resolve();
        return;
      }

      // Handle keystroke
      const newState = handleKeystroke(currentState, key, keyEvent);
      if (newState !== currentState) {
        currentState = newState;
        render();
      }
    });
  });

  // CRITICAL: Exit cleanup sequence
  try {
    await renderer.destroy?.();
  } catch {
    // Ignore cleanup errors
  }

  process.exit(0);
};
```

### Approach 3: Simplest Fix (Recommended)

If the renderer already keeps the process alive through stdin, we might just need to prevent the blocking loop from interfering:

```typescript
// Remove the while loop entirely and use a different exit pattern

// At the end of runApp, instead of:
// while (!shouldExit) { await sleep(100); }

// Just wait for a reasonable timeout or use renderer's own lifecycle
await new Promise<void>((resolve) => {
  const checkExit = setInterval(() => {
    if (shouldExit) {
      clearInterval(checkExit);
      resolve();
    }
  }, 50); // Check less frequently
});
```

## Testing the Fix

Once you apply the fix, the tests should show:

```
✅ Test 1: Clean exit with SIGINT
✅ Test 2: Editor stays alive after 5s initialization
✅ Test 3: Error handling works
```

**Current test status:**
- ❌ Test 2 fails because process exits immediately
- ✅ Tests 1 and 3 pass
- Once renderer is fixed, all 3 should pass

## Related Files

- `src/ui/renderer.tsx` - Main file needing fix (lines 500-516)
- `test/tui.test.ts` - Tests that verify the fix
- `test/tui-testing-rules.ts` - Test helpers and guardrails
- `@opentui/core` package - Reference implementation
- `@opentui/react` package - React integration reference

## References

- OpenTUI GitHub: https://github.com/anomalyco/opentui
- OpenCode GitHub: https://github.com/anomalyco/opencode (reference implementation)
- Node.js Event Loop: https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/

## Next Steps

1. Review the three approaches above
2. Test with `bun test test/tui.test.ts`
3. Verify clean SIGINT exit: start editor, press Ctrl+C
4. Verify editor stays alive: start editor, wait 5s, verify it's still running
5. Commit fix with proper message
