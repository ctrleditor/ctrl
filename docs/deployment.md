# Deployment Guide

## Distribution Model

CtrlSpec is distributed via GitHub as an open source project. There are no traditional "environments" (dev/staging/prod). Instead:

- **Development happens on `main` branch** (or feature branches)
- **Releases are tagged** with semantic versions (v1.0.0, v1.1.0, v2.0.0)
- **Users install via GitHub** (either direct clone or curl script download)
- **No build/compile step** - templates and scripts are deployed as-is

## Release Process

### When to Release

**Create a new release when:**
- Adding new features (MINOR version bump)
- Fixing bugs (PATCH version bump)
- Making breaking changes (MAJOR version bump)
- Significant documentation improvements
- Community-requested changes

**Do NOT release for:**
- Typo fixes in template examples (batch with other changes)
- Comment-only changes
- CI/CD configuration changes (internal only)

### Version Numbering (Semantic Versioning)

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Breaking changes to install script, symlink structure, or template sections that users depend on
- **MINOR**: New features, new templates, new MCP integrations (backwards compatible)
- **PATCH**: Bug fixes, template clarifications, security fixes

**Examples:**
- `v0.1.0` → `v0.2.0`: Add support for new AI tool → MINOR
- `v0.2.0` → `v0.2.1`: Fix symlink on Windows WSL → PATCH
- `v0.2.1` → `v1.0.0`: Redesign install script → MAJOR

### Pre-Release Checklist

Before creating a GitHub release:

- [ ] All tests passing locally (run `bash tests/install.test.sh`)
- [ ] Tests passing in CI (GitHub Actions green)
- [ ] Code reviewed and merged to `main`
- [ ] Version number decided (major/minor/patch)
- [ ] `CHANGELOG.md` updated with release notes
- [ ] Commit message includes decision context (if applicable)
- [ ] Templates validated for completeness
- [ ] Install script tested manually on Linux and macOS (or wait for CI)
- [ ] Backwards compatibility verified (old installations still work)

### How to Create a Release

#### Step 1: Update Version and Changelog

Update version in relevant files:
```bash
# Update version in files (if version file exists)
# Update CHANGELOG.md with changes for this release
# Commit changes
git add CHANGELOG.md [version files]
git commit -m "chore: bump version to v1.2.3"
```

#### Step 2: Create Git Tag

```bash
git tag -a v1.2.3 -m "Release v1.2.3: Add support for Fathom MCP

### Features
- Add Fathom MCP server configuration
- Improve symlink handling on Windows

### Bug Fixes
- Fix template spacing issues

See CHANGELOG.md for full details."
```

#### Step 3: Push and Create GitHub Release

```bash
git push origin main
git push origin v1.2.3
```

Then create release on GitHub:
- Go to https://github.com/ctrleditor/ctrlspec/releases/new
- Select the tag you just pushed
- Title: "Release v1.2.3"
- Description: Copy from CHANGELOG.md
- Mark as "latest release" (uncheck if pre-release)
- Publish

#### Step 4: Verify Release

- [ ] GitHub release page looks correct
- [ ] Tag appears in releases
- [ ] raw.githubusercontent.com URL works (test after ~30 seconds delay)
  ```bash
  curl -s https://raw.githubusercontent.com/ctrleditor/ctrlspec/v1.2.3/install.sh | head -5
  ```
- [ ] Installation instructions still point to correct version or `main`

## Distribution Channels

### Primary: GitHub Raw URL

```bash
# Always points to latest version on main
curl -fsSL https://raw.githubusercontent.com/ctrleditor/ctrlspec/main/install.sh | sh

# Pin to specific version
curl -fsSL https://raw.githubusercontent.com/ctrleditor/ctrlspec/v1.2.3/install.sh | sh
```

**Advantages:**
- Automatic updates on `main`
- Simple one-line installation
- CDN-backed (fast worldwide)

**Disadvantages:**
- Always bleeding edge if not pinned
- Requires network access

### Secondary: Direct Clone

```bash
git clone https://github.com/ctrleditor/ctrlspec.git
cd ctrlspec
bash install.sh
```

**Advantages:**
- Full version control history
- Can inspect scripts before running
- Works offline after clone

**Disadvantages:**
- Requires git
- More steps for users

### Future: Package Managers

Could eventually distribute via:
- Homebrew (macOS/Linux)
- AUR (Arch Linux)
- CocoaPods (unlikely, not applicable)

**Not planned currently** - focus on simplicity.

## Backwards Compatibility

**Critical: Never break existing installations**

When making changes:

1. **Install script** - Ensure old installations still work
   - Don't change symlink paths without migration logic
   - Don't require new dependencies without fallback
   - Handle both old and new configurations

