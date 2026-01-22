# Testing Guidelines

## Philosophy

CtrlSpec is a documentation distribution framework with minimal runtime code. Testing focuses on:
- **Templates**: Validating markdown structure and completeness
- **Installation script**: Testing bash script logic (symlink creation, file copying, error handling)
- **Compatibility**: Ensuring it works across different OS and shell environments
- **Manual verification**: Hands-on testing of full installation flow

We emphasize **integration and compatibility testing** over unit tests, since the project is small and behavior matters more than internal structure.

## Test Structure

### Directory Layout

```
ctrlspec/
├── tests/                          # Test scripts and fixtures
│   ├── fixtures/                   # Test data
│   │   ├── sample-project/         # Mock project to test install on
│   │   └── templates/              # Template validation fixtures
│   ├── shell/                      # Bash test framework
│   │   └── test_helpers.sh         # Common test utilities
│   ├── install.test.sh             # Integration tests for install.sh
│   ├── templates.test.sh           # Template validation tests
│   └── README.md                   # How to run tests
├── install.sh                      # Installation script
├── .mcp.json                       # Configuration to test
└── templates/docs/                 # Templates to validate
```

### Naming Conventions

**Test files:**
- Bash tests: `*.test.sh` (executable bash scripts)
- Test functions: `test_something() { ... }`
- Test descriptions: `# TEST: Description of what's being tested`

**Template files:**
- Check that sections exist
- Validate markdown structure
- Ensure no breaking changes between versions

## Test Categories

### 1. Template Validation Tests

**What to test:**
- All required sections exist in each template
- Markdown syntax is valid
- Template examples are properly formatted
- No accidental typos in section names

**Examples:**
```bash
# TEST: docs/requirements.md has all required sections
test_requirements_structure() {
  grep -q "## Project Overview" docs/requirements.md
  grep -q "## Business Goals" docs/requirements.md
  grep -q "## Functional Requirements" docs/requirements.md
  # ... etc
}

# TEST: architecture.md contains valid ASCII diagrams
test_architecture_diagrams() {
  grep -q "┌─" docs/architecture.md  # Diagram uses box drawing chars
}
```

### 2. Installation Script Tests

**What to test:**
- Script successfully copies templates
- Symlinks are created correctly
- Existing files are handled gracefully
- Script works with different shell environments (bash, sh, zsh)
- Error handling works (missing directories, permission issues)

**Examples:**
```bash
# TEST: install script copies all templates
test_install_copies_templates() {
  bash install.sh --test-mode
  [ -f docs/requirements.md ] || fail "requirements.md not copied"
  [ -f docs/architecture.md ] || fail "architecture.md not copied"
}

# TEST: install script creates symlinks
test_install_creates_symlinks() {
  bash install.sh --test-mode
  [ -L CLAUDE.md ] || fail "CLAUDE.md symlink not created"
  [ "$(readlink CLAUDE.md)" = "docs/llm.md" ] || fail "symlink target wrong"
}

# TEST: install script respects existing files
test_install_respects_existing_files() {
  echo "existing content" > docs/llm.md
  bash install.sh --test-mode
  grep -q "existing content" docs/llm.md || fail "file was overwritten"
}
```

### 3. Compatibility Tests

**What to test:**
- Script works on Linux, macOS, WSL
- Works with bash, sh, zsh
- Handles different file systems (ext4, APFS, NTFS)
- Gracefully handles missing optional tools

**Manual testing (before releases):**
```bash
# Run on different environments
- Ubuntu 20.04 (GitHub Actions)
- macOS 11+ (GitHub Actions)
- Windows WSL2 (manual or GitHub Actions)

# Test with different shells
bash install.sh
sh install.sh
zsh install.sh
fish install.sh  # Best effort
```

### 4. MCP Configuration Tests

**What to test:**
- `.mcp.json` is valid JSON
- All required fields exist
- Setup instructions are present
- Disabled by default

