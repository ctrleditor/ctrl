# Architecture

## Overview

CtrlSpec is a documentation framework—not a traditional application with runtime code. It consists of three main parts: **template files** (markdown documentation), **installation tooling** (bash scripts for setup), and **configuration files** (for MCP servers). The framework is designed to be dropped into any project and immediately provide AI-friendly documentation structure through templates, symlinks, and optional MCP integrations.

The architecture prioritizes **simplicity**, **file-based design**, and **zero runtime dependencies**. All documentation is version-controlled markdown; setup is a simple bash script; configuration is human-editable JSON.

## System Design

### Architecture Pattern

- **Pattern:** Static templates + installation tooling
- **Rationale:** Projects should own their documentation (stored in git, not external systems). Installation should be trivial (one command). No database, no servers, no build step—just files and symlinks.

### Components

```
┌──────────────────────────────────────────────────────────┐
│  Developer's Project                                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┐        ┌──────────────────────┐  │
│  │  docs/          │        │ Symlinks             │  │
│  ├─ llm.md         │◀───┬───├ CLAUDE.md            │  │
│  ├─ requirements   │    │   ├ .cursorrules         │  │
│  ├─ architecture   │    │   ├ AGENTS.md           │  │
│  ├─ decisions      │    │   └ .cursor/mcp.json    │  │
│  ├─ constraints    │    │                          │  │
│  ├─ testing        │    └───┬──────────────────────┘  │
│  └─ deployment     │        │                         │
│                    │        │  MCP Config (.mcp.json) │
│                    │        └──────────────────────────┘  │
│                    │                                     │
│                    └─────────────────────────────────────┘  │
│                              ▲                          │
│                              │                          │
└──────────────────────────────┼──────────────────────────┘
                               │
                     ┌─────────┴──────────┐
                     │                    │
                  ┌──────────────┐    ┌──────────────┐
                  │ Claude Code  │    │    Cursor    │
                  │ (reads docs) │    │ (reads docs) │
                  └──────────────┘    └──────────────┘
```

#### Component 1: Documentation Templates

- **Purpose:** Provide standardized, pre-written markdown templates for different documentation categories
- **Technology:** Markdown (GitHub Flavored Markdown)
- **Responsibilities:**
  - Define structure for requirements, architecture, decisions, constraints, testing, deployment
  - Include examples and guidance for each section
  - Serve as the "map" that AI tools read to understand the project
  - Live in `templates/docs/` and get copied to `docs/` in user's project

#### Component 2: Installation Script (`install.sh`)

- **Purpose:** One-command setup that copies templates, creates symlinks, and configures MCP
- **Technology:** Bash (POSIX-compatible)
- **Responsibilities:**
  - Download templates from GitHub
  - Copy templates into user's project
  - Create symlinks for AI tools (CLAUDE.md, .cursorrules, AGENTS.md)
  - Set up .mcp.json configuration
  - Handle existing files gracefully (backup/merge)

#### Component 3: MCP Configuration

- **Purpose:** Define connections to external data sources (Atlassian, Fathom)
- **Technology:** JSON
- **Responsibilities:**
  - Configure Atlassian MCP server for Jira/Confluence integration
  - Configure Fathom MCP server for meeting transcript analysis
  - Be symlinked to `.config/claude/mcp_config.json` for Claude Code
  - Be symlinked to `.cursor/mcp.json` for Cursor

## Phase 2: Modern CLI Architecture

Building on the foundation above, Phase 2 introduces a TypeScript CLI tool for validation, synchronization, and project management.

### Turborepo + Biome Integration Pattern

#### Overview

CtrlSpec uses **Turborepo for task orchestration** and **Biome for linting/formatting**, with Biome running at the **root level** (not per-package) for optimal performance. All root-level `package.json` scripts delegate through `turbo run` to ensure consistent caching and task coordination.

