# 🚨 Quick Reference: Guardrails for LLM Assistants

**READ THIS FIRST IN EVERY SESSION**

## The Three Critical Rules

### Rule 1: NO `timeout` on TUI Apps
```bash
❌ timeout 5 bun run dev          # BREAKS terminal
✅ bun run dev  # then Ctrl+C     # CORRECT
```

### Rule 2: Spawning TUI Apps for Tests
```typescript
// In test code ONLY:
const proc = Bun.spawn(["bun", "run", "dev"], {...});
process.kill(proc.pid, "SIGINT");  // ONLY way to exit

// Import from test helpers:
import { waitForInit, gracefulExit, isStillAlive } from "./test/tui-testing-rules";
```

### Rule 3: Event Loop Architecture
- OpenTUI uses `setTimeout` scheduling (NOT blocking while loops)
- Process stays alive because stdin is resumed + setTimeout keeps scheduling
- Blocking `while (!shouldExit)` loops BREAK the event model
- See: `src/ui/renderer.tsx` lines 500-516 (needs fixing)

## Files to Read

| File | Purpose |
|------|---------|
| `.guardrails.md` | Complete rules + rationale |
| `CLAUDE.md` | Project instructions (read first) |
| `docs/ctrl-specific-constraints.md` (G.0) | TUI constraints |
| `test/tui-testing-rules.ts` | Test helpers + template |
| `test/tui.test.ts` | Working TUI test examples |

## Before Any Test/Bash Work

1. **Is this a TUI app?** → Yes, Ctrl is OpenTUI-based
2. **Am I using timeout?** → STOP if yes, use SIGINT only
3. **Have I imported test helpers?** → `from "./test/tui-testing-rules"`
4. **Exit method?** → `process.kill(pid, "SIGINT")` ONLY

## Current Status

**The Issue:**
- Editor process exits immediately instead of staying alive
- Root cause: Blocking while loop conflicts with OpenTUI's setTimeout event loop
- Location: `src/ui/renderer.tsx:500-516`

**Tests:**
- ✅ SIGINT exit works correctly
- ⚠️ Event loop keeps process alive (failing - needs renderer fix)
- ✅ Error handling works

**What's Been Set Up:**
- `.guardrails.md` - Comprehensive LLM guardrails
- `test/tui-testing-rules.ts` - Helpers + template
- `test/tui.test.ts` - Example tests using guardrails properly
- Updated `CLAUDE.md` to reference guardrails
- Updated `docs/` to emphasize SIGINT-only rule

## For Next Session

**This conversation established:**
1. The real issue (blocking while loop vs. setTimeout event loop)
2. How to test TUI properly (SIGINT only, no timeout)
3. Persistent guardrails so it won't happen again

**Next steps (for you or next LLM):**
1. Fix `src/ui/renderer.tsx` - remove blocking while loop
2. Let OpenTUI renderer manage the event loop
3. Signal exit flag instead of breaking from loop
4. Test with proper SIGINT handling

**Guardrail Enforcement:**
- Files with "guardrail" in name are mandatory reading
- `.guardrails.md` is the source of truth
- `CLAUDE.md` now points to guardrails first
- `test/tui-testing-rules.ts` enforces patterns in code

---

**Violations:** Using timeout on TUI apps breaks developer's terminal state.
**Non-negotiable:** These are not suggestions—they're mandatory rules for TUI testing.
