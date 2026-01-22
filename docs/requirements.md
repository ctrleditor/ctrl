# Requirements

> **💡 Pro tip:** If you use Jira/Confluence, you can auto-populate this file using the
> [Atlassian MCP server](https://github.com/atlassian/atlassian-mcp-server).
> Connect it to Claude.ai and ask: "Pull our product requirements from Jira and format them for docs/requirements.md"

## Project Overview

CtrlSpec provides structured documentation templates designed specifically to help AI coding assistants (Claude Code, Cursor) understand and navigate codebases effectively. It creates comprehensive documentation of projects through AI-friendly templates that bridge the gap between developer knowledge and AI context by capturing business rationale, technical decisions, constraints, and architecture in living, version-controlled documents.

## Business Goals

- **Enable better AI-assisted development**: Provide AI tools with the context needed to make informed decisions and write better code
- **Reduce AI prompt overhead**: Eliminate the need to repeatedly explain project context, decisions, and constraints to AI tools
- **Preserve institutional knowledge**: Create a permanent record of why architectural decisions were made, improving onboarding and future development
- **Streamline MCP integrations**: Make it easy to connect multiple data sources (Jira, Confluence, meeting transcripts) to enrich documentation
- **Establish documentation standards**: Create a framework that makes documentation a first-class part of development workflow

## Target Users

- **Individual developers and small teams**: Using Claude Code or Cursor to accelerate development
- **Open source maintainers**: Need to guide AI tools and new contributors through project intent
- **Enterprise development teams**: Require institutional knowledge capture and standardized documentation
- **AI tool integrators**: Building Claude Code or similar AI development tools that benefit from structured project context

## Functional Requirements

### Core Features

1. **Documentation Templates**
   - Description: Provide seven standardized markdown templates covering requirements, architecture, decisions, constraints, testing, deployment, and LLM guidance
   - User story: As a developer, I want pre-written templates so that I can quickly populate project documentation without starting from scratch
   - Acceptance criteria:
     - [ ] Templates are comprehensive but not overwhelming
     - [ ] Each template has clear TODO sections and examples
     - [ ] Templates work across different project types (web, CLI, library, etc.)

2. **Automatic Symlinks for AI Tools**
   - Description: Automatically create symlinks that point AI tools (Claude, Cursor) to the correct documentation
   - User story: As a developer, I want my documentation automatically discovered by AI tools so that I don't need to manually configure paths
   - Acceptance criteria:
     - [ ] Creates `CLAUDE.md` → `docs/llm.md` for Claude Code
     - [ ] Creates `.cursorrules` → `docs/llm.md` for Cursor
     - [ ] Creates `AGENTS.md` → `docs/llm.md` for other agents
     - [ ] Creates `.cursor/` directory with appropriate links

3. **MCP Server Configuration**
   - Description: Pre-configure MCP servers (Atlassian, Fathom) that can auto-populate documentation
   - User story: As a developer with Jira/Confluence, I want to pull requirements directly into docs so that my documentation stays current
   - Acceptance criteria:
     - [ ] Atlassian MCP configuration works out of the box
     - [ ] Fathom MCP configuration includes setup instructions
     - [ ] `.mcp.json` is properly symlinked for Claude Code

4. **Installation & Setup Script**
   - Description: One-command installation that downloads templates, creates symlinks, and configures MCP
   - User story: As a developer, I want to add CtrlSpec to my project in one command so that setup is frictionless
   - Acceptance criteria:
     - [ ] `curl | sh` installation script works
     - [ ] Script handles existing files gracefully (backup/merge)
     - [ ] Minimal dependencies (bash, git)

5. **Conventional Commit Integration**
   - Description: Support capturing architectural decisions in commit messages using Decision/Context/Consequences format
   - User story: As a developer, I want to document decisions right in my commits so that context is never separated from code
   - Acceptance criteria:
     - [ ] LLM guide documents decision commit format
     - [ ] decisions.md serves as index linking to commits

6. **Modern CLI Tooling** (Phase 2)
   - Description: TypeScript-based CLI providing validation, synchronization, and management of CtrlSpec documentation using Bun runtime
   - User story: As a developer, I want programmatic tools to manage my documentation so that it stays fresh and complete
   - Acceptance criteria:
     - [ ] `ctrlspec check` validates docs completeness and reports TODOs
     - [ ] `ctrlspec sync` automatically updates decisions from git history
     - [ ] `ctrlspec init` scaffolds new projects with templates
     - [ ] `ctrlspec validate` checks for broken links and missing sections
     - [ ] `ctrlspec stats` shows documentation coverage metrics
     - [ ] Commands have clear, colored output with progress indicators
     - [ ] Works on Linux, macOS, and Windows (WSL)
     - [ ] Installable via npm as `ctrlspec` CLI
     - [ ] Built with Bun runtime and TypeScript
     - [ ] Uses Biome for code quality (linting/formatting)
     - [ ] Monorepo coordinated with Turborepo for task orchestration

7. **Documentation Validation System** (Phase 2)
   - Description: Parse and analyze CtrlSpec markdown files for completeness
   - User story: As a project lead, I want to know if our documentation is complete so that we maintain quality standards
   - Acceptance criteria:
     - [ ] Detect all [TODO] items across documentation
     - [ ] Validate all required sections exist in each template
     - [ ] Check that decision.md links point to real git commits
     - [ ] Detect broken internal links
     - [ ] Report statistics: docs complete, TODO count, decision count
     - [ ] Provide actionable suggestions for improvements

8. **Git History Integration** (Phase 2)
   - Description: Automatically extract architectural decisions from conventional commits
   - User story: As a developer, I want decisions to be kept in sync automatically so that I don't need to manually maintain decisions.md
   - Acceptance criteria:
     - [ ] Scan git history for commits with "Decision:" format
     - [ ] Parse Decision/Context/Consequences blocks
     - [ ] Update decisions.md with new entries from recent commits
     - [ ] Handle decision supersession and deprecation
     - [ ] Show preview before updating

### Secondary Features

- Interactive setup wizard (versus silent script)
- GitHub Actions workflow templates for documentation validation
- Documentation linting (required sections, format checking)
- Change log integration and validation
- Web-based documentation viewer
- Support for additional MCP servers beyond Atlassian/Fathom
- Stack-specific templates (TypeScript, Rust, Go, Zig)
- MCP server for CtrlSpec (list TODOs, get decisions, validate docs, sync from commits)

## Non-Functional Requirements

### Performance

- Installation script completes in < 5 seconds
- Symlink creation is instant
- No runtime performance impact on projects using CtrlSpec

### Security

- No authentication required for basic usage
- MCP servers only access data user explicitly provides credentials for
- No external data collection or telemetry
- All documentation is stored locally and version-controlled

### Reliability

- Templates work across different OS (Linux, macOS, Windows with WSL)
- Symlinks handle existing files without data loss
- MCP configuration doesn't break if servers are unavailable

### Usability

- Templates are self-documenting with clear guidance for each section
- Accessibility of markdown files is assumed (text-based, widely supported)
- Works with any editor or AI tool that can read markdown

## Success Metrics

- Projects using CtrlSpec report better AI assistance quality (measured via feedback)
- Reduction in repeated explanations needed when talking to AI tools
- Documentation completion rate (percentage of templates filled out)
- Adoption rate among Claude Code and Cursor users
- Positive community feedback and GitHub stars

## Out of Scope

- Replacing existing documentation systems (Confluence, Notion, etc.)
- Enforcing specific technology choices or architecture patterns
- Built-in documentation generation from code (JavaDoc, JSDoc, etc.)
- Web hosting or deployment of documentation
- Project management or issue tracking integration (beyond MCP servers)
- AI model training or fine-tuning using documentation

## Dependencies

- Git: Required for version control of documentation
- Bash: Required for installation script
- MCP Servers (optional): Atlassian MCP and Fathom MCP for enhanced data integration
- Claude Code or Cursor: AI tools that consume the documentation

## Assumptions

- Developers will keep documentation up to date with code changes
- Projects value capturing architectural decisions for future reference
- Markdown is an acceptable format for documentation
- Developers have some level of access to commit messages and git history
- Users want to improve their AI tool interactions, not replace human developers

## Open Questions

- Should CtrlSpec provide tooling to validate that templates are filled out adequately?
- How should CtrlSpec handle projects that already have extensive documentation?
- Should there be a way to customize which sections are required vs. optional?
- Should CtrlSpec support non-English documentation?
