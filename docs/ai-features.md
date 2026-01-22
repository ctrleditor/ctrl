# AI Features Guide

Ctrl treats AI as a first-class citizen in your editing workflow. Here's how to use it effectively.

## Getting Started

### Setup (First Launch)

On first launch, Ctrl shows a setup wizard:

1. **Choose how to enable AI:**
   - Use trial credits (100 free requests)
   - Enter your Anthropic API key
   - Enter OpenAI API key
   - Skip for now

2. **That's it.** AI is immediately available in the editor.

### Check AI Status

Status bar shows AI state:
```
AI: Ready  |  45 requests today  $0.08
```

Click to see detailed usage:
```
Today's AI Usage:
├─ Inline completions: 23
├─ Chat messages: 8
├─ Code actions: 5
├─ Diagnostics fixes: 9
└─ Total cost: $0.08
```

---

## 1. Inline Completions (Ghost Text)

AI suggests code as you type.

### How It Works

```typescript
function calculateTotal(items: Item[]) {
  const total = items.reduce((sum, item) => sum + item.price, 0);█
  return total * 1.1;  // ← ghost text appears here in gray
}
```

### Interaction

- **Accept entire suggestion:** `<Tab>`
- **Accept next word only:** `<C-e>`
- **Reject suggestion:** `<Esc>`
- **See next suggestion:** `<C-]>`
- **Manually trigger:** `<C-Space>` in insert mode

### Configuration

```toml
[ai.inline_completion]
enabled = true
trigger_delay = 500          # ms after you stop typing
show_multiple = true         # Show "1 of 3" indicator
min_confidence = 0.7         # Only show confident suggestions
ghost_text_style = "italic_gray"  # How it looks

# Limit which languages
languages = ["typescript", "javascript", "python", "rust"]
# or ["*"] for all languages
```

### Tips

- **Too many bad suggestions?** Increase `min_confidence` to 0.8
- **Completions too slow?** Increase `trigger_delay` to 800
- **Don't like ghost text?** Disable entirely with `enabled = false`
- **Want faster feedback?** Decrease `trigger_delay` to 300

---

## 2. AI Chat Panel

Conversational AI about your code, always aware of context.

### Open Chat

```
<leader>ac    # Toggle chat panel
:AIChat       # From command palette
```

### Chat Interface

```
┌─────────────────────────────────┬──────────────────────┐
│                                 │  Ctrl AI Assistant    │
│        Your Code                ├──────────────────────┤
│                                 │                      │
│                                 │  You:                │
│                                 │  How do I validate   │
│                                 │  email addresses?    │
│                                 │                      │
│                                 │  Claude:             │
│                                 │  Here's how...       │
│                                 │  ```typescript       │
│                                 │  // code example     │
│                                 │  ```                 │
│                                 │  [Apply] [Copy]      │
│                                 │                      │
│                                 │  Your question...    │
└─────────────────────────────────┴──────────────────────┘
```

### Special Commands

Type `/` to see available commands:

- **`/explain`** - Explain selected code in detail
- **`/fix`** - Suggest fixes for errors
- **`/refactor`** - Suggest improvements
- **`/test`** - Generate unit tests
- **`/docs`** - Generate documentation
- **`/commit`** - Generate commit message
- **`/clear`** - Clear chat history
- **`/export`** - Export conversation as markdown

### Message Actions

Each AI response shows action buttons:

- **[Apply to file]** - Insert code at cursor
- **[Copy code]** - Copy to clipboard
- **[Open in new buffer]** - Create new file with content
- **[Run command]** - Execute shell command

### Context Included Automatically

Chat always includes:
- ✅ Current file name and type
- ✅ Current cursor position
- ✅ Selected text (if any)
- ✅ LSP diagnostics (errors/warnings)
- ⚙️ Open buffers (configurable)

Click **"Context (3 files, 247 lines)"** to see what's included.

### Configuration

```toml
[ai.chat]
panel_width = 60           # characters
position = "right"         # "right", "left", or "bottom"
persist_history = true
history_size = 20          # How many messages to remember
show_context_files = true  # Show which files are in context
auto_include_selection = true
stream_responses = true    # Show response as it arrives
```

### Tips

- **Too much context included?** Click "Context" and uncheck files
- **Chat getting long?** Type `/clear` to start fresh
- **Want to save conversation?** Type `/export` to save as markdown
- **Chat panel in the way?** Press `<leader>ac` to hide, or reposition with `position = "left"`

---

## 3. Selection-Based AI Actions

Select code → AI transforms it.

### How It Works

1. **Select code** in visual mode (press `v`)
2. **Open AI menu** with `<leader>a`
3. **Choose action** (e, r, f, t, d)
4. **Review result** before applying

### Available Actions

**Explain** - `<leader>ae`
```
Selected code:
function calculateShipping(items, destination) { ... }

Claude explains:
This function calculates shipping costs by iterating over items,
looking up rates based on destination, and applying any volume discounts...
```

