# Key Decisions

This is an index of major architectural and technical decisions. Full context for each decision is in the referenced git commit.

## Format

Each decision includes:
- **Date** - When the decision was made
- **Title** - Brief description
- **Commit** - Link to commit with full context (decision, rationale, consequences)
- **Status** - Active, Superseded, or Deprecated

## Decisions

### 2025-01-19: Build CLI with command-first approach (check before init)
- **Commit:** [613a016](https://github.com/ctrleditor/ctrlspec/commit/613a016)
- **Status:** Active
- **Summary:** Start Phase 2 with `ctrlspec check` command, not `init`, to validate parsing pipeline early

**Decision Context:**
Current `install.sh` already handles initialization. What's missing is inspection and validation. Building `check` first provides immediate value and validates the entire architecture before building UI.

**Rationale:**
- Validates core utilities (markdown parser, TODO detector, git scanner) are solid
- Provides working tool in Week 1 instead of waiting for full framework
- Can test immediately on CtrlSpec's own documentation
- Better foundation for subsequent commands
- Delivers value to users faster
- Unblocks `sync` and `init` from relying on validation

**Consequences:**
- `init` comes in Week 3 instead of Week 1
- Slightly longer path to MVP but better architecture
- Parser/validation are battle-tested before many users adopt
- Backwards compatible with existing install.sh

---

### 2025-01-19: Use TypeScript + Bun for CLI tooling
- **Commit:** [613a016](https://github.com/ctrleditor/ctrlspec/commit/613a016)
- **Status:** Active
- **Summary:** CLI implemented in TypeScript with Bun runtime instead of Bash

**Decision Context:**
Bash installation script works but CLI needs more sophisticated features (parsing, validation, interactive prompts, colored output). TypeScript + Bun provides modern DX without runtime complexity.

**Rationale:**
- TypeScript for type safety and developer experience
- Bun is fast, has great npm support, works on all platforms
- Cleaner than Bash for complex logic
- Modern tooling matches contemporary JS ecosystem
- Team familiarity (Erik uses TS regularly)

**Consequences:**
- Introduces Bun dependency (but auto-installed via npm)
- Package size increases (mitigated by npm bundling)
- Can't run on systems without Node/Bun
- Better developer experience and fewer bugs
- Enables future features (MCP server, GUI, etc.)

---

### 2024-01-15: Use Bash for installation script instead of Python/Node
- **Commit:** [Initial commit](https://github.com/ctrleditor/ctrlspec)
- **Status:** Active
- **Summary:** Installation script must be POSIX-compatible bash with zero runtime dependencies

**Decision Context:**
CtrlSpec needs maximum compatibility across all Unix-like systems (Linux, macOS, WSL). Bash with no external dependencies ensures the installation works on minimal systems, locked-down corporate machines, and containers.

**Rationale:**
- Bash is pre-installed on virtually all Unix-like systems
- No Python/Node means no dependency hell
- Scripts can be audited before execution (security)
- Instant execution (no runtime startup overhead)
- Works on servers, containers, and edge devices

**Consequences:**
- Less comfortable for modern developers
- Less type safety than Python/Node
- Requires POSIX compatibility testing
- Harder to debug
- Limited to simple shell operations

**Alternatives considered:**
- Python: Would require python3, pip, potentially virtual environments
- Node.js: Would require npm, node_modules, larger download
- Go: Would require downloading binary, cross-platform compilation
- Shell script: Clear winner for distribution

---

### 2024-01-15: Use Markdown for templates instead of HTML/PDF/Confluence
- **Commit:** [Initial commit](https://github.com/ctrleditor/ctrlspec)
- **Status:** Active
- **Summary:** All documentation templates must be GitHub Flavored Markdown stored in git

**Decision Context:**
CtrlSpec's core value is keeping documentation version-controlled and close to code. Markdown ensures universal rendering and editing.

**Rationale:**
- Renders on GitHub, GitLab, Gitea, and any text editor
- Part of git workflow naturally
- Future-proof (text is forever)
- Works offline
- No proprietary software needed
- AI tools understand markdown

**Consequences:**
- No rich formatting, embedded media
- Limited styling options
- Must use ASCII art for diagrams
- Not ideal for non-technical audiences

**Alternatives considered:**
- HTML: Better formatting, but breaks in text editors
- PDF: Can't version in git, harder to edit
- Confluence: Enterprise tool, requires account, proprietary
- Notion: Cloud-based, doesn't integrate with git

---

### 2024-01-15: Create symlinks instead of copying documentation
- **Commit:** [Initial commit](https://github.com/ctrleditor/ctrlspec)
- **Status:** Active
- **Summary:** Use symlinks to point AI tools to docs/llm.md instead of duplicating files

**Decision Context:**
AI tools expect documentation in specific locations (CLAUDE.md, .cursorrules). Symlinks keep a single source of truth while satisfying tool conventions.

**Rationale:**
- Single source of truth: edit docs/llm.md once, all tools see it
- No duplication = no sync issues
- Lower maintenance burden
- Cleaner project structure
- Works on Linux, macOS, WSL

**Consequences:**
- Doesn't work on native Windows (PowerShell/cmd)
- Requires users on Windows to use WSL/Git Bash
- Symlink targets can break if files move
- Different behavior across filesystems
- Some users may not understand symlinks

**Alternatives considered:**
- Duplicate files: Simple but maintenance nightmare
- Hard links: Doesn't work with text editor symlink resolution
- Copy on install: Defeats purpose of single source
- @include syntax: Would need custom tooling

**Mitigations:**
- Document requirement for WSL on Windows
- Handle broken symlinks gracefully in install script
- Provide clear setup instructions

---

### 2024-01-15: Distribute via GitHub instead of npm/PyPI/Homebrew
- **Commit:** [Initial commit](https://github.com/ctrleditor/ctrlspec)
- **Status:** Active
- **Summary:** Primary distribution channel is GitHub (raw.githubusercontent.com) with direct clone as fallback

**Decision Context:**
CtrlSpec is templates and scripts, not a compiled package. GitHub is the natural home for open source, already has CDN, and requires no additional setup.

**Rationale:**
- GitHub is already where developers are
- Raw URL supports curl | sh pattern
- CDN-backed (fast worldwide)
- No dependency on PyPI, npm, Homebrew infrastructure
- Releases are immutable
- Community can fork if needed

**Consequences:**
- Requires network to install
- Dependency on GitHub availability
- Rate limiting from raw.githubusercontent.com (unlikely to hit)
- No automatic updates once installed

**Alternatives considered:**
- npm: Adds JavaScript bias, requires Node
- PyPI: Adds Python bias, requires Python
- Homebrew: Limited to macOS/Linux, requires brew
- Standalone binary: No build step, but what binary?

**Future:**
Could eventually add to Homebrew, AUR, but not priority given simplicity of current distribution.

---

### 2024-01-15: Make CtrlSpec stateless and offline-capable
- **Commit:** [Initial commit](https://github.com/ctrleditor/ctrlspec)
- **Status:** Active
- **Summary:** No external dependencies, no cloud backend, all data stays in user's git repo

**Decision Context:**
CtrlSpec should be simple, trustworthy, and work in any environment including offline, corporate networks, and airgapped systems.

**Rationale:**
- Simpler to understand and audit
- Works offline after installation
- No privacy concerns (no data collection)
- No cloud infrastructure to maintain
- Resilient to external service outages
- Can be used in sensitive environments

**Consequences:**
- Can't offer real-time collaboration features
- No cloud sync between devices
- Can't provide analytics on template usage
- MCP integrations must be user-initiated

**Alternatives considered:**
- Cloud-backed: Would require auth, privacy policy, servers
- Collaborative: Real-time editing, complex infrastructure
- Analytics: Track installations, usage patterns

---

### 2024-01-15: Use Conventional Commits and include decisions in commit messages
- **Commit:** [Initial commit](https://github.com/ctrleditor/ctrlspec)
- **Status:** Active
- **Summary:** Decisions captured in git commits become the authoritative history of "why"

**Decision Context:**
Rather than maintaining a separate decision database, embed decisions in commit messages where code changes happen.

**Rationale:**
- Decisions live next to code changes (atomic)
- Git history is immutable audit trail
- Searchable via git log
- No separate tooling needed
- Part of existing workflow
- Easy to see what changed and why together

**Consequences:**
- Longer commit messages
- Developers need training on format
- Not all changes warrant decision entries
- Decisions.md is just an index pointing to commits

**Format:**
```
feat: description

Decision: What was decided

Context: Why we made this decision
- Reason 1
- Reason 2

Consequences:
- Trade-off 1
- Trade-off 2
```

---

### 2024-01-15: MIT License for maximum compatibility
- **Commit:** [Initial commit](https://github.com/ctrleditor/ctrlspec)
- **Status:** Active
- **Summary:** All code and templates must be MIT-licensed, never GPL or copyleft

**Decision Context:**
CtrlSpec must be usable in any project (commercial, proprietary, closed-source). This requires maximum license permissiveness.

**Rationale:**
- MIT is permissive; no "share-alike" requirements
- Can be used in commercial products
- Can be used in proprietary projects
- Can be incorporated into other open source projects
- Widely understood and recognized
- Simple and short license text

**Consequences:**
- Anyone can fork and commercialize
- Can't enforce open source in derived works
- Contributors give up future control
- Community contributions may dilute project

**Alternatives considered:**
- GPL: Would require all derivatives to be open source
- Apache 2.0: Good but adds patent language complexity
- Proprietary: Defeats open source mission

---

## How to Add a Decision

When making a significant decision:

1. **Capture it in your commit message:**
   ```
   feat: add support for Fathom MCP

   Decision: Integrate Fathom for meeting transcript analysis

   Context:
   - Projects often discuss architecture in meetings
   - Decision logs should capture these discussions
   - Fathom MCP provides meeting search and summarization
   - Decision extraction from meetings could populate decisions.md

   Consequences:
   - Adds optional dependency (Fathom MCP)
   - Fathom API key required
   - Only works with Fathom-recorded meetings
   - Opens up meeting analytics feature
   ```

2. **Add an entry to this file:**
   - Use the commit date
   - Link to the commit (use GitHub URL)
   - Keep the summary to one line
   - Include decision context and consequences

3. **Update related docs** if the decision changes:
   - **architecture.md** if it changes system design
   - **constraints.md** if it changes limitations or requirements
   - **requirements.md** if it changes project goals

## What Warrants a Decision Entry?

Add decisions that:
- Change system architecture
- Choose between technical alternatives (and reject other options)
- Affect multiple components or user experience
- Have long-term impact on project direction
- Answer questions future developers will have: "Why did they do it this way?"

Don't add:
- Minor implementation details (variable naming, method factoring)
- Standard practices (using git, GitHub workflows)
- Obvious choices (formatting markdown, using .md extension)
- Temporary workarounds ("TODO: fix this later")
- Bug fixes (unless the fix reveals an important design decision)
