# Constraints

## Technical Constraints

### Performance (Hard Limits)
- **Cold startup**: Must be < 100ms (plugin discovery, config loading)
- **Keystroke latency**: Must be < 16ms (60fps responsiveness)
- **Idle memory**: Must be < 100MB resident
- **Active project memory**: Must be < 500MB (with large files and many plugins)
- **AI first token**: Must be < 2s (from request to first response chunk)
- **File handling**: Must support 100MB+ files without UI freezing
- **Syntax highlighting**: Must not lag with complex syntax trees

### Platform Compatibility
- **Required**: macOS (10.13+), Linux (most distributions), Windows (via WSL or Git Bash, native post-MVP)
- **Terminal compatibility**: xterm-256color or better (TERM env var)
- **Node version**: 18+ (Bun is the runtime)
- **No GUI dependency**: Pure terminal, no Qt/GTK/Cocoa

### Infrastructure
- **Distribution**: Both npm package (`npm install -g ctrl`) AND downloadable binaries
- **No server required**: Fully local-first (offline-capable)
- **User's own AI API keys**: No server-side API calls required (user brings Claude/OpenAI key)
- **Optional hosted version**: Future SaaS offering can run Ctrl in cloud, but MVP is local-only

## Business Constraints

### Regulatory & Compliance
- **Data privacy**: Users control their data; Ctrl doesn't collect telemetry by default (optional analytics post-MVP)
- **GDPR**: No user data stored on servers (MVP is local-first)
- **License**: Apache 2.0 (free, open source, commercial-friendly)
- **No user accounts required**: MVP works without sign-up (future: optional accounts for hosted version)

### Budget
- **Self-funded**: No external funding for prototype phase
- **Open source**: Community contributions expected post-MVP
- **API costs**: Users pay for their own Claude/OpenAI API usage (Ctrl does not charge)

### Timeline
- **Prototype deadline**: 2 weeks (proof of concept, demo-ready)
- **MVP deadline**: 3 months (stable, documented, plugin ecosystem starting)
- **v1.0 deadline**: 6 months (feature-complete, production-ready)
- **Hosted version**: Post-MVP (after establishing open-source success)

## Technology Constraints

### Approved Technology Stack
- **Language**: TypeScript (both core and plugins)
  - Types/interfaces only (no classes, no OOP)
  - Functional programming paradigm
  - **Compiled natively by Bun** - no separate compilation step needed
- **Runtime**: Bun (package manager + JavaScript runtime) **ONLY**
  - No Node.js shims or Node compatibility mode
  - Bun-native APIs where available
  - Bun handles TypeScript compilation automatically
- **Rendering**: OpenTUI (Zig-backed terminal UI framework)
- **Syntax**: Tree-sitter (language-agnostic parsing)
- **Config format**: TOML (human-readable, validatable)
- **Validation**: Zod (TypeScript-first schema validation, project dependency)
- **Code formatting**: Biome (Rust-based, fast, system-installed only - not in package.json)
- **CLI framework**: bunli (type-safe CLI for Bun, Zod-validated options, project dependency)
- **Plugin sandbox**: WebAssembly or Workers API (depends on OpenTUI capabilities)
- **Module system**: ES modules + barrel imports (index.ts with **explicit** named re-exports, no `export *`)

**Development Environment:**
- All tools installed system-wide or via Nix
- No dev dependencies in package.json
- Bun handles TypeScript - no separate compiler needed
- Biome handles formatting/linting - installed globally

**Rationale:**
- TypeScript: Type safety, better DX for plugin developers
- **Bun only**: Simpler toolchain, faster execution, native TypeScript support
- **Functional**: Easier to reason about state, safer defaults, aligned with terminal-first philosophy
- OpenTUI: AI-native, performant rendering layer, Zig backing ensures speed
- TOML: More readable than JSON for users, AI-friendly
- Zod: Runtime validation for user config, plugins, API responses
- Biome: Single tool for format + lint, philosophy matches ours (minimal, fast)

### Programming Paradigm

**FUNCTIONAL PROGRAMMING ONLY:**
- ❌ No classes (use interfaces + functions)
- ❌ No `class` keyword, ever
- ❌ No OOP inheritance
- ❌ No `this` binding
- ✅ TypeScript interfaces for type definitions
- ✅ Type aliases for composite types
- ✅ Pure functions (same input → same output)
- ✅ Immutable data structures (const, readonly, never mutate)
- ✅ Higher-order functions (return functions, accept functions)
- ❌ Skip: Currying, composition utilities (for now)

**Example (correct pattern):**
```typescript
// ✅ Good: Function + interface
interface User {
  id: string;
  name: string;
}

const createUser = (id: string, name: string): User => ({
  id,
  name
});

const greetUser = (user: User): string => `Hello, ${user.name}`;

// ❌ Bad: Class
class User {
  constructor(public id: string, public name: string) {}
}
```

