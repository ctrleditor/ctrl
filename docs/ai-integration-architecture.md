# AI Integration Architecture

> **Note:** This is the comprehensive technical architecture for AI integration. For a user-friendly guide to using AI features, see [ai-features.md](ai-features.md).

## Phase 2: AI-Native Interaction Design

### Context & Assumptions

**What's Already Built (Phase 1)**
- ✅ Core editor with modal editing (normal, insert, visual modes)
- ✅ Buffer management with rope data structure
- ✅ Tree-sitter syntax highlighting
- ✅ LSP integration (completions, hover, diagnostics)
- ✅ TOML-based configuration system
- ✅ Command system and keybindings
- ✅ Basic UI components (status bar, editor view)
- ✅ File operations (open, save, navigate)

**What Phase 2 Adds**
- 🎯 AI integration as a first-class feature
- 🎯 Unique interaction patterns that differentiate from Cursor/Zed/Copilot
- 🎯 Seamless blending of traditional editing and AI assistance
- 🎯 Context-aware AI that understands your project deeply

**Design Principle**
AI should feel like a native part of the editor, not a bolt-on feature. Users shouldn't "switch to AI mode" - AI should be available contextually wherever it makes sense.

## Core AI Interaction Patterns

### 1. Inline Completions (Ghost Text)

**What It Is**
As you type, AI suggests completions that appear as dimmed "ghost text" ahead of your cursor. Think GitHub Copilot but with deeper project understanding.

**When It Appears**
- **Automatic Trigger**: After typing stops for 500ms (configurable)
- **Manual Trigger**: `<C-Space>` in insert mode
- **Context-Aware**: Only appears when AI has high confidence (> 70%)

**Visual Design**
```
function calculateTotal(items: Item[]) {
  const total = items.reduce((sum, item) => sum + item.price, 0);█
  return total * 1.1; // Add 10% tax
}                     ↑ ghost text in gray/italic
```

**Interaction**
- `<Tab>` - Accept entire suggestion
- `<C-e>` - Accept next word only
- `<Esc>` - Dismiss suggestion
- Continue typing - Dismisses and uses your input
- `<C-]>` - Cycle to next suggestion (if multiple available)

**Configuration Options**
```toml
[ai.inline_completion]
enabled = true
trigger_delay = 500  # ms
show_multiple = true  # Show "1 of 3" indicator
min_confidence = 0.7
ghost_text_style = "italic_gray"  # or "faint", "dim"
languages = ["typescript", "javascript", "rust", "go"]  # or ["*"] for all
```

**Design Decisions**
- **Why ghost text?** Least disruptive, doesn't break flow
- **Why delay?** Avoids flickering suggestions while actively typing
- **Why confidence threshold?** Bad suggestions are worse than no suggestions
- **Why Tab?** Muscle memory from Copilot, intuitive

### 2. AI Chat Panel

**What It Is**
A persistent side panel for conversational interaction with AI about your code. Think ChatGPT but always aware of your current file, project, and context.

**Layout**
```
┌─────────────────────────────────┬─────────────────────────┐
│                                 │  AI Assistant           │
│                                 ├─────────────────────────┤
│        Editor                   │                         │
│                                 │  You: How do I...      │
│                                 │                         │
│                                 │  Claude: Here's how... │
│                                 │  ```typescript          │
│                                 │  // code example        │
│                                 │  ```                    │
│                                 │                         │
│                                 │  [Apply to file]        │
│                                 │                         │
│                                 ├─────────────────────────┤
│                                 │  Ask anything...        │
└─────────────────────────────────┴─────────────────────────┘
```

**Triggering**
- `<leader>ac` - Toggle chat panel
- From command palette: `:AIChat`
- Automatically opens when using chat-related commands

**Context Inclusion**
Chat automatically includes:
- ✅ Current file name and language
- ✅ Current cursor position and selection (if any)
- ✅ Recent diagnostics (LSP errors/warnings)
- ✅ Open buffers (configurable limit)
- ❌ Not included by default: Git history, tests, documentation (too much context)

**Special Commands in Chat**
Users can type commands that trigger specific behaviors:
- `/explain` - Explain selected code in detail
- `/fix` - Suggest fixes for diagnostics
- `/refactor` - Suggest refactoring for selected code
- `/test` - Generate tests for selected code
- `/docs` - Generate documentation
- `/commit` - Generate commit message from changes

