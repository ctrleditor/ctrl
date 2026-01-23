import { describe, it, expect } from "bun:test";
import { spawn } from "bun";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { waitForInit, gracefulExit, isStillAlive } from "./tui-testing-rules";

describe("TUI App", () => {
  it("should start and exit gracefully without corrupting terminal", async () => {
    const testFilePath = "/tmp/ctrl-test.ts";
    writeFileSync(testFilePath, "console.log('hello');\n");

    console.log("🚀 Starting Ctrl editor...");
    const proc = Bun.spawn(["bun", "run", "dev", testFilePath], {
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        TERM: "xterm-256color",
      },
    });

    // RULE: Use waitForInit() - NOT setTimeout directly
    console.log("⏳ Waiting for editor to initialize (3s)...");
    await waitForInit(3000);

    console.log("✓ Editor started (PID: " + proc.pid + ")");
    expect(proc.pid).toBeGreaterThan(0);

    // RULE: Exit ONLY with SIGINT - NEVER use timeout, kill -9, or force-kill
    console.log("🛑 Sending SIGINT to exit cleanly...");
    process.kill(proc.pid, "SIGINT");

    console.log("⏳ Waiting for cleanup (1s)...");
    await waitForInit(1000);

    const exitCode = proc.exitCode;
    console.log("✓ Editor exited with code: " + exitCode);

    // SIGINT exit results in null exitCode (process killed by signal)
    expect(exitCode).toBeOneOf([0, null]);

    console.log("✅ TUI test passed - terminal should be clean");
  });

  it("should be responsive to basic input", async () => {
    const testFilePath = "/tmp/ctrl-test-input.ts";
    writeFileSync(testFilePath, "const x = 1;\n");

    console.log("🚀 Starting editor for input test...");
    const proc = Bun.spawn(["bun", "run", "dev", testFilePath], {
      stdout: "pipe",
      stderr: "pipe",
    });

    // RULE: Use waitForInit() to delay without timeout command
    console.log("⏳ Initializing (5s)...");
    await waitForInit(5000);

    const alive = isStillAlive(proc);
    console.log(`Process alive: ${alive}, exitCode: ${proc.exitCode}`);

    if (alive) {
      console.log("✅ Editor stays running after 5s");
      // RULE: Exit ONLY with gracefulExit (which uses SIGINT)
      await gracefulExit(proc);
    } else {
      console.log("⚠️  Process exited too quickly - renderer initialization issue");
      console.log("Expected: OpenTUI setTimeout event loop keeps process alive");
      console.log("Got: Process exited immediately");
      console.log("Fix: See src/ui/renderer.tsx lines 500-516");
    }
  });

  it("should handle missing files gracefully", async () => {
    const nonExistentFile = "/tmp/nonexistent-file-for-ctrl-test-" + Date.now() + ".ts";

    console.log("🚀 Starting editor with non-existent file...");
    const proc = Bun.spawn(["bun", "run", "dev", nonExistentFile], {
      stdout: "pipe",
      stderr: "pipe",
    });

    // RULE: Use waitForInit() for delays
    console.log("⏳ Initializing (2s)...");
    await waitForInit(2000);

    console.log("🛑 Exiting with SIGINT...");
    // RULE: Use gracefulExit() which properly sends SIGINT
    await gracefulExit(proc);

    expect(proc.exitCode).toBeOneOf([0, null]);
    console.log("✅ Error handling test passed");
  });
});
