# Deployment Guide

## Environments

Ctrl is a local-first CLI tool, not a server application. Distribution happens via two channels:

### Development
- **Setup:** `bun install && bun run dev`
- **Purpose:** Local development and testing
- **Testing:** Run `bun test` locally before pushing
- **Plugin testing**: Activate test plugins from `plugins/` directory

### Staging (Pre-release)
- **Channel:** GitHub Releases (pre-release tag)
- **Version:** `v0.x.0-rc.1` tags
- **Distribution:** npm pre-release (`npm install -g ctrl@rc`) or binary downloads
- **Purpose:** Community testing before stable release
- **Who**: Early adopters, plugin developers

### Production (Stable Release)
- **Channel:** GitHub Releases (stable tag)
- **Distribution:**
  - npm: `npm install -g ctrl` (latest stable)
  - Binaries: macOS, Linux, Windows (WSL) from GitHub Releases
  - Homebrew: `brew install ctrl` (post-MVP)
- **Version**: `v1.0.0`, `v1.1.0`, etc. (semver)
- **Purpose:** End users, production use

### Hosted Version (Post-MVP)
- **Cloud:** Ctrl running in cloud (Modo Ventures)
- **Not covered in MVP**; documented for future reference

## Deployment Process

### Automated Deployment (CI/CD)

**GitHub Actions Pipeline:**

```yaml
# .github/workflows/release.yml
name: Build & Release
on:
  push:
    tags: [v*]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test

  build:
    needs: test
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build
      - run: bun run build:binary  # Create standalone binary
      - uses: actions/upload-artifact@v3
        with:
          name: ctrl-${{ matrix.os }}
          path: dist/

  release:
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/download-artifact@v3
      - name: Publish to npm
        run: npm publish
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: ctrl-*/**/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Trigger workflow:**
- Tag a commit: `git tag v0.1.0 && git push origin v0.1.0`
- GitHub Actions automatically:
  1. Runs tests
  2. Builds binaries (macOS, Linux)
  3. Publishes to npm registry
  4. Creates GitHub Release with binaries

### Manual Deployment (Emergency)

If CI/CD fails and you need to release manually:

```bash
# Build locally
bun run build
bun run build:binary

# Publish to npm
npm publish

# Create GitHub release manually via web UI
# Upload binaries from dist/
```

## Pre-Release Checklist

Before creating a release tag (which triggers CI/CD → production):

- [ ] All tests passing (`bun test`)
- [ ] Code reviewed and merged to `main`
- [ ] Version bumped in `package.json` (semver)
- [ ] `CHANGELOG.md` updated with release notes
- [ ] Breaking changes clearly documented
- [ ] Plugin API changes reflected in docs
- [ ] Demo tested with released version (manual `bun run dev`)
- [ ] Binaries tested locally (`bun run build:binary && ./dist/ctrl`)
- [ ] Git tag created: `git tag vX.Y.Z`
- [ ] Commit message includes migration/breaking change notes (if any)

## Infrastructure

Ctrl is a **local-first CLI tool**, not a server application. Infrastructure is minimal:

### Distribution
- **npm package:** Published to [npmjs.com](https://npmjs.com)
- **GitHub Releases:** Binaries (macOS, Linux) attached to releases
- **Future: Homebrew:** Post-MVP, add formula for `brew install ctrl`

### Build Infrastructure
- **GitHub Actions:** Free CI/CD for testing, building, publishing
- **Bun binary:** Installed as dev dependency via `package.json`
- **Build artifact storage:** GitHub Releases (free)

### Optional: Hosted Version (Post-MVP, Modo Ventures)
- **Hosting:** Undecided (AWS, Vercel, custom)
- **Authentication:** OAuth2 (future)
- **Database:** PostgreSQL (for user accounts, team configs)
- **Storage:** S3 for user files (encrypted)
- **Not part of MVP**

### No Required Services for MVP
- No database (local editor, no sync)
- No real-time server (local-only)
- No email service (no accounts in MVP)
- No CDN (binaries are small, GitHub CDN is fine)

## Configuration

### Environment Variables (MVP: Minimal)

**For users running Ctrl:**
```bash
# Required (user sets this)
ANTHROPIC_API_KEY=sk-ant-...     # Claude API key
# or
OPENAI_API_KEY=sk-...             # Alternative AI provider

# Optional
CTRL_CONFIG_DIR=~/.config/ctrl             # Where config files live (default: ~/.config/ctrl)
CTRL_PLUGIN_DIR=~/.config/ctrl/plugins     # Where plugins are installed
```

**For developers (building Ctrl):**
```bash
# .env.development (git ignored)
ANTHROPIC_API_KEY=sk-ant-...     # For testing AI features
```

### Secrets Management

Ctrl is **local-first**; secrets stay on user's machine:
- Users provide their own API keys
- Keys stored in OS credential storage (macOS Keychain, Linux secret-tool, Windows Credential Manager)
- Config files are plain TOML; users shouldn't commit `.env` files
- No server-side secrets in MVP

**For CI/CD:**
- GitHub Secrets: Only `NPM_TOKEN` for publishing
- No production credentials needed (local tool)

## Database Migrations

**N/A for MVP.** Ctrl is a local editor, not a server application.

If/when Modo Ventures hosted version is built:
- Migrations would be handled server-side
- Not part of MVP, not documented here yet

## Configuration Management

### User Configuration
Users configure Ctrl via TOML files in `~/.config/ctrl/`:
- `config.toml` - Editor settings
- `keymaps.toml` - Keybindings
- `ai.toml` - AI configuration
- `plugins.toml` - Plugin settings

Users can version control these:
```bash
ln -s ~/dotfiles/ctrl ~/.config/ctrl
# Or symlink individual files
```

### Release Configuration
No per-release configuration changes. Version changes are:
- Git tag: `git tag vX.Y.Z`
- Package.json version: `"version": "X.Y.Z"`
- npm publish uses package.json version automatically

## Rollback Procedure

For a CLI tool, "rollback" means users downgrade to a previous version:

### When to Rollback
- Critical bug in released version
- Security vulnerability discovered
- Plugin system broken in new release
- User data corruption

### How to Rollback

**Users downgrade:**
```bash
# Back to previous version (NPM)
npm install -g ctrl@0.5.0

