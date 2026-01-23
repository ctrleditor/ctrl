# Keybind System Architecture

## Overview

Ctrl's keybind system is fully configurable and command-driven. All keyboard input is mapped through a flexible keybind configuration system that translates user input into commands executed by pure command handlers.

## How It Works

### 1. Keystroke Input Flow

```
User presses key → OpenTUI captures key event → handleKeystroke()
    ↓
Check global commands (e.g., Ctrl+P for help)
    ↓
Look up keybind in config for current mode
    ↓
Execute command handler if found
    ↓
Handle text input if no command matched (insert/command mode)
    ↓
Return new AppState
```

### 2. Configuration

Keybinds are defined in `~/.config/ctrl/config.toml`:

```toml
[keybinds.normal]
i = "enter_insert"
v = "enter_visual"
"ctrl+v" = "enter_visual_block"
"shift+v" = "enter_visual_line"
"/" = "enter_command"
h = "move_left"
j = "move_down"
k = "move_up"
l = "move_right"
p = "paste"

[keybinds.insert]
escape = "enter_normal"
"ctrl+c" = "enter_normal"
"ctrl+d" = "enter_normal"
"ctrl+h" = "move_left"
"ctrl+j" = "move_down"
"ctrl+k" = "move_up"
"ctrl+l" = "move_right"

[keybinds.visual]
# Visual mode commands

[keybinds.command]
# Command mode commands
```

### 3. Keybind Format

Simple keys:
```toml
i = "enter_insert"
v = "enter_visual"
```

Keys with modifiers:
```toml
"ctrl+c" = "enter_normal"
"shift+v" = "enter_visual_line"
"ctrl+shift+s" = "some_command"
"meta+k" = "another_command"
```

Special keys:
```toml
escape = "exit_mode"
return = "confirm_command"
backspace = "delete_char"
tab = "indent"
```

### 4. Available Commands

Commands are pure functions in `src/core/commands/keybind-executor.ts`. Each command maps to a handler that takes the current state and returns a new state.

**Normal Mode Commands:**
- `enter_insert` - Enter insert mode
- `enter_visual` - Enter visual mode
- `enter_visual_line` - Enter visual-line mode (Shift+V)
- `enter_visual_block` - Enter visual-block mode (Ctrl+V)
- `enter_command` - Enter command mode
- `move_left`, `move_right`, `move_up`, `move_down` - Navigate cursor
- `paste` - Paste from clipboard

**Insert Mode Commands:**
- `enter_normal` - Return to normal mode
- `move_left`, `move_right`, `move_up`, `move_down` - Navigate (Ctrl+hjkl)
- `delete_char` - Delete character before cursor (backspace)
- `insert_newline` - Insert newline (return)
- Text input is handled automatically for printable characters

**Visual Mode Commands:**
- `exit_visual` - Return to normal mode (escape)
- `delete_selection` - Delete selected text (d)
- `yank_selection` - Copy selection to clipboard (y)
- `move_left`, `move_right`, `move_up`, `move_down` - Navigation expands selection

**Command Mode Commands:**
- `execute_command` - Execute command (return)
- `exit_command` - Return to normal mode (escape)
- `delete_command_char` - Delete last character (backspace)
- Text input is handled automatically

**Global Commands:**
- `toggle_help` - Show/hide help menu (Ctrl+P)
- `close_help` - Close help menu (escape when help is open)

### 5. Implementation Details

#### File Structure

```
src/core/commands/
├── keybind-executor.ts    # Command handlers (pure functions)
├── keybind-matcher.ts     # Parse and match keybind strings
├── registry.ts            # Command registry (for future plugin support)
└── index.ts              # Barrel export
```

#### Key Functions

**`parseKeybind(pattern: string): ParsedKeybind`**
- Parses "ctrl+c" → `{ key: "c", ctrl: true, shift: false, meta: false }`
- Case-insensitive
- Handles modifiers: ctrl, shift, meta

**`matchesKeybind(pattern, key, keyEvent): boolean`**
- Returns true if key + modifiers match the pattern
- Handles special key aliases (enter/return, space)
- Used to find which command a keystroke triggers

**`findCommand(keybinds, key, keyEvent): string | undefined`**
- Searches keybinds for current mode
- Returns command name if found
- Returns undefined if no match

**`executeCommand(commandName, state, context): AppState`**
- Executes a command by name
- Pure function: state → newState
- All command handlers are pure (no side effects)

#### Visual Mode Navigation

Visual mode (character/line/block selection) has special behavior - navigation commands update the selection anchor. This is handled in the command executor:

```typescript
// When user presses 'l' in visual mode:
// 1. findCommand finds "move_right" command
// 2. executeCommand runs move_right handler
// 3. Handler checks if in visual mode and state.selection exists
// 4. Updates selection.active to new cursor position
// 5. Returns new state with expanded selection
```

### 6. Customization

Users can customize keybinds completely in `config.toml`:

```toml
# Example: Remap to arrow keys
[keybinds.normal]
up = "move_up"
down = "move_down"
left = "move_left"
right = "move_right"

# Example: Vim-like keybinds
[keybinds.normal]
"ctrl+6" = "switch_buffer"
"ctrl+w" = "window_command"
```

### 7. Adding New Commands

To add a new command:

1. **Define handler in `keybind-executor.ts`:**
```typescript
my_new_command: (state) => {
  // Pure function - no side effects
  return { ...state, /* updates */ };
},
```

2. **Add to keybinds in `config.toml`:**
```toml
[keybinds.normal]
"x" = "my_new_command"
```

3. **Test the command** using the command executor tests

### 8. Testing

Run tests for the keybind system:

```bash
bun test test/keybind-system.test.ts
```

Tests cover:
- Keybind parsing (simple, modifiers, special keys)
- Keybind matching
- Command lookup
- Command execution
- Integration with handleKeystroke

### 9. Help Menu Integration

The help menu dynamically displays keybinds from the current configuration. Users can see all available commands with their keybinds via Ctrl+P.

### 10. Future: Plugin System

The keybind executor architecture is designed for easy plugin integration:
- Plugins can register new commands
- Commands are identified by name (string)
- Plugins can override default keybinds
- No tight coupling between commands and keybinds

## Architecture Benefits

1. **Fully Configurable** - Users can remap any keybind
2. **Testable** - Commands are pure functions
3. **Extensible** - Easy to add new commands or plugins
4. **Type-Safe** - TypeScript ensures correctness
5. **Performant** - Simple string matching, no complex state
6. **Maintainable** - Single source of truth for command logic

## See Also

- `src/core/commands/` - Implementation
- `test/keybind-system.test.ts` - Tests
- `.config/ctrl/config.toml` - User configuration