**Message Actions**
Each AI response can have action buttons:
- **[Apply to file]** - Insert AI's code at cursor
- **[Copy code]** - Copy code blocks to clipboard
- **[Open in new buffer]** - Create new file with content
- **[Run command]** - Execute suggested shell command

**Conversation Management**
- Conversations persist within project context
- Can clear chat: `/clear` or button
- Can export conversation: `/export` creates markdown file
- Chat history size configurable (default: last 20 messages)

**Configuration**
```toml
[ai.chat]
panel_width = 60  # characters
position = "right"  # or "left", "bottom"
persist_history = true
history_size = 20
show_context_files = true  # Show which files are in context
system_prompt = """
You are an expert programming assistant integrated into a code editor.
Be concise and actionable. When showing code, use proper syntax highlighting.
"""
```

**Design Decisions**
- **Why side panel?** Keeps chat visible while editing
- **Why slash commands?** Quick, discoverable, terminal-like familiarity
- **Why show context?** Transparency builds trust, helps users understand AI
- **Why action buttons?** Reduce friction between AI suggestion and implementation

### 3. Selection-Based AI Actions

**What It Is**
When you select code in visual mode, AI actions become available to transform or analyze that selection.

**User Flow**
```
1. Select code in visual mode
2. Press <leader>a to open AI action menu
3. Choose action (explain, refactor, fix, test, document)
4. AI processes and shows result
```

**Available Actions**

**Explain (`<leader>ae`)**
- AI provides detailed explanation of what the code does
- Output appears in chat panel or output window
- Useful for understanding unfamiliar code

**Refactor (`<leader>ar`)**
- AI suggests improvements (extract function, simplify, optimize)
- Shows diff preview before applying
- Can accept/reject/modify suggestion

**Fix (`<leader>af`)**
- Analyzes code for bugs, edge cases, performance issues
- Suggests specific fixes with explanations
- Prioritizes issues by severity

**Generate Tests (`<leader>at`)**
- Creates unit tests for selected function/class
- Uses project's testing framework (detected automatically)
- Opens tests in new buffer

**Generate Docs (`<leader>ad`)**
- Creates JSDoc/Rustdoc/docstrings for selected code
- Matches project documentation style
- Inserts directly above function/class

**Visual Design**
```
// User selects this function
function calculateShipping(items: Item[], destination: string) {
  // ... complex logic ...
}

// Presses <leader>a
╔═══════════════════════════════╗
║  AI Actions                   ║
╠═══════════════════════════════╣
║  e - Explain code            ║
║  r - Refactor                ║
║  f - Find issues             ║
║  t - Generate tests          ║
║  d - Generate docs           ║
║  ESC - Cancel                ║
╚═══════════════════════════════╝
```

**Configuration**
```toml
[ai.selection_actions]
show_menu = true  # or use direct keybindings only
confirm_before_apply = true  # Show diff before applying changes
preserve_selection = false  # Keep text selected after action
```

**Design Decisions**
- **Why selection-based?** User explicitly chooses scope, prevents AI from touching wrong code
- **Why menu?** Discoverable, reduces keybinding memorization
- **Why confirm?** Prevents accidental overwrites, builds trust
- **Why multiple actions?** Different use cases need different AI behaviors

### 4. Diagnostic-Driven AI

**What It Is**
When LSP reports errors/warnings, AI can automatically suggest fixes or users can request fixes.

**Automatic Suggestions**
```
  5 │ function getUserName(user: User) {
  6 │   return user.name.toUpperCase();
    │               ^^^^ Property 'name' does not exist on type 'User'
  7 │ }

💡 AI suggests: Did you mean 'user.username'?
   Press <C-a> to apply
```

**Manual Fix Request**
- Place cursor on diagnostic line
- Press `<leader>af` (AI fix)
- AI analyzes error context and suggests fixes
- Shows preview before applying

**Bulk Fix**
- `:AIFixAll` - Attempts to fix all diagnostics in file
- Shows summary: "Fixed 3 issues, 2 need manual review"
- Creates backup before bulk changes

**Design Decisions**
- **Why automatic suggestions?** Reduces time to fix obvious errors
- **Why preview?** AI might misunderstand, user stays in control
- **Why bulk fix?** After refactoring, many mechanical fixes needed
- **Why backup?** Safety net for bulk operations

### 5. Context-Aware Command Suggestions

