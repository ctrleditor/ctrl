# LLM Assistant Guide

> **Note:** This file may be symlinked as CLAUDE.md, AGENTS.md, .cursorrules, etc.
> for different AI coding tools. Edit `docs/llm.md` directly.

**Status:** Actively developed. Currently in Phase 2 (CLI development).

This document explains how to effectively use AI coding assistants with this repository.

## Documentation Structure

This repo uses documentation-as-context to help AI understand the project:

- **[requirements.md](requirements.md)** - Business requirements and project goals
- **[architecture.md](architecture.md)** - Technical architecture and system design
- **[constraints.md](constraints.md)** - Hard limitations (performance, compatibility, licensing, etc.)
- **[decisions.md](decisions.md)** - Index of key decisions (full context in git commits)
- **[testing.md](testing.md)** - Testing strategy and guidelines
- **[deployment.md](deployment.md)** - Deployment process and requirements

**Read these first** before making significant changes.

## Git Workflow

### Commits
We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user authentication
fix: resolve memory leak in cache
docs: update architecture decisions
feat!: breaking API change
```

**For decisions:** Include context directly in commit messages:
```
feat: migrate to postgres

Decision: Use PostgreSQL instead of MongoDB

Context: [why we're doing this]
Consequences: [tradeoffs and implications]
```

### Semantic Versioning
Suggest semver bumps based on commits:
- `feat!` or `BREAKING CHANGE` → MAJOR
- `feat` → MINOR
- `fix`, `perf` → PATCH
- `docs`, `style`, `refactor`, `test`, `chore` → no version bump

## Development Guidelines

### Before Making Changes
1. Read docs/requirements.md to understand project goals
2. Review docs/architecture.md to understand how CtrlSpec works
3. Check docs/constraints.md for limitations and design decisions
4. Review recent commits to see what's been worked on recently
5. Check docs/decisions.md to understand why previous decisions were made

### Critical: Permission-Based Tool Installation

**NEVER install tools, dependencies, runtimes, or system packages without explicit user permission.**

This includes:
- ❌ Installing Bun, Node.js, Python, or other runtimes
- ❌ Running `bun install`, `npm install`, or other package managers
- ❌ Installing system packages (apt, brew, etc.)
- ❌ Reinstalling or updating existing tools

**If a tool is missing or broken:**
1. Report the error clearly
2. Ask the user what they want to do
3. Wait for explicit instruction before taking action

**Example error handling:**
```
$ bun run lint
error: bun not found in PATH

❌ BAD:
  - Install Bun without asking

✅ GOOD:
  - Report: "Bun is not available in this session"
  - Ask: "Would you like me to install it, or should we troubleshoot the existing installation?"
  - Wait for user response
```

**Rationale:**
- Respects user control over their development environment
- Prevents accidental overwrites of user configurations
- Allows user to make informed decisions about dependencies
- Maintains trust and accountability

### Project Structure

**Source Templates:**
- `templates/docs/` - The core documentation templates that get distributed to projects
- `templates/README.md` - Instructions for projects using CtrlSpec

**CtrlSpec's Own Docs:**
- `docs/` - This directory; CtrlSpec's own documentation (for developers of CtrlSpec)

**Tooling:**
- `install.sh` - Installation script that copies templates and creates symlinks
- `.mcp.json` - MCP server configuration template

### When Making Changes

**For template changes:**
- Edit files in `templates/docs/`
- Ensure templates have clear guidance and examples
- Remember: these are consumed by other projects; make them comprehensive but not overwhelming
- Test by copying to a new project and seeing if they're intuitive

**For tooling changes:**
- Update `install.sh` for new installation features
- Update `.mcp.json` for new MCP integrations
- Document changes in `CHANGELOG.md`

**For documentation:**
- Update `docs/` files to reflect current understanding
- Update in the same commit as code changes
- If you discover docs are wrong, fix them immediately

### When Making Decisions

- Capture rationale in commit messages using the format below
- If it's a major architectural decision, add entry to `docs/decisions.md`
- Update `architecture.md` or `constraints.md` if decision changes how CtrlSpec works
- Consider how this affects projects using CtrlSpec (backwards compatibility)

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) with decision context:

**Regular commits:**
```
feat: add support for custom template sections
fix: handle existing symlinks gracefully
docs: clarify MCP configuration steps
```

**For decisions:**
```
feat: migrate template distribution from inline to GitHub files

Decision: Store templates in git repository instead of shell script

Context:
- Makes templates easier to update and maintain
- Allows version control of template changes
- Enables community contributions to templates
- One-command installation fetches from GitHub

Consequences:
- Requires curl/wget for installation
- Single source of truth (GitHub repo)
- Can version templates alongside CtrlSpec releases
```

### Code Conventions

**Bash (install.sh):**
- Use POSIX-compatible bash (no bash-isms)
- Add comments for complex logic
- Test on Linux, macOS, and Windows (WSL)
- Use set -e for error handling
- Quote variables consistently

**TypeScript (CLI):**
- **Always check Bun docs first** before choosing any tool (test runner, bundler, formatter, etc.)
- Use Biome for linting and formatting (ONLY Biome, never eslint/prettier)
- Use Bun's native test runner (`bun test`) - no Vitest or other frameworks
- Use Bun for all package management (`bun add [dep]`)
- Dependencies must be verified latest stable via `bun add` before committing
- Never manually add versions in code - use `bun add`
- Bun compiles TypeScript natively - no tsc needed
- Use Turborepo for monorepo task orchestration

**Tooling References:**
- [Biome](https://biomejs.dev/) - Unified linter and formatter
- [Bun Workspaces](https://bun.com/docs/pm/workspaces) - Monorepo workspace management
- [Turborepo Docs](https://turborepo.dev/docs) - Monorepo build system for task orchestration, caching, and optimization
  - **Architecture:** See `docs/architecture.md` section "Turborepo + Biome Integration Pattern" for our implementation
  - **Quick pattern:**
    - All root `package.json` scripts use `turbo run` (e.g., `"lint": "turbo run //#format-and-lint"`)
    - Root tasks use `//#taskname` prefix (read-only checks) and `//#taskname:fix` (auto-fix variants)
    - Root-level Biome runs once for entire monorepo (not per-package)
    - Check tasks are cached (`cache: true`), fix tasks are not (`cache: false`)
    - Package-level tasks map to `turbo.json` task definitions
  - **When adding tasks:** Update both `turbo.json` (definition) and root `package.json` (script)
  - **Cache invalidation:** Define `inputs` in `turbo.json` for files that trigger re-runs
  - **Read First:** [Caching](https://turborepo.dev/docs/core-concepts/caching), [Running Tasks](https://turborepo.dev/docs/core-concepts/running-tasks), [Biome Integration](https://turborepo.dev/docs/guides/tools/biome)

**Markdown (templates & docs):**
- Use GitHub Flavored Markdown
- Keep sections concise with clear examples
- Use backticks for code, emphasis for UI elements
- Include "[TODO]" for sections users need to fill
- Group related TODOs with explanatory comments

**JSON (.mcp.json):**
- Keep structure simple and human-readable
- Include comments for setup steps
- Provide example configurations
- Document all required vs. optional fields

**Git:**
- Use atomic commits (one logical change per commit)
- Keep main branch always usable
- Tag releases with semver: v0.1.0, v0.2.0, v1.0.0

### Documentation Updates

When writing or updating documentation:
- **requirements.md**: Update when adding new features or changing project goals
- **architecture.md**: Update when changing how CtrlSpec works or adding components
- **constraints.md**: Update when discovering new limitations or design boundaries
- **testing.md**: Update when changing testing approach
- **deployment.md**: Update installation/release process changes
- **decisions.md**: Add entries for significant architectural choices

All documentation should be written for clarity, not brevity. Assume the reader is someone returning to the project after months away.

## Asking for Help

**Good prompts:**
- "Review the requirements and suggest an approach for [feature]"
- "Does this change align with our architecture decisions?"
- "What version bump does this warrant?"
- "Check if this violates any constraints"

**Provide context:**
- Link to relevant docs: "See docs/constraints.md for performance requirements"
- Reference decisions: "This relates to the postgres migration decision"
- Point to roadmap: "This is part of the Q4 auth work"

## Working with Turborepo + Biome

### Task Workflow

All development tasks run through Turborepo for caching and orchestration:

```bash
# Check code (cached - fast on repeated runs)
bun run lint

# Fix code (non-cached - always runs)
bun run format

# Run tests
bun run test

# Run CLI in dev mode
bun run dev
```

### Best Practices

**1. Always use root scripts, not direct commands:**
- ✅ Good: `bun run lint` (uses Turborepo, caches results)
- ❌ Bad: `biome lint .` (bypasses orchestration)

**2. Check before fixing:**
```bash
bun run lint      # See what Biome reports
bun run format    # Fix issues
```

**3. When adding a new monorepo task:**
- Define task in `turbo.json` under `tasks` section
- Add script to root `package.json` using `turbo run`
- Set `cache: true` if task is deterministic (same input = same output)
- Set `cache: false` if task modifies files or has side effects
- Add `inputs` array to define which files invalidate cache

**Example (adding a `build` task):**

```json
// turbo.json
{
  "tasks": {
    "build": {
      "description": "Build all packages",
      "cache": true,
      "inputs": ["src/**", "package.json"]
    }
  }
}

// package.json (root)
{
  "scripts": {
    "build": "turbo run build"
  }
}

// packages/*/package.json (each package)
{
  "scripts": {
    "build": "bun run build:ts && bun run build:docs"
  }
}
```

**4. Debugging cache issues:**
```bash
# Run without cache
bunx turbo run lint --no-cache

# Force re-run despite cache
bunx turbo run lint --force

# See what Turborepo is doing
bunx turbo run lint --verbose
```

**5. Biome configuration:**
- Edit only `biome.json` at root - don't create package-level Biome configs
- All code (entire monorepo) follows same formatting/linting rules
- Reference: [biome.json configuration](https://biomejs.dev/reference/configuration/)

## Keeping Documentation Fresh

Documentation lives with code and evolves with it:
- Update docs in the same commit as code changes
- If you find docs are wrong, fix them immediately
- Stale docs are worse than no docs