2. **Templates** - Can be improved but not restructured
   - Can add new sections (users won't be affected)
   - Don't remove or rename sections (breaks documentation navigation)
   - Can improve examples and descriptions

3. **MCP configuration** - New integrations must be disabled by default
   - Don't change existing server configurations
   - New servers added with `"enabled": false`

**If breaking change is necessary:**
- Requires MAJOR version bump
- Document migration path in release notes
- Consider providing migration script
- Announce prominently in README

## Rollback Procedure

### If Release Breaks Existing Installations

**Immediate:**
1. Create new release with version bump (v1.2.4)
2. Fix the issue
3. Announce in GitHub issues/discussions

**Users affected:**
- Those using `main` will get fix immediately (on next install or via `git pull`)
- Those pinned to broken version `v1.2.3` need to manually update or re-run with `main`

**Prevent re-occurrence:**
- Add test for the broken scenario
- Review changes more carefully

### If Release Breaks Tests

If release passes tests but breaks real-world installations:

1. Analyze failure reports from community
2. Create test case that reproduces issue
3. Fix in new PATCH release
4. Release quickly

## Infrastructure & Distribution

### Hosting
- **GitHub repository**: Source of truth
- **GitHub Releases**: Release packages and notes
- **raw.githubusercontent.com**: CDN-backed template delivery

### Backups & Continuity
- GitHub repo is backed up to `ctrleditor/ctrlspec` (redundancy via GitHub)
- Releases are immutable once published
- Community can fork if needed

### Monitoring
- GitHub Actions runs tests on every push
- Community reports issues via GitHub Issues
- No external monitoring required (it's static content)

## Configuration

### Environment Variables

CtrlSpec doesn't use environment variables for installation. However:

**For MCP integration, users set:**
```bash
export FATHOM_API_KEY="your-api-key"
```

**For testing:**
```bash
SKIP_TESTS=1 bash install.sh  # Skip tests in install
```

### No Secrets Needed

- CtrlSpec doesn't store secrets
- No API keys, tokens, or credentials in repo
- MCP servers configured by users with their own credentials

## Testing Before Release

### Local Testing

```bash
# Run all tests
bash tests/install.test.sh

# Manual installation on test machine
mkdir /tmp/test-ctrlspec
cd /tmp/test-ctrlspec
bash /path/to/install.sh
ls -la CLAUDE.md  # Verify symlink

# Verify all templates copied
ls -la docs/
```

### CI/CD Testing

GitHub Actions automatically runs on:
- Every push to main
- Every pull request
- Manual trigger via GitHub UI

**Platforms:**
- Ubuntu 20.04 (Linux)
- macOS 11 (macOS)
- Multiple bash versions (3.2, 4.0, 5.0)

### Community Testing

Before major releases:
- Open issue asking for testing help
- Document what to test
- Collect feedback

## Post-Release

### Announcement

For significant releases:
- Post in relevant forums/communities
- Update README.md if needed
- Share on social media (if applicable)

### Monitoring

After release:
- Monitor GitHub Issues for bug reports
- Respond to user questions
- Fix critical issues immediately

### Documentation

- Update docs/ directory if docs template changed
- Update llm.md if development guidelines changed
- Update README.md if installation changed

## Troubleshooting

### Release Didn't Appear on GitHub

**Possible causes:**
- Tag not pushed (`git push origin v1.2.3`)
- GitHub Actions still processing
- Tag already exists (delete and recreate)

**Solution:**
```bash
# Verify tag exists locally
git tag -l v1.2.3

# Verify pushed to GitHub
git ls-remote --tags origin v1.2.3

# Manually create release if tag exists but release doesn't
# Go to https://github.com/ctrleditor/ctrlspec/releases/new
```

### Install Script URL Not Working

**Possible causes:**
- Waiting for GitHub CDN to cache (up to 5 minutes)
- Wrong branch/tag name
- File was deleted

**Solution:**
```bash
# Test raw URL directly
curl -I https://raw.githubusercontent.com/ctrleditor/ctrlspec/v1.2.3/install.sh

# Check GitHub UI for file
# https://github.com/ctrleditor/ctrlspec/blob/v1.2.3/install.sh
```

### Users Getting Old Version

**Possible causes:**
- Using old URL with `main` branch (getting old main, not latest release)
- Pinned to old version tag
- Local cache issue

**Solution:**
- Instruct users to use latest main or specific version tag
- For pinned versions, users must explicitly update

## For LLMs

When preparing a release:
- Ensure backwards compatibility; old installations must still work
- Update CHANGELOG.md before pushing to main
- Include decision context in commit messages for significant changes
- Test on multiple platforms before releasing
- Announce breaking changes prominently
- Consider impact on existing projects using CtrlSpec