**What It Is**
AI suggests commands based on your current context and editing patterns.

**Examples**

**When you save a file with linting errors:**
```
File saved with 3 linting issues.

💡 Run 'biome format' to auto-fix? [y/n]
```

**When you open a new project:**
```
Detected package.json with no node_modules.

💡 Run 'bun install'? [y/n]
```

**When you've been editing tests:**
```
You've modified 3 test files.

💡 Run test suite? [y/n]
```

**Configuration**
```toml
[ai.smart_suggestions]
enabled = true
frequency = "sometimes"  # "always", "sometimes", "rarely"
types = ["formatting", "dependencies", "tests", "git"]
```

**Design Decisions**
- **Why proactive suggestions?** Anticipates next logical step
- **Why y/n prompts?** Quick to dismiss, low friction
- **Why frequency control?** Different users want different levels of assistance
- **Why configurable types?** Users can disable annoying suggestions

### 6. AI-Powered Search & Navigation

**What It Is**
Natural language search that uses AI to understand intent, not just keyword matching.

**Examples**

**Semantic Code Search**
```
Search: "functions that make API calls"

Results (ranked by relevance):
1. src/api/client.ts:45 - fetchUserData()
2. src/api/client.ts:78 - postComment()
3. src/hooks/useApi.ts:12 - useQuery()
```

**Intent-Based Navigation**
```
Go to: "where we validate user input"

→ src/middleware/validation.ts:67
```

**Smart File Finding**
```
Open: "user profile component"

→ src/components/UserProfile.tsx
```

**Triggering**
- `<leader>fs` - AI-powered semantic search
- `<leader>fg` - AI-powered "go to"
- Regular fuzzy find (`<leader>ff`) still available for exact matching

**Design Decisions**
- **Why semantic search?** Often know what code does, not what it's named
- **Why keep fuzzy find?** Sometimes exact matching is faster
- **Why ranked results?** AI confidence helps users pick right result
- **Why separate keybindings?** Clear distinction between search types

## AI Context Management

### What Context Gets Included?

**Always Included (Automatic)**
- Current file contents
- Current cursor position
- Current selection (if any)
- Language/file type
- Recent LSP diagnostics

**Optionally Included (Configurable)**
- Open buffers (up to N files)
- Project structure (file tree)
- Git status (uncommitted changes)
- Related files (imports, test files)
- Recent commands executed

**Never Included (Privacy)**
- Files outside workspace
- System environment variables
- Command history with secrets
- Clipboard contents

### Context Visibility

**Show Context Button**
In chat panel and AI action menus:
```
╔════════════════════════════════╗
║  Context (3 files, 247 lines) ║  ← clickable
╚════════════════════════════════╝

Expands to:
╔════════════════════════════════╗
║  Context:                      ║
║  ✓ src/main.ts (45 lines)     ║
║  ✓ src/utils.ts (102 lines)   ║
║  ✓ Diagnostics (3 errors)     ║
║                                ║
║  [Edit context]                ║
╚════════════════════════════════╝
```

**Manual Context Editing**
Users can:
- ✅ Add specific files to context
- ❌ Remove files from context
- 📌 Pin files to always include
- 🔍 Search project to add more context

**Configuration**
```toml
[ai.context]
include_open_files = true
max_files = 10
max_lines_per_file = 500  # Truncate large files
include_diagnostics = true
include_git_status = false
include_dependencies = false  # package.json, Cargo.toml
```

### Context Budget

AI prompts have token limits. The editor manages this:

**Priority Order**
1. Current file (full content)
2. Current selection (if exists)
3. Diagnostics
4. Open buffers (most recently edited first)
5. Related files (imports, test files)

**Truncation Strategy**
- If context exceeds budget, truncate lowest priority items
- Show indicator: "Context truncated (5 files omitted)"
- Allow user to manually select what to include

## Performance & Cost Considerations

### Caching Strategy

**What Gets Cached**
- File embeddings (semantic search)
- Parse trees (syntax analysis)
- Common completions (boilerplate)
- Project structure (file tree)

**Cache Invalidation**
- File changes invalidate that file's cache
- Project-wide refactors clear all caches
- Manual cache clear: `:AIClearCache`

### Rate Limiting

**Inline Completions**
- Max 1 request per 500ms (debounced)
- Max 100 requests per hour per user
- Caches suggestions for 5 minutes