**Refactor** - `<leader>ar`
```
Selected code:
const x = a.map(i => i.price).reduce((s, p) => s + p, 0)

Suggestion:
// More readable: use descriptive names
const total = prices.reduce((sum, price) => sum + price, 0)

[Accept] [Reject] [Modify]
```

**Fix Issues** - `<leader>af`
```
Selected code:
function processData(data) {
  return data.map(x => x.name.toUpperCase())
}

Issues found:
- ⚠️ Property 'name' might not exist
- 💡 Could add null check
- 🔧 Consider using optional chaining

[Apply fix] [Review each issue]
```

**Generate Tests** - `<leader>at`
```
Selected code:
function add(a: number, b: number): number {
  return a + b;
}

Generated tests:
describe('add', () => {
  it('should add two positive numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
  // ... more tests
});

[Open in new buffer] [Copy] [Insert below function]
```

**Generate Docs** - `<leader>ad`
```
Selected code:
export function validateEmail(email: string): boolean {

Generated docs:
/**
 * Validates if a string is a valid email address.
 * @param email - The email string to validate
 * @returns true if valid, false otherwise
 * @example
 * validateEmail('user@example.com') // true
 */
```

### Configuration

```toml
[ai.selection_actions]
show_menu = true           # Show menu, or use keybindings directly
confirm_before_apply = true  # Show diff before applying
preserve_selection = false # Keep text selected after action
auto_save_before_refactor = true
```

### Tips

- **Don't see all actions?** Make sure your selection is clear code, not random text
- **Result is wrong?** Click `[Reject]` and ask Claude in chat for a better suggestion
- **Want to refine the suggestion?** Copy to chat and ask follow-up questions
- **Keybindings too many to remember?** Just press `<leader>a` and use the menu

---

## 4. Diagnostic-Driven AI Fixes

When LSP finds errors, AI can help fix them.

### Automatic Suggestions

When cursor is on an error:
```typescript
function getUserName(user: User) {
  return user.name.toUpperCase();
    //  ^^^^ Property 'name' does not exist
}

💡 AI suggests: Did you mean 'user.username'?
   Press <C-a> to apply
```

### Manual Fix Request

Place cursor on error, then:
```
<leader>af     # AI fix for this diagnostic
```

Claude analyzes the error and proposes fixes with explanations.

### Bulk Fix All Errors

```
:AIFixAll      # Attempt to fix all diagnostics in file
```

Result:
```
Fixed 5 issues, 2 need manual review

Changes:
✓ Line 15: Fixed undefined 'config' reference
✓ Line 27: Added null check for user.email
✓ Line 42: Corrected property name
⚠ Line 58: Suggests refactor (manual review)
⚠ Line 73: Multiple possible fixes (choose one)

[Apply changes] [Review each] [Undo]
```

### Configuration

```toml
[ai.diagnostics]
auto_suggest_fixes = true
confirm_before_bulk_fix = true
create_backup_before_bulk = true
```

---

## 5. Context-Aware Suggestions

AI suggests next steps based on what you're doing.

### Examples

**After saving with lint errors:**
```
File saved with 3 linting issues.
💡 Run 'biome format' to auto-fix? [y/n]
```

**After modifying tests:**
```
You've modified 3 test files.
💡 Run test suite? [y/n]
```

**After importing dependency:**
```
Added import from 'lodash'.
💡 Run 'bun install'? [y/n]
```

### Configuration

```toml
[ai.smart_suggestions]
enabled = true
frequency = "sometimes"  # "always", "sometimes", "rarely", "never"
types = ["formatting", "dependencies", "tests", "git"]
```

---

## 6. Semantic Search

Find code by what it does, not what it's named.

### Natural Language Search

```
<leader>fs    # AI-powered semantic search
```

Query: `"functions that make HTTP requests"`

Results (ranked by relevance):
```
1. src/api/client.ts:45 - fetchUserData()
   └─ Makes GET request to /api/users

2. src/api/client.ts:78 - postComment()
   └─ Makes POST request to /api/comments

3. src/hooks/useApi.ts:12 - useQuery()
   └─ Uses fetch for API calls
```

### Intent-Based Navigation

```
<leader>fg    # Go to...
```

Query: `"where we validate user input"`

→ Opens `src/middleware/validation.ts:67`

### Traditional Fuzzy Find Still Available

```
<leader>ff    # Regular fuzzy find for exact names
```

### Configuration

```toml
[ai.semantic_search]
enabled = true
index_automatically = true  # Index files on change
max_results = 10
confidence_threshold = 0.5
```

---

## Understanding Context

### What Context Gets Included?

**Always (Automatic):**
- Current file contents
- Cursor position
- Current selection
- File type
- Recent LSP diagnostics

**Optional (Configurable):**
- Other open files
- Project structure
- Git status
- Related files (imports, tests)

**Never (Privacy):**
- System files outside workspace
- Environment variables with secrets
- Clipboard contents
- Command history

### Adjust Context

In chat panel or AI action menu, click **"Context"** to:
- See what files are included
- Add/remove files
- Pin frequently-used files
- Clear and start fresh