**Reference:** [Turborepo + Biome Integration Guide](https://turborepo.dev/docs/guides/tools/biome)

#### Why Root-Level Biome?

Running Biome once at root (rather than in each package) provides:
- **Speed**: Biome checks entire codebase in single pass
- **Consistency**: One configuration file, one formatting standard
- **Caching**: Turborepo caches results based on file inputs
- **Simplicity**: No per-package configuration

#### Task Configuration (turbo.json)

Root tasks use `//#taskname` naming convention:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["biome.json", "bunfig.toml"],
  "tasks": {
    "//#format-and-lint": {
      "description": "Check and lint all code with Biome (read-only)",
      "outputs": [],
      "cache": true,
      "inputs": [
        "**/*.ts",
        "**/*.tsx",
        "**/*.js",
        "**/*.jsx",
        "**/*.json",
        "biome.json"
      ]
    },
    "//#format-and-lint:fix": {
      "description": "Check and fix all code with Biome",
      "outputs": [],
      "cache": false
    },
    "dev": {
      "description": "Run CLI in development mode",
      "outputs": [],
      "cache": false
    },
    "test": {
      "description": "Run tests with Bun",
      "outputs": [],
      "cache": false,
      "inputs": [
        "src/**/*.ts",
        "tests/**/*.test.ts",
        "bunfig.toml"
      ]
    },
    "lint": {
      "description": "Lint with Biome",
      "outputs": [],
      "cache": true
    }
  }
}
```

**Key points:**
- **`//#` prefix** indicates root-level tasks (see [Turborepo task naming](https://turborepo.dev/docs/core-concepts/running-tasks))
- **`:fix` suffix** for auto-fix variant of check tasks
- **`cache: true` for checks** - read-only operations (can reuse cached results)
- **`cache: false` for fixes** - modifies files (cannot cache)
- **`inputs`** array defines which files trigger cache invalidation

#### Root Scripts (package.json)

All root scripts delegate through `turbo run`:

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run //#format-and-lint",
    "format": "turbo run //#format-and-lint:fix",
    "check": "turbo run //#format-and-lint"
  }
}
```

#### How to Use

```bash
# Check code with Biome (cached, read-only)
bun run lint

# Fix code with Biome (non-cached, modifies files)
bun run format

# Run tests (non-cached, Bun's native runner)
bun run test

# Run CLI in development mode
bun run dev

# Or use Turborepo directly if needed
bunx turbo run //#format-and-lint      # Check
bunx turbo run //#format-and-lint:fix  # Fix
```

#### How to Add a New Task

If adding a new monorepo-wide task:

1. **Define in `turbo.json`** under `tasks`:
   ```json
   "newtask": {
     "description": "What this task does",
     "outputs": [],
     "cache": true,
     "inputs": ["**/*.ts", "turbo.json"]
   }
   ```

2. **Add to root `package.json` scripts**:
   ```json
   "newtask": "turbo run newtask"
   ```

3. **Implement in package `package.json`**:
   Each package that participates must have a `newtask` script:
   ```json
   "scripts": {
     "newtask": "echo 'Implementing task'"
   }
   ```

4. **Set `cache: false` if**:
   - Task modifies files (like fix operations)
   - Task has side effects (like server startup)
   - Results vary between runs

5. **Set `cache: true` if**:
   - Task is deterministic (same inputs = same outputs)
   - Examples: linting, type checking, testing

#### Common Patterns

**Check tasks (read-only, cacheable):**
```json
"check": {
  "description": "Check something",
  "cache": true,
  "inputs": ["src/**/*.ts", "config.json"]
}
```

**Fix tasks (modifies files, not cacheable):**
```json
"fix": {
  "description": "Auto-fix something",
  "cache": false
}
```

**Watch/Dev tasks (continuous, not cacheable):**
```json
"dev": {
  "description": "Development server",
  "cache": false
}
```

**CI tasks (deterministic, cacheable):**
```json
"test": {
  "description": "Run tests",
  "cache": false,
  "inputs": ["src/**", "tests/**", "test.config.ts"]
}
```

Note: `test` is set to `cache: false` because test results need to be current; don't cache old test runs.

#### References

- [Turborepo Task Configuration](https://turborepo.dev/docs/reference/configuration)
- [Running Tasks](https://turborepo.dev/docs/core-concepts/running-tasks)
- [Caching](https://turborepo.dev/docs/core-concepts/caching)
- [Biome Integration Guide](https://turborepo.dev/docs/guides/tools/biome)

### CLI Components

```
ctrlspec-cli/
├── packages/
│   ├── cli/                    # Main CLI tool
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── check.ts        # Validate docs completeness
│   │   │   │   ├── sync.ts         # Sync decisions from git
│   │   │   │   ├── init.ts         # Initialize new project
│   │   │   │   ├── validate.ts     # Check for broken links
│   │   │   │   ├── stats.ts        # Show coverage metrics
│   │   │   │   └── index.ts        # Main CLI entry
│   │   │   ├── templates/          # Embedded markdown templates
│   │   │   ├── parsers/            # Markdown parsing logic
│   │   │   └── cli.ts              # Main entry point
│   │   ├── tests/
│   │   │   └── *.test.ts
│   │   └── package.json
│   │
│   ├── core/                   # Shared utilities
│   │   ├── src/
│   │   │   ├── types.ts            # Type definitions
│   │   │   ├── markdown.ts         # Markdown parser
│   │   │   ├── git.ts              # Git history integration
│   │   │   ├── validators.ts       # Document validators
│   │   │   └── formatters.ts       # Output formatting
│   │   ├── tests/
│   │   │   └── *.test.ts
│   │   └── package.json
│   │
│   └── mcp-server/             # MCP server (Phase 3)
│       ├── src/
│       │   ├── tools/
│       │   │   ├── list-todos.ts
│       │   │   ├── get-decisions.ts
│       │   │   ├── validate-docs.ts
│       │   │   └── sync-from-commits.ts
│       │   └── index.ts
│       └── package.json
│
└── templates/                  # Source templates (unchanged)
```

#### CLI Workflow

```
User command: ctrlspec check
    │
    ├─→ Scan docs/ directory
    ├─→ Parse each markdown file
    ├─→ Extract TODOs, sections, links
    ├─→ Validate commit references in decisions.md
    ├─→ Calculate statistics
    └─→ Output colored report with recommendations
