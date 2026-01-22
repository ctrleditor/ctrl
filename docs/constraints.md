# Constraints

## Technical Constraints

### Language & Runtime

**Bash is the only allowed implementation language:**
- Installation script MUST be POSIX-compatible bash (sh compatible)
- Rationale: Ensures maximum compatibility across Unix-like systems; no runtime dependencies
- No Node.js, Python, Ruby, or other runtimes allowed in core tooling
- Future: CLI tooling can use other languages, but only as optional enhancements

**Markdown is the only documentation format:**
- All templates MUST be GitHub Flavored Markdown
- Rationale: Renders in GitHub, GitLab, Gitea, and any text editor
- No HTML, PDF, or proprietary formats

### Performance

**Installation must be fast:**
- Install script execution: < 5 seconds target
- Symlink creation: < 1 second
- No slow operations (downloads, compiles, builds)
- Rationale: One-command install should feel instant; users copy/paste from marketing site

**No runtime performance requirements:**
- CtrlSpec is static documentation; no servers, databases, or API calls
- MCP integration (Atlassian, Fathom) is optional and user-initiated
- Performance responsibility is on the integrated systems, not CtrlSpec

### Compatibility

**Operating systems supported:**
- Linux (primary): Ubuntu 20+, Debian 11+, CentOS 8+, Fedora 34+
- macOS: 11+ (Big Sur and later)
- Windows: WSL2 (Windows Subsystem for Linux 2)
- Windows: Git Bash, MinGW (best effort, not guaranteed)
- Not supported: Native Windows PowerShell, cmd.exe (users must use Git Bash or WSL)

**Shell compatibility:**
- Must work with: bash, sh (POSIX)
- Must work with zsh, fish as user shell
- No bash 4.0+ features (macOS ships bash 3.2)
- Use `/usr/bin/env bash` for shebang

**File system compatibility:**
- Symlinks must work: ext4, APFS, NTFS (WSL), HFS+
- Handle broken symlinks gracefully
- Handle existing files (no silent overwrites)
- Max path length: 255 characters (common limit)

**Git compatibility:**
- Must work with: Git 2.20+
- Documentation committed to git repositories
- Users can use GitHub, GitLab, Gitea, or self-hosted git

### Infrastructure

**No external services required:**
- Can operate completely offline after installation
- Optional: Atlassian MCP requires user to provide OAuth token
- Optional: Fathom MCP requires user to provide API key
- No CtrlSpec-controlled servers or cloud services

**Hosting:**
- Primary: GitHub (templates served via raw.githubusercontent.com)
- Fallback: No automatic fallback (user can clone repo directly)
- Distribution: HTTP + SHA256 verification (future: code signing)

### Resource Requirements

**Minimal system requirements:**
- Disk space: < 1MB for full installation
- Memory: None (static files only)
- CPU: None
- Network: Required only for initial download

## Business Constraints

### Licensing

**MIT License is mandatory:**
- All code and templates must be MIT-compatible
- Cannot use GPL, AGPL, or other copyleft licenses
- Rationale: CtrlSpec must be usable in any project (commercial, proprietary, etc.)
- Contributors must agree to MIT when submitting PRs

### Scope

**What CtrlSpec DOES NOT do:**
- Does not generate code documentation (no JavaDoc, JSDoc generation)
- Does not replace existing documentation systems (Confluence, Notion, ReadTheDocs)
- Does not provide hosting for documentation
- Does not validate or lint documentation (future: optional tooling)
- Does not enforce specific technologies or architecture patterns
- Does not provide project management or issue tracking
- Does not include AI model training or data collection

**What CtrlSpec DOES:**
- Provides template structure for consistent documentation
- Creates symlinks so AI tools can find documentation
- Integrates with MCP servers for data enrichment
- Guides developers on how to document decisions and architecture

### Community & Contributions

**Open source principles:**
- Accepts community contributions (issues, PRs)
- Must maintain backwards compatibility between versions (semver)
- Long-term maintenance commitment required
- Community-driven roadmap (what gets prioritized)

**Backwards compatibility:**
- Install script must not break existing projects
- Templates can be updated; symlinks must continue to work
- MCP configuration must be extensible without breaking changes
- Deprecation must be documented; breaking changes require major version bump

### Timeline

**Release schedule:**
- No fixed release date or timeline
- Driven by community needs and maintenance capacity
- Security fixes released as soon as possible
- Features released when ready, not on schedule

## Technology Constraints

### Approved Technologies

**MUST use (Core/CLI):**
- TypeScript (for CLI implementation in Phase 2+)
- Bun (runtime for CLI, package manager, native test runner)
- Biome (unified linter and formatter - root-level integration via Turborepo)
- Turborepo (task orchestration and caching for monorepo)
- Markdown (GitHub Flavored for templates)
- Bash (POSIX-compatible for install script)
- JSON (for configuration)
- Git (for version control)
- GitHub (for distribution)

**CAN use (optional):**
- GitHub Actions (for CI/CD)
- MCP servers (Atlassian, Fathom, community-provided)
- Commander.js (CLI argument parsing)
- Chalk (terminal colors)
- Ora (terminal spinners)
- Remark (markdown parsing)