**Examples:**
```bash
# TEST: .mcp.json is valid JSON
test_mcp_config_valid() {
  jq empty .mcp.json || fail ".mcp.json is not valid JSON"
}

# TEST: All MCP servers are disabled by default
test_mcp_servers_disabled() {
  jq '.mcpServers.atlassian.enabled' .mcp.json | grep -q "false"
  jq '.mcpServers.fathom.enabled' .mcp.json | grep -q "false"
}
```

## Running Tests

### Local Testing

```bash
# Run all tests
bash tests/install.test.sh
bash tests/templates.test.sh

# Run specific test
bash tests/install.test.sh test_install_copies_templates

# Run with verbose output
bash tests/install.test.sh -v
```

### GitHub Actions CI/CD

**Triggers:**
- On every push to main branch
- On every pull request
- Manual trigger via workflow_dispatch

**Platforms tested:**
- Ubuntu 20.04 (latest)
- macOS 11 (latest)
- Multiple bash versions (3.2, 4.0, 5.0)

**Required to pass:**
- All template validation tests
- All installation tests on all platforms
- All compatibility tests

## Test Data & Fixtures

### Sample Project Fixture

Located in `tests/fixtures/sample-project/`:
```
sample-project/
├── README.md                  # Existing readme
├── docs/                      # May already exist
│   └── notes.md              # Existing docs
├── CLAUDE.md                  # May already exist
└── .mcp.json                  # May already exist
```

Used to test:
- How install script handles existing files
- Symlink creation when files already exist
- Avoiding data loss

### Template Fixtures

Located in `tests/fixtures/templates/`:
- Examples of correctly filled-in templates
- Test files with various markdown formatting
- Edge cases (very long sections, special characters, etc.)

## Coverage & Validation

### Template Validation

**Required for each template file:**
- ✓ All section headers present
- ✓ No orphaned [TODO] tags after being filled
- ✓ Code examples are syntactically valid (if language-specific)
- ✓ Links in documents exist and are accessible

### Script Validation

**For install.sh:**
- ✓ ShellCheck passes (bash static analysis)
- ✓ No hardcoded paths (use relative paths or $HOME)
- ✓ Handles edge cases (spaces in paths, special characters)
- ✓ Error messages are helpful

## Best Practices

### For Installation Script Tests

**Do's:**
- Create temporary test directories; don't modify user's system
- Clean up after tests (remove test files)
- Test both happy path and error scenarios
- Use isolated test environments
- Document assumptions about shell environment

**Don'ts:**
- Modify user's actual home directory
- Assume specific shells or tools are installed
- Hardcode paths
- Leave test files behind
- Skip tests on specific OS (test on all)

### For Template Tests

**Do's:**
- Validate markdown syntax
- Check for required sections
- Ensure consistency across templates
- Test that examples work
- Document expected content

**Don'ts:**
- Enforce specific writing style
- Validate content quality (subjective)
- Over-constrain template flexibility
- Test things better caught by human review

## Debugging Tests

### Failed Installation Test

```bash
# Run with debug output
bash -x tests/install.test.sh test_name

# Check what files were created
ls -la /tmp/ctrlspec-test/

# Verify symlink was created
ls -l CLAUDE.md

# Check file contents
cat docs/llm.md
```

### Template Validation Failure

```bash
# Check which section is missing
grep "## Section Name" docs/template.md

# Validate markdown structure
cat docs/template.md | head -20

# Check for orphaned TODOs
grep "\[TODO" docs/*.md
```

## For LLMs

When generating or modifying CtrlSpec:
- Run tests locally before submitting changes
- Test on at least Linux (GitHub Actions for free)
- Ensure backwards compatibility; don't break existing installations
- Update tests when adding new features
- Remember: CtrlSpec is mostly static files; focus on integration tests
- Test that symlinks work correctly (common failure point)
- Validate that all templates still render in GitHub/GitLab