```

### Technology Stack (Phase 2+)

#### Core Languages

- **Primary:** TypeScript (CLI, core, validation)
- **Scripts:** Bash (installer, git operations)
- **Templates:** Markdown (GitHub Flavored)

#### Build & Runtime

- **Runtime:** Bun (faster, better TypeScript support)
- **Package Manager:** Bun workspaces ([Bun Workspaces Docs](https://bun.com/docs/pm/workspaces))
- **Build Orchestration:** Turborepo ([Turborepo Docs](https://turborepo.dev/docs) - High-performance build system with task caching and optimization)
- **Linter/Formatter:** Biome (unified tooling, no Prettier/ESLint)
- **CLI Framework:** Commander.js or oclif
- **Parsing:** Remark ecosystem (markdown AST)
- **Testing:** Bun's native test runner ([Bun Test Docs](https://bun.com/docs/guides/test/run-tests))
- **Output:** Chalk (colors), Ora (spinners)

#### Distribution

- **Distribution:** npm (package `ctrlspec`)
- **Hosting:** GitHub (source, templates)
- **CI/CD:** GitHub Actions
- **Versioning:** Semantic versioning via git tags

## Technology Stack

CtrlSpec has layered dependencies based on use case:

### Core (Bash Installation)

- **Primary:** Bash (for installation script)
- **Documentation:** Markdown (GitHub Flavored)
- **Configuration:** JSON

### CLI Layer (TypeScript, Optional)

- **Runtime:** Bun
- **Language:** TypeScript
- **Framework:** Commander.js (CLI parsing)
- **Parsing:** Remark (markdown AST)
- **Dependencies:** chalk, ora, inquirer

### External Dependencies

- **Git:** Required for version control and installation
- **Curl/wget:** Required for downloading installation script
- **Bun:** Required for running CLI (automatically installed via npm)
- **MCP Servers** (optional):
  - Atlassian MCP: Official MCP server for Jira/Confluence
  - Fathom MCP: Community MCP server for meeting transcripts

### Infrastructure

- **Hosting:** GitHub (templates stored in repository, source code)
- **Distribution:** GitHub (curl | sh) or npm (`npm install -g ctrlspec`)
- **CDN:** GitHub raw content CDN for templates
- **Package Registry:** npm for CLI tool
- **CI/CD:** GitHub Actions for tests and releases

## Project Structure

```
ctrlspec/
├── README.md                    # Main project documentation
├── install.sh                   # One-command installation script
├── .mcp.json                    # MCP server configuration (template)
├── LICENSE                      # MIT License
├── CHANGELOG.md                 # Version history
├── templates/                   # Source templates
│   ├── README.md               # Instructions for template users
│   ├── CHANGELOG.md            # Template changelog template
│   └── docs/                   # Core documentation templates
│       ├── llm.md              # Guide for AI tools (symlinked as CLAUDE.md, .cursorrules)
│       ├── requirements.md     # Business requirements template
│       ├── architecture.md     # Technical architecture template
│       ├── decisions.md        # Decision log index template
│       ├── constraints.md      # Technical/business constraints template
│       ├── testing.md          # Testing strategy template
│       └── deployment.md       # Deployment guide template
└── docs/                        # CtrlSpec's own documentation (populated during dogfooding)
    ├── llm.md
    ├── requirements.md
    ├── architecture.md
    ├── decisions.md
    ├── constraints.md
    ├── testing.md
    └── deployment.md
