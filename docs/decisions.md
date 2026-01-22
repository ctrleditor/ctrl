# Key Decisions

This is an index of major architectural and technical decisions. Full context for each decision is in the referenced git commit.

## Format
Each decision includes:
- **Date** - When the decision was made
- **Title** - Brief description
- **Commit** - Link to commit with full context (decision, rationale, consequences)
- **Status** - Active, Superseded, or Deprecated

## Decisions

### 2026-01-22: Adopt Plugin-First Architecture
- **Commit:** [TBD - after first commit]
- **Status:** Active
- **Summary:** Keep core minimal (buffer, modal system, config, plugin host); all language support, formatters, git integration, and UI features live as plugins

**Context:**
- Core with everything bundled = bloated, slower startup, harder to maintain, limits community contribution
- Core that's extensible = smaller surface area, faster iteration, community ownership

**Consequences:**
- ✅ Faster startup, smaller memory footprint
- ✅ Community can build features without waiting for releases
- ✅ Users can disable features they don't need
- ❌ Need robust plugin API and sandboxing
- ❌ More work in plugin development guides and examples

---

### 2026-01-22: Use TOML for All Configuration
- **Commit:** [TBD]
- **Status:** Active
- **Summary:** Configuration (editor settings, keybindings, AI settings, plugins) via TOML files, not JSON or Lua

**Context:**
- TOML is human-readable (better for manual editing)
- TOML can be validated via schema (helpful error messages)
- TOML is AI-friendly (LLMs understand it well)
- Alternative: Lua is flexible but hard to validate; JSON is rigid but not human-friendly

**Consequences:**
- ✅ Config is versionable in git
- ✅ Easy to share team configs
- ✅ Hot-reload support
- ❌ TOML not as flexible as Lua (acceptable tradeoff)
- ❌ Need TOML validation library

---

### 2026-01-22: Treat AI as Infrastructure, Not a Feature
- **Commit:** [TBD]
- **Status:** Active
- **Summary:** Core provides AI platform (provider abstraction, context building, streaming); plugins consume it for specific features (chat, completions, refactoring)

**Context:**
- Bolting AI on = inconsistent UX, repeated context building, hard to test
- AI as platform = clean layering, plugins build coherent experiences, core stays focused

**Consequences:**
- ✅ Clean separation of concerns
- ✅ Plugins can build custom AI workflows
- ✅ Easy to swap AI providers
- ❌ Core has more responsibility (need good platform design)
- ❌ Testing AI features requires mock providers

---

### 2026-01-22: Bun as the Runtime
- **Commit:** [TBD]
- **Status:** Active
- **Summary:** Use Bun (package manager + runtime) instead of Node.js

**Context:**
- Bun is faster (native bundler, faster startup, faster execution)
- Bun is TypeScript-native (write config tooling directly)
- Bun is less mature than Node but adequate for editor
- OpenTUI targets Bun

**Consequences:**
- ✅ Smaller binary size
- ✅ Faster startup time
- ✅ TypeScript first-class support
- ❌ Smaller ecosystem than Node (some packages not compatible)
- ❌ Fewer developers know Bun (onboarding friction)
- ❌ Risk: Bun could be abandoned (mitigate by staying close to spec)

---

### 2026-01-22: OpenTUI for Terminal Rendering
- **Commit:** [TBD]
- **Status:** Active
- **Summary:** Use OpenTUI (TypeScript + Zig framework) for terminal rendering instead of Ratatui or Ncurses

**Context:**
- Ratatui is mature (Rust-based, popular)
- OpenTUI is newer but TypeScript-native and AI-optimized
- Direct Ncurses binding = lower-level control but more work

**Consequences:**
- ✅ TypeScript consistency (core and plugins same language)
- ✅ Zig rendering layer = native performance
- ✅ AI-native framework design
- ❌ OpenTUI is 0.x (risk of breaking changes)
- ⚠️ Mitigations: Fork if needed, stay close to upstream, abstract rendering layer

---

### 2026-01-22: Modal Editing System (Vim-like)
- **Commit:** [TBD]
- **Status:** Active
- **Summary:** Support normal, insert, visual, and command modes; all editing is modal

**Context:**
- Vim users are core target audience
- Modal editing = fewer keybindings, context-dependent behavior, powerful motions
- Non-modal = simpler to implement, easier for beginners
- Tradeoff: Pick modal for target users (Vim experts)

**Consequences:**
- ✅ Vim users immediately productive
- ✅ Powerful editing with few keys
- ❌ Learning curve for non-Vim users
- ❌ Not 100% Vim compatible (OK: 80% is enough)

---

### 2026-01-22: Rope Data Structure for Buffers
- **Commit:** [TBD]
- **Status:** Active
- **Summary:** Use rope (tree-based string) instead of gap buffer or array of lines

**Context:**
- Gap buffer: O(n) for insertions/deletions at arbitrary positions
- Array of lines: Strings are immutable, copies happen
- Rope: O(log n) for insertions/deletions, can handle 100MB+ files

**Consequences:**
- ✅ Efficient large file handling
- ✅ Undo/redo via operational transform
- ❌ More complex implementation
- ❌ Need careful memory management

---

### 2026-01-22: Local-First Architecture
- **Commit:** [TBD]
- **Status:** Active
- **Summary:** MVP works entirely locally; no server required; future hosted version is optional

**Context:**
- Users own their data
- Works offline
- No GDPR/privacy burden for MVP
- Hosted version can be opt-in later (Modo Ventures)

**Consequences:**
- ✅ No server costs for MVP
- ✅ Users trust their data stays local
- ✅ Can work on planes, trains, offline
- ❌ No collaborative editing in MVP
- ❌ Can't centralize telemetry/crash reports

---

## How to Add a Decision

When making a significant decision:

1. **Capture it in your commit message:**
   ```
   feat: implement new feature

   Decision: [What was decided]

   Context: [Why we made this decision]
   - Point 1
   - Point 2

   Consequences:
   - Trade-off 1
   - Trade-off 2
   ```

2. **Add an entry to this file:**
   - Use the commit date
   - Link to the commit
   - Keep the summary brief

3. **Update related docs** if the decision changes:
   - architecture.md
   - constraints.md
   - requirements.md

## What Warrants a Decision Entry?

Add decisions that:
- Change system architecture
- Choose between technical alternatives
- Affect multiple components
- Have long-term impact
- Future developers will wonder "why did we do it this way?"

Don't add:
- Minor implementation details
- Standard practices
- Obvious choices
- Temporary workarounds