# Or download previous binary from GitHub Releases
```

**Core team rolls back release:**
1. If bug found immediately after npm publish:
   ```bash
   npm deprecate ctrl@0.6.0 "Critical bug - use 0.5.0"
   ```
2. Create fix in new branch
3. Create new release (0.6.1)

**If data corruption occurred:**
- Ctrl is a text editor; user data = their files
- Ctrl doesn't corrupt files (that would be catastrophic bug)
- Users can restore from git/backup as usual

### Rollback Prevention
- **Beta releases**: Tag as `v0.6.0-rc.1` before stable
- **Early adopter testing**: Post in GitHub issues asking for feedback
- **Semantic versioning**: Breaking changes only in major versions

## Health & Monitoring

Ctrl is a local CLI tool, not a server. No uptime to monitor.

### What Users Should Test After Installation
```bash
# Verify installation
ctrl --version

# Verify AI connection (optional)
# Users test this manually by opening a chat panel

# No automated health checks needed
```

### Plugin Health (Post-MVP)
Future: Plugin registry might have health checks:
- Plugin loads without crashing
- Plugin's declared permissions are accurate
- Plugin doesn't have known security issues

## Release Schedule

### Release Cadence
- **Prototype:** Weekly or as-needed (not a regular release)
- **MVP (0.x):** Every 2 weeks (0.1.0, 0.2.0, etc.)
- **v1.0+:** Monthly or as-needed

### Announcement & Rollout
- Tag commit: `git tag v0.2.0`
- GitHub Actions builds & publishes automatically
- Announce in:
  - GitHub Releases page (release notes)
  - Twitter/social media
  - Dev communities (HN, Reddit, etc. for major releases)
  - Plugin developers (API changes)

### No Maintenance Windows
- No servers to patch
- Releases are opt-in (users upgrade when ready)
- Can publish anytime
- No scheduled downtime

## Post-Release Verification

### Manual Testing (Before Release)
```bash
# 1. Build locally and test
bun run build
bun run build:binary
./dist/ctrl --version

# 2. Test core features
./dist/ctrl /tmp/test.ts
# ... manual editing, modal testing, plugin loading

# 3. Test AI features
# ... open chat panel, test completions

# 4. Test plugin system
# ... load a test plugin from plugins/

# 5. Smoke test on different OS
# ... test binary on macOS, Linux, or in WSL
```

### Monitoring Release Health
- **GitHub Releases:** Check download counts (week after release)
- **GitHub Issues:** Watch for bug reports
- **Twitter/social:** Monitor response to announcement
- **Email**: Respond to user feedback quickly

### Rollback Decision
If critical bug reported within 1 hour of release:
- Publish `npm deprecate ctrl@X.Y.Z "Critical bug, use X.Y.(Z-1)"`
- Fix bug and publish X.Y.(Z+1)
- Announce fix in GitHub issue

## Troubleshooting

### Common Issues

**Issue:** Binary doesn't run on Linux
- **Cause:** `openTUI` dependency issue, glibc mismatch
- **Solution:** Build binary on target platform in CI, use musl libc

**Issue:** npm install fails
- **Cause:** Network issue, registry down
- **Solution:** Retry, check npm registry status

**Issue:** Plugin loads but crashes editor
- **Cause:** Plugin has bug, plugin API misuse
- **Solution:** Load plugin in isolate first (sandbox test), check permissions

### Getting Help
- Check GitHub Issues for similar problems
- Create new issue with:
  - Output of `ctrl --version`
  - Steps to reproduce
  - Error messages
  - System info (macOS/Linux, version)

## Access & Permissions

### Publishing Access
- **npm package:** `@erikperkins` account (owner)
- **GitHub Releases:** Anyone with `write` access to repo
- **npm token:** Stored in GitHub Secrets (NPM_TOKEN)

### Future: Plugin Registry Access
- Registry hosted TBD (GitHub, custom, npm scope)
- Plugin authors submit PRs or use registry API

## Compliance & Auditing

### Change Tracking
- All releases tagged in Git
- Release notes in GitHub Releases
- Commits linked in release notes
- `CHANGELOG.md` documents all changes

### Version Policy
- **Semantic versioning:** MAJOR.MINOR.PATCH
- **Pre-release:** vX.Y.Z-rc.N (release candidates)
- **Breaking changes:** MAJOR version bump, documented in release notes

### Security Patches
- Security issues reported to `security@ctrl.local` (TBD)
- Fixed in private branch, released as patch version
- Severity communicated in release notes

## For LLMs

When suggesting deployments or changes:
- Consider impact on all environments
- Note if database migrations are needed
- Flag if environment variables need updates
- Mention monitoring/alerting implications
- Consider rollback plan
- Think about zero-downtime requirements