**Chat Requests**
- No rate limit (user-initiated)
- Warns if approaching API quota

**Background Processing**
- Semantic indexing: once per file change (debounced 2s)
- Diagnostic analysis: only on explicit request

### Cost Visibility

**Show API Usage**
Status bar indicator:
```
AI: 23 completions today  $0.12
```

Click to see breakdown:
```
╔════════════════════════════════╗
║  AI Usage Today               ║
╠════════════════════════════════╣
║  Inline completions: 23       ║
║  Chat messages: 8             ║
║  Code actions: 5              ║
║                                ║
║  Estimated cost: $0.12        ║
║  Remaining quota: $9.88       ║
╚════════════════════════════════╝
```

**Cost Controls**
```toml
[ai.limits]
daily_budget = 10.00  # dollars
warn_at = 8.00
disable_at = 10.00  # hard stop
track_usage = true
```

## Error Handling & Degradation

### When AI Is Unavailable

**Network Failure**
- Inline completions: silently disabled
- Chat: shows "AI unavailable - check connection"
- Selection actions: shows error, offers retry

**API Quota Exceeded**
- Shows notification: "AI quota reached for today"
- Offers upgrade or wait until reset
- All features gracefully disabled

**API Key Missing**
- Shows setup wizard on first launch
- Allows using own API key
- Can skip and use editor without AI

**Timeout Handling**
- Inline completions: 2s timeout (then cancel)
- Chat: 30s timeout (then show error)
- Can retry failed requests

### Partial Degradation

**High Latency Mode**
When API is slow (>3s responses):
- Disable automatic inline completions
- Keep manual trigger (`<C-Space>`)
- Show latency warning in status bar
- Suggest checking connection

**Offline Mode**
- Editor fully functional without AI
- All non-AI features work normally
- Clear UI indication: "Offline - AI disabled"
- Can re-enable when back online

## User Onboarding

### First Launch Experience

**Setup Wizard**
```
╔═══════════════════════════════════╗
║  Welcome to AI-IDE!              ║
╠═══════════════════════════════════╣
║                                   ║
║  To enable AI features:          ║
║                                   ║
║  1. Use included trial credits   ║
║     (100 free requests)          ║
║                                   ║
║  2. Enter your Anthropic key     ║
║     [___________________________] ║
║                                   ║
║  3. Skip AI features for now     ║
║                                   ║
║  [Continue]  [Learn More]        ║
╚═══════════════════════════════════╝
```

**Interactive Tutorial**
Shows once after setup:
- "Try asking AI to explain this code" (opens sample file)
- "Press `<C-Space>` for completions"
- "Press `<leader>ac` to open chat"
- Can skip or complete later

### Discoverability Features

**Command Palette Hints**
When searching commands, AI features are annotated:
```
> format
  › Format Document (Biome)
  › Format Selection (Biome)
  › AI: Fix Formatting Issues  ✨
```

**Status Bar Hints**
Subtle indicators:
```
[Normal]  main.ts  ✨ AI ready  Ln 45, Col 12
                     ↑ clickable for AI menu
```

**Contextual Tips**
First time doing something:
```
💡 Tip: Press <leader>ae to explain selected code with AI
   [Don't show again]
```

## Configuration Philosophy

### Sensible Defaults

**Out of Box Experience**
- Inline completions: ON (500ms delay)
- Chat panel: Available but closed (open with `<leader>ac`)
- Selection actions: ON (via menu)
- Smart suggestions: SOMETIMES (not annoying)
- Context: Current file + diagnostics only

**Progressive Enhancement**
Users can enable more features:
- Multi-file context
- Automatic diagnostic fixes
- Proactive suggestions
- Background indexing

### Power User Options

**Advanced Config Example**
```toml
[ai]
provider = "anthropic"  # or "openai", "local"
model = "claude-sonnet-4-20250514"

[ai.inline_completion]
enabled = true
trigger_delay = 300
show_multiple = true
max_suggestions = 3
min_confidence = 0.8
ghost_text_style = "italic_gray"

[ai.chat]
panel_width = 70
position = "right"
persist_history = true
history_size = 50
auto_include_selection = true
stream_responses = true

[ai.context]
include_open_files = true
max_files = 15
max_lines_per_file = 1000
include_diagnostics = true
include_git_status = true
semantic_search = true

[ai.selection_actions]
show_menu = false  # Use direct keybindings
confirm_before_apply = true
auto_save_before_refactor = true

[ai.limits]
daily_budget = 20.00
warn_at = 15.00
track_usage = true
cache_ttl = 3600  # 1 hour

[ai.experimental]
predictive_editing = false
multi_file_refactor = false
auto_fix_on_save = false
```