### Context Limits

AI has token limits. If your context is too large:
```
Context truncated (5 files omitted)
[View all] [Edit context manually]
```

Reduce context by:
- Unchecking unneeded files
- Using smaller files
- Clearing diagnostics
- Limiting open buffers

---

## Performance & Cost

### What Costs Money?

- ✅ Inline completions
- ✅ Chat messages
- ✅ Code actions
- ✅ Search queries
- ❌ Opening chat panel (free)
- ❌ Configuration (free)

### Cost Tracking

Status bar shows usage:
```
AI: 45 completions  $0.12
```

Click to see breakdown:
```
Inline completions: 23 requests  $0.08
Chat messages: 8 requests        $0.03
Code actions: 5 requests         $0.01
────────────────────────────────────
Total: $0.12 of $10.00 daily budget
```

### Cost Controls

```toml
[ai.limits]
daily_budget = 10.00           # Hard stop at $10
warn_at = 8.00                 # Warn at $8
track_usage = true
cache_ttl = 3600               # Cache responses for 1 hour
```

### Reduce Costs

- **Increase inline completion trigger delay** (fewer requests)
- **Enable caching** (reuse responses)
- **Limit context files** (smaller requests)
- **Use local models** (no API costs, future feature)

---

## Troubleshooting

### "AI unavailable - check connection"

- Verify internet connection
- Check API key in settings
- Try again (might be temporary API issue)

### "AI quota reached for today"

- Your daily budget ($10 default) is exceeded
- Increase `daily_budget` in config if you have quota
- Try again tomorrow

### "Inline completions too slow"

- Increase `trigger_delay` (fewer requests)
- Disable in slow contexts
- Check internet speed

### "Completions are bad quality"

- Increase `min_confidence` threshold
- Add more context files
- Try asking in chat instead

### "Chat context is too large"

- Reduce `max_files` in config
- Uncheck unneeded files in chat context
- Use smaller file selections

### "API key not working"

- Verify key is correct in `.ctrl/ai.toml`
- Check key has permission for API calls
- Try using different provider (OpenAI vs Anthropic)

---

## Configuration Reference

### Complete AI Config

```toml
[ai]
provider = "anthropic"        # "anthropic", "openai", or "local"
model = "claude-sonnet-4-20250514"
temperature = 0.7             # 0-1, higher = more creative
max_tokens = 8000

[ai.inline_completion]
enabled = true
trigger_delay = 500
show_multiple = true
min_confidence = 0.7
ghost_text_style = "italic_gray"
languages = ["*"]

[ai.chat]
panel_width = 60
position = "right"
persist_history = true
history_size = 20
show_context_files = true
stream_responses = true

[ai.context]
include_open_files = true
max_files = 10
max_lines_per_file = 500
include_diagnostics = true
include_git_status = false
include_dependencies = false

[ai.selection_actions]
show_menu = true
confirm_before_apply = true
preserve_selection = false
auto_save_before_refactor = true

[ai.diagnostics]
auto_suggest_fixes = true
confirm_before_bulk_fix = true
create_backup_before_bulk = true

[ai.smart_suggestions]
enabled = true
frequency = "sometimes"
types = ["formatting", "dependencies", "tests", "git"]

[ai.semantic_search]
enabled = true
index_automatically = true
max_results = 10
confidence_threshold = 0.5

[ai.limits]
daily_budget = 10.00
warn_at = 8.00
disable_at = 10.00
track_usage = true
cache_ttl = 3600
```

---

## Keyboard Shortcuts Summary

| Shortcut | Action |
|----------|--------|
| `<C-Space>` | Inline completion (manual trigger) |
| `<Tab>` | Accept inline suggestion |
| `<C-e>` | Accept next word of suggestion |
| `<Esc>` | Reject suggestion |
| `<C-]>` | Cycle to next suggestion |
| `<leader>ac` | Toggle chat panel |
| `<leader>a` | AI actions menu |
| `<leader>ae` | Explain selection |
| `<leader>ar` | Refactor selection |
| `<leader>af` | Fix selection |
| `<leader>at` | Generate tests |
| `<leader>ad` | Generate docs |
| `<leader>fs` | Semantic search |
| `<leader>fg` | Go to (intent search) |

---

## Next Steps

1. **Open Ctrl and start editing** - AI features activate automatically
2. **Try inline completions** - Type some code, wait 500ms
3. **Open chat** - Press `<leader>ac` and ask a question
4. **Select code** - Press `v` to select, then `<leader>a` for AI actions
5. **Configure** - Edit `~/.config/ctrl/ai.toml` to customize

---

## Resources

- **API Pricing**: [anthropic.com/pricing](https://anthropic.com/pricing)
- **Model Capabilities**: [ctrl.getctrl.sh/models](https://ctrl.getctrl.sh/models)
- **Community**: [discord.gg/ctrl](https://discord.gg/ctrl)
- **FAQ**: [ctrl.getctrl.sh/faq](https://ctrl.getctrl.sh/faq)