```

## Installation & Workflow

### User's Perspective

```bash
# 1. User installs CtrlSpec
curl -fsSL https://raw.githubusercontent.com/ctrleditor/ctrlspec/main/install.sh | sh

# 2. Script automatically:
#    - Downloads templates
#    - Copies to docs/
#    - Creates symlinks: CLAUDE.md → docs/llm.md, etc.
#    - Sets up .mcp.json
#    - Adds .cursorrules

# 3. User opens CLAUDE.md (or any symlink) in their AI tool
# 4. AI tool reads it and understands project structure/goals
# 5. User fills in templates with their project's specific context
# 6. Documentation stays in git, evolves with project
```

## Data Model

Not applicable—CtrlSpec is a static documentation framework with no database or runtime data model. All data is markdown files stored in git.

## Scalability Considerations

- **Per-project scale:** Each project maintains its own copy of templates (no shared state)
- **Community scale:** CtrlSpec itself is stateless; it can support unlimited projects
- **Distribution:** GitHub hosting means unlimited downloads via CDN
- **Bottlenecks:** None identified; bash installation is instant

## Security Architecture

- **No external authentication required** for basic usage
- **MCP servers** respect user-provided credentials (OAuth tokens for Atlassian, API keys for Fathom)
- **No telemetry:** CtrlSpec doesn't phone home or collect data
- **All documentation local:** Stays in user's git repository
- **No permissions model:** Documentation is part of the repository—git permissions apply

## Third-Party Integrations

### Atlassian MCP (Optional)

- **Purpose:** Pull requirements from Jira/Confluence directly into docs
- **Integration:** User configures in `.mcp.json` with OAuth token
- **Usage:** "Pull our requirements from Jira" → auto-populates docs/requirements.md

### Fathom MCP (Optional)

- **Purpose:** Search and summarize meeting transcripts for decisions
- **Integration:** User configures in `.mcp.json` with Fathom API key
- **Usage:** "Find meetings about auth and extract decisions" → generates decision entries

Both are opt-in; CtrlSpec works perfectly without them.

## Development Environment

### Prerequisites

- Bash shell (Linux, macOS, or Windows with WSL)
- Git
- Text editor or IDE
- Optional: Node.js (if contributing to CLI tooling in future)

### Local Development

```bash
# Clone repo
git clone https://github.com/ctrleditor/ctrlspec.git
cd ctrlspec

# Test installation script
bash install.sh --test-mode

# Or manually test by copying templates
cp templates/docs/* docs/

# Edit templates directly and test
# Commit changes and tag for release
```

### Configuration

- **`.mcp.json`**: Configure MCP servers (already includes examples)
- **`templates/docs/*.md`**: Edit templates directly to improve default content
- **`install.sh`**: Update script when adding new features (symlinks, MCP config, etc.)