## Success Metrics

### How Do We Know It's Working?

**Quantitative**
- Daily active users using AI features > 80%
- Inline completion acceptance rate > 40%
- Chat messages per session > 3
- Time to fix diagnostic < 30s (with AI vs without)
- Code quality metrics (via AI reviews)

**Qualitative**
- User surveys: "AI feels integrated, not bolted on"
- Feature requests align with roadmap
- Low support requests about AI features
- Positive feedback on context awareness
- Users say they can't go back to other editors

**Business**
- Conversion rate: trial → paid
- Retention: 30-day, 90-day
- NPS score > 40
- API costs < 20% of revenue

## Open Questions to Resolve

### Technical Decisions

**Q: Local vs. Cloud AI models?**
- **Option A**: Always use cloud (Anthropic API)
  - Pros: Best quality, no local resources
  - Cons: Requires internet, costs money
- **Option B**: Support local models (Ollama, llama.cpp)
  - Pros: Privacy, no costs, works offline
  - Cons: Slower, worse quality, setup friction
- **Recommendation**: Start cloud-only, add local in Phase 3

**Q: Real-time collaboration with AI?**
- Should multiple users share AI chat?
- Should AI see all collaborators' code?
- How to handle conflicting AI suggestions?
- **Recommendation**: Defer to Phase 4+

**Q: AI-generated code attribution?**
- Do we mark AI-generated code somehow?
- License implications?
- **Recommendation**: Add subtle indicator, make toggleable

### UX Decisions

**Q: How aggressive should inline completions be?**
- Show on every pause? Or require manual trigger?
- Show multiple suggestions? Or just top 1?
- **Recommendation**: Start conservative (500ms delay, 1 suggestion), make configurable

**Q: Where should chat panel live?**
- Right side (like this doc shows)?
- Bottom (like terminal)?
- Floating window?
- **Recommendation**: Right side default, make configurable

**Q: Voice input for AI chat?**
- Would voice make AI more accessible?
- Complexity worth it for Phase 2?
- **Recommendation**: Defer to Phase 3+

### Product Decisions

**Q: How to price AI features?**
- Included in free tier? (with limits)
- Paid add-on? (unlimited)
- Bring-your-own-key only?
- **Recommendation**: Free tier (100 requests/day) + paid unlimited + BYOK option

**Q: How to differentiate from Cursor/Copilot?**
- Focus on terminal UX?
- Better context awareness?
- MCP integration?
- **Recommendation**: All three, plus "AI feels native, not tacked on"

**Q: Can AI edit multiple files at once?**
- Refactoring across files?
- Rename symbol everywhere?
- **Recommendation**: Phase 2 yes for simple cases, Phase 3 for complex refactors

## Implementation Roadmap

### Phase 2A: Core AI Integration (Weeks 3-4)
- ✅ Inline completions with ghost text
- ✅ Basic chat panel
- ✅ AI client with streaming
- ✅ Context building

### Phase 2B: Selection Actions (Weeks 5-6)
- ✅ Explain selected code
- ✅ Refactor suggestions with preview
- ✅ Fix diagnostics
- ✅ Generate tests/docs

### Phase 2C: Smart Features (Weeks 7-8)
- ✅ Diagnostic-driven AI fixes
- ✅ Context-aware suggestions
- ✅ Semantic search
- ✅ Cost tracking

### Phase 2D: Polish & Optimization (Weeks 9-10)
- ✅ Caching layer
- ✅ Error handling
- ✅ Onboarding flow
- ✅ Performance tuning
- ✅ User testing & iteration

## Next Steps

1. **Review this design with stakeholders** - Get buy-in on interaction patterns
2. **Create detailed mockups** - Visual designs for each interaction
3. **Prototype one interaction** - Validate technical approach
4. **User test early** - Get feedback before building everything
5. **Iterate based on learnings** - Design is never done on first try

---

**Remember**: The goal isn't to have every AI feature, but to have AI feel like a natural part of the editing experience. Quality over quantity. Integrated over bolted-on. Helpful over annoying.