### Prohibited Technologies
- **Classes**: No `class` keyword, no OOP. Use functions + interfaces.
- **Electron**: Too heavy (100MB+), defeats terminal-native purpose
- **Web frameworks** (React in browser, etc.): Terminal only, no GUI
- **Lua for config**: Harder to validate, less AI-friendly than TOML
- **Prettier**: Use Biome only
- **ESLint**: Use Biome only
- **Higher-order functions** (for now): Keep it simple, avoid currying/compose
- **OOP libraries**: No class-based frameworks
- **Node.js APIs outside Bun**: Bun only, no cross-runtime compatibility

### Required Dependencies
- `bun` (runtime)
- `openTUI` (terminal UI)
- `tree-sitter` (syntax highlighting)
- `anthropic-sdk` (Claude API client)
- `@types/node` (TypeScript types)

### Decisions Baked In (Cannot Change Without Major Refactor)
- **Modal editing system**: Vim-like is the interaction model
- **Plugin architecture**: Core must stay minimal
- **TOML config**: Not JSON, not YAML, not Lua
- **Local-first**: No mandatory server connection

## Security Constraints

### Authentication
- **MVP**: No authentication required (local-only tool)
- **Future (hosted version)**: Support OAuth2 for Modo Ventures SaaS

### Data Protection
- **API keys**: Never store user's Claude/OpenAI keys in files; use secure OS credential storage where possible
- **Encryption in transit**: TLS 1.3+ for all API calls
- **Local data**: User's files are their responsibility (Ctrl is a text editor, not a backup service)
- **Config files**: May contain API keys; warn users not to commit `.env` files

### Access Control
- **Plugin permissions**: Fine-grained (filesystem read/write per path, network per domain, AI access separately)
- **Audit logging**: MVP doesn't require it (local tool); future hosted version will log access
- **No IP restrictions**: Local tool doesn't need them

### Plugin Security
- **Sandboxing**: All plugins must run in isolated WASM or Worker context
- **No arbitrary system access**: Plugins can only access what editor permits
- **Permission prompts**: Warn users if plugin requests unusual permissions
- **Signed plugins** (future): Plugin marketplace will require signatures

## Operational Constraints

### Availability
- **MVP**: No uptime SLA (local tool, user's responsibility)
- **Hosted version**: Post-MVP, will define SLA (likely 99.9%)
- **Offline-first**: MVP works without internet (graceful degradation for AI features)

### Monitoring
- **MVP**: No telemetry by default
- **Opt-in analytics**: Users can enable usage tracking (future)
- **Error logging**: Ctrl can log errors locally for debugging

### Support
- **MVP**: Community support via GitHub issues
- **Future**: Email support for hosted version
- **Documentation**: Comprehensive user guide + API reference required for v1.0

## Resource Constraints

### Team
- **MVP**: Solo developer or very small team (1-2 people)
- **Post-MVP**: Need plugin developers community
- **Skills required**: TypeScript, terminal UI, terminal protocol knowledge

### Tools & Access
- **Development**: IDE of choice (VS Code, Vim, etc. - eat your own dogfood, use Ctrl!)
- **Testing**: Local testing, then early adopter feedback
- **Distribution**: npm registry + GitHub releases for binaries

## Integration Constraints

### APIs
- **Claude API**: Rate limited, requires user's API key
- **Alternative providers** (OpenAI, local models): Extensible via plugins
- **MCP servers**: Will support integration (future phase 2)

### Legacy Systems
- **N/A for MVP**: New greenfield project

## Known Limitations

**These are acknowledged and will NOT be fixed in MVP:**
- **Windows native binary**: MVP supports WSL/Git Bash only (native post-MVP)
- **Collaborative editing**: Single-user only (future: Modo Ventures hosted version)
- **Built-in terminal**: Uses system terminal (not embedded)
- **Graphical debugger**: TUI-only, no graphical debugging
- **Mouse support**: Keyboard-first (minimal mouse support, no click-to-edit)
- **Accessibility**: Terminal accessibility limited (WCAG applies to terminal, not GUI)

## Trade-offs Accepted

- **Speed over completeness**: Fast MVP with core features > slow MVP with everything
- **Local-first over cloud-native**: User owns their data, no server required for MVP
- **Simplicity over flexibility**: TOML config is less flexible than Lua/Python but simpler
- **Terminal-only over GUI**: Smaller scope, faster execution, clearer differentiation
- **Bun over Node**: Faster, but smaller ecosystem (acceptable tradeoff)
- **Minimal Vim compatibility**: 80% compatibility is better than 100% and shipping in 2 weeks

