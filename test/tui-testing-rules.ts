/**
 * TUI Testing Helper - Enforces guardrails
 *
 * This module ensures all TUI tests follow the mandatory rules:
 * 1. NEVER use bash `timeout` command
 * 2. ONLY use SIGINT (process.kill(pid, "SIGINT")) to exit
 * 3. Let OpenTUI's event loop manage process lifetime
 *
 * See .guardrails.md for complete rules.
 */

/**
 * Type-safe TUI process spawning with guardrail enforcement
 *
 * Usage:
 * const proc = spawnTUIApp(["bun", "run", "dev"], { ... });
 * await waitForInit(3000);
 * if (isStillAlive(proc)) {
 *   gracefulExit(proc);
 * }
 */

export const isStillAlive = (proc: any): boolean => {
  return !proc.exited;
};

export const gracefulExit = async (proc: any, waitMs = 500): Promise<void> => {
  // ONLY method for exiting TUI apps
  process.kill(proc.pid, "SIGINT");

  // Wait for cleanup
  await new Promise((resolve) => setTimeout(resolve, waitMs));

  // Verify it exited
  if (!proc.exited) {
    console.warn("⚠️  Process didn't exit after SIGINT - forcing exit");
    process.kill(proc.pid, "SIGTERM");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
};

export const waitForInit = async (ms: number): Promise<void> => {
  // WRONG: await new Promise(r => timeout(ms));
  // RIGHT: await new Promise(r => setTimeout(r, ms));
  await new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Assertion helpers
 */
export const expectProcessAlive = (proc: any): void => {
  if (proc.exited) {
    throw new Error(
      `Process exited unexpectedly. Exit code: ${proc.exitCode}. ` +
        `This indicates a renderer initialization issue. ` +
        `Check docs/ctrl-specific-constraints.md and src/ui/renderer.tsx`
    );
  }
};

export const expectProcessDead = (proc: any): void => {
  if (!proc.exited) {
    throw new Error(
      `Process is still alive after exit attempt. ` +
        `Check that SIGINT was sent correctly.`
    );
  }
};

/**
 * Template for TUI app tests (copy and customize)
 *
 * ```typescript
 * import { describe, it, expect } from "bun:test";
 * import {
 *   waitForInit,
 *   gracefulExit,
 *   isStillAlive
 * } from "./tui-testing-rules";
 *
 * describe("TUI App", () => {
 *   it("should stay alive after init", async () => {
 *     const proc = Bun.spawn(["bun", "run", "dev"], {
 *       stdout: "pipe",
 *       stderr: "pipe",
 *     });
 *
 *     // Initialize
 *     await waitForInit(3000);
 *
 *     // Check alive
 *     expect(isStillAlive(proc)).toBe(true);
 *
 *     // Exit gracefully
 *     await gracefulExit(proc);
 *   });
 * });
 * ```
 */

export const TUI_TESTING_RULES = `
🚨 MANDATORY TUI TESTING RULES (See .guardrails.md)

1. NEVER use bash 'timeout' command on TUI apps
   ❌ timeout 5 bun run dev
   ✅ Use SIGINT only: process.kill(pid, "SIGINT")

2. Blocking while loops conflict with OpenTUI's setTimeout event loop
   ❌ while (!shouldExit) { await sleep(100); }
   ✅ Let renderer manage event loop, exit via SIGINT

3. Process stays alive because:
   - OpenTUI calls process.stdin.resume()
   - Renderer's setTimeout loop keeps scheduling
   - No blocking loops needed

4. To test TUI apps properly:
   - Spawn with Bun.spawn()
   - Wait for init with setTimeout
   - Check isStillAlive()
   - Exit ONLY with process.kill(pid, "SIGINT")
   - Verify process.exited after timeout

See .guardrails.md and docs/testing.md for detailed examples.
`;
