/**
 * Test runner for Ctrl editor
 * Runs all tests in the test/ directory
 *
 * Usage: bun run test/run-tests.ts
 * (or invoke via Bun.spawn() from another script)
 */

import { spawn } from "bun";

const runTests = async () => {
	console.log("Running Ctrl editor tests...\n");

	const proc = spawn([
		"bun",
		"test",
		"test/segment-rendering.test.ts",
		"test/syntax-highlighting.test.ts",
		"test/theme-loading.test.ts",
		"test/user-themes-ghostty.test.ts",
		"test/gogh-schemes.test.ts",
	], {
		stdout: "inherit",
		stderr: "inherit",
		cwd: process.cwd(),
	});

	const exitCode = await proc.exited;
	process.exit(exitCode);
};

runTests().catch((error) => {
	console.error("Test runner error:", error);
	process.exit(1);
});