**CANNOT use:**
- Prettier (use Biome only)
- ESLint (use Biome only)
- Vitest (use Bun's native test runner only)
- npm, pip, or other package managers for core distribution
- Docker or containers (users can add their own)
- Databases (configuration only, no data storage)
- External APIs (except MCP servers, which are optional)

**Rationale for restrictions:**
- Every additional dependency increases installation friction
- CtrlSpec must work in any environment (locked-down corporate laptops, servers, minimal VMs)
- Users already have git and bash; adding more is reasonable; adding runtimes is not

### Dependencies

**Required dependencies:**
- Git (assumed present on developer machines)
- Bash or POSIX sh (assumed present on Unix-like systems)
- curl or wget (for downloading install script)

**Optional dependencies:**
- Atlassian MCP: Requires OAuth token from Jira/Confluence
- Fathom MCP: Requires API key from Fathom.video
- Text editor or IDE: Any editor that reads markdown

**Forbidden dependencies:**
- No npm packages in install script
- No Python pip packages
- No system package managers (yum, apt, brew)
- No pre-compiled binaries (too risky, hard to distribute)

## Security Constraints

### No Data Collection

**CtrlSpec does not:**
- Collect telemetry or usage data
- Track installations or users
- Send data to external servers
- Require authentication to GitHub
- Phone home or report version information

**Privacy:**
- All documentation stays in user's local git repository
- No documentation is uploaded or sent anywhere
- MCP integrations are user-initiated; users provide credentials

### Authentication & Authorization

**CtrlSpec has no authentication:**
- No user accounts, passwords, API keys (except for MCP integrations)
- No permissions model (git permissions apply to documentation)
- Documentation is part of repository; git controls access

**MCP integrations:**
- Atlassian MCP: User provides OAuth token (CtrlSpec doesn't store it)
- Fathom MCP: User provides API key (CtrlSpec doesn't store it)
- Both are optional; CtrlSpec works without them

### Code Security

**Supply chain security:**
- Install script served from GitHub (assume GitHub is secure)
- No external dependencies in script (can't compromise external packages)
- Templates are static markdown (no code execution)
- Security updates released via GitHub releases

**Future considerations:**
- Code signing for releases (gpg signatures)
- SHA256 verification of downloads
- Dependency audit for any future tooling

## Operational Constraints

### Availability & Support

**CtrlSpec is free and unsupported:**
- No SLA or uptime guarantee
- No support hours or response time commitment
- Community-driven support (GitHub issues, discussions)
- Best effort maintenance; no paid support offerings

**Update frequency:**
- No guaranteed update schedule
- Driven by bug reports, feature requests, community needs
- Security fixes prioritized

### Monitoring & Maintenance

**No monitoring required:**
- CtrlSpec is a distribution package; nothing to monitor
- GitHub Actions or similar can validate templates (future)
- Community reports issues via GitHub

## Integration Constraints

### With AI Tools

**Claude Code:**
- Must use symlinks or direct file references
- CLAUDE.md must point to docs/llm.md
- .config/claude/mcp_config.json must point to .mcp.json

**Cursor:**
- Must use .cursorrules pointing to docs/llm.md
- .cursor/ directory must contain mcp.json symlink

**Other AI tools:**
- AGENTS.md symlink for general AI tools
- Support tool-specific conventions (requests welcome)

### With MCP Servers

**Atlassian MCP:**
- Requires user to provide OAuth token
- User can pull data into documentation manually
- No automatic sync (one-way, on-demand)

**Fathom MCP:**
- Requires user to provide API key
- User can search meetings and extract decisions
- No automatic sync (one-way, on-demand)

**Future MCP servers:**
- Must be opt-in (disabled by default in .mcp.json)
- Must include setup instructions
- Must not require CtrlSpec-controlled services

## Known Limitations

1. **No Windows native support**: PowerShell and cmd.exe not supported; requires Git Bash or WSL
   - Impact: Windows users must use WSL2 or Git Bash for installation

2. **No automatic documentation validation**: Templates can be filled incorrectly or left empty
   - Impact: Quality depends on user effort (future: optional linting tool could help)

3. **No version-specific template selection**: All projects get same templates
   - Impact: Future projects can't have different templates based on project type
   - Mitigation: Templates should be general-purpose; projects customize as needed

4. **Symlink overwrite behavior**: If user already has CLAUDE.md, install script can fail or overwrite
   - Impact: Users need to manually resolve conflicts on existing projects
   - Mitigation: Clear documentation on handling existing files

5. **No GUI installer**: Command-line only
   - Impact: Non-technical users may find installation harder
   - Rationale: Simpler distribution, lower maintenance burden

6. **Documentation must be manually updated**: No automatic sync with external systems (except optional MCP)
   - Impact: Documentation can get stale if not kept in sync with code
   - Mitigation: docs/llm.md emphasizes keeping docs fresh

## Trade-offs Accepted

1. **Simplicity over features**: Keep CtrlSpec minimal and focused
   - We're giving up: Rich features, web UI, real-time collaboration
   - Why: Lower maintenance burden, works offline, easy to understand

2. **Markdown over rich formatting**: Only GitHub Flavored Markdown
   - We're giving up: Custom formatting, styling, embedded media
   - Why: Universal compatibility, renders in any text editor/platform

3. **Bash over modern language**: Install script in bash instead of Python/Node
   - We're giving up: Type safety, modern language features, easier debugging
   - Why: No runtime dependencies, works on minimal systems, immediate compatibility

4. **No enforcement**: Templates are optional, documentation updates are manual
   - We're giving up: Guaranteed documentation quality, automated validation
   - Why: Treats developers as adults, respects project autonomy

5. **Community-maintained**: No commercial backing or guaranteed support
   - We're giving up: Paid support, guaranteed uptime, dedicated maintenance
   - Why: Transparent, sustainable, avoids vendor lock-in
