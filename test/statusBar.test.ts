import { describe, it, expect } from "bun:test";
import { renderStatusBarComponent } from "../src/ui/statusBar/renderer";
import type { AppState } from "../src/types/app";
import type { StatusBarComponentType } from "../src/config/schema";

/**
 * Create a minimal AppState for testing
 */
const createTestState = (overrides: Partial<AppState> = {}): AppState => ({
  buffer: {
    id: "test-buffer",
    content: "line 1\nline 2\nline 3",
    filePath: "/home/user/test.ts",
    language: "typescript",
    isDirty: false,
    modifiedTime: Date.now(),
  },
  modal: {
    currentMode: "normal",
    cursorPosition: { line: 0, column: 0 },
  },
  commandRegistry: new Map(),
  config: {
    ui: {
      theme: "dracula",
      colors: {
        normalMode: "#88BB22",
        insertMode: "#22AAFF",
        visualMode: "#FF9922",
        commandMode: "#FFFF00",
        statusBarBg: "#1a1a1a",
        textFg: "#FFFFFF",
      },
      lineNumbers: true,
      relativeLineNumbers: false,
    },
    keybinds: {
      normal: {},
      insert: {},
      visual: {},
      command: {},
    },
  },
  selection: null,
  clipboard: "",
  syntax: null,
  ...overrides,
});

describe("renderStatusBarComponent", () => {
  it("should render mode component for normal mode", () => {
    const state = createTestState({
      modal: { currentMode: "normal", cursorPosition: { line: 0, column: 0 } },
    });
    const component: StatusBarComponentType = { type: "mode" };

    const result = renderStatusBarComponent("mode", component, state);

    expect(result.text).toBe("NORMAL");
    expect(result.fg).toBe("#88BB22");
  });

  it("should render mode component for insert mode", () => {
    const state = createTestState({
      modal: { currentMode: "insert", cursorPosition: { line: 0, column: 0 } },
    });
    const component: StatusBarComponentType = { type: "mode" };

    const result = renderStatusBarComponent("mode", component, state);

    expect(result.text).toBe("INSERT");
    expect(result.fg).toBe("#22AAFF");
  });

  it("should render mode component for visual mode", () => {
    const state = createTestState({
      modal: { currentMode: "visual", cursorPosition: { line: 0, column: 0 } },
    });
    const component: StatusBarComponentType = { type: "mode" };

    const result = renderStatusBarComponent("mode", component, state);

    expect(result.text).toBe("VISUAL");
    expect(result.fg).toBe("#FF9922");
  });

  it("should render mode component for visual-line mode", () => {
    const state = createTestState({
      modal: { currentMode: "visual-line", cursorPosition: { line: 0, column: 0 } },
    });
    const component: StatusBarComponentType = { type: "mode" };

    const result = renderStatusBarComponent("mode", component, state);

    expect(result.text).toBe("V-LINE");
  });

  it("should render mode component for visual-block mode", () => {
    const state = createTestState({
      modal: { currentMode: "visual-block", cursorPosition: { line: 0, column: 0 } },
    });
    const component: StatusBarComponentType = { type: "mode" };

    const result = renderStatusBarComponent("mode", component, state);

    expect(result.text).toBe("V-BLOCK");
  });

  it("should render mode component for command mode", () => {
    const state = createTestState({
      modal: { currentMode: "command", cursorPosition: { line: 0, column: 0 } },
    });
    const component: StatusBarComponentType = { type: "mode" };

    const result = renderStatusBarComponent("mode", component, state);

    expect(result.text).toBe("COMMAND");
    expect(result.fg).toBe("#FFFF00");
  });

  it("should render mode component with custom colors", () => {
    const state = createTestState({
      modal: { currentMode: "normal", cursorPosition: { line: 0, column: 0 } },
    });
    const component: StatusBarComponentType = {
      type: "mode",
      colors: {
        normal: "#FF0000",
        insert: "#00FF00",
        visual: "#0000FF",
        visualLine: "#FF00FF",
        visualBlock: "#FFFF00",
        command: "#00FFFF",
      },
    };

    const result = renderStatusBarComponent("mode", component, state);

    expect(result.fg).toBe("#FF0000");
  });

  it("should render filePath component", () => {
    const state = createTestState({
      buffer: {
        id: "test-buffer",
        content: "",
        filePath: "/home/user/test.ts",
        language: "typescript",
        isDirty: false,
        modifiedTime: Date.now(),
      },
    });
    const component: StatusBarComponentType = { type: "filePath", truncate: 50 };

    const result = renderStatusBarComponent("filePath", component, state);

    expect(result.text).toBe("/home/user/test.ts");
  });

  it("should truncate long filePath", () => {
    const state = createTestState({
      buffer: {
        id: "test-buffer",
        content: "",
        filePath: "/very/long/path/to/a/deeply/nested/file/in/the/system/test.ts",
        language: "typescript",
        isDirty: false,
        modifiedTime: Date.now(),
      },
    });
    const component: StatusBarComponentType = { type: "filePath", truncate: 20 };

    const result = renderStatusBarComponent("filePath", component, state);

    expect(result.text).toContain("...");
    expect(result.text.length).toBeLessThanOrEqual(23); // "..." + 20
  });

  it("should show 'untitled' for missing filePath", () => {
    const state = createTestState({
      buffer: {
        id: "test-buffer",
        content: "",
        filePath: undefined,
        language: "typescript",
        isDirty: false,
        modifiedTime: Date.now(),
      },
    });
    const component: StatusBarComponentType = { type: "filePath", truncate: 50 };

    const result = renderStatusBarComponent("filePath", component, state);

    expect(result.text).toBe("untitled");
  });

  it("should render position component", () => {
    const state = createTestState({
      modal: { currentMode: "normal", cursorPosition: { line: 5, column: 10 } },
    });
    const component: StatusBarComponentType = {
      type: "position",
      format: "Ln {line}, Col {col}",
    };

    const result = renderStatusBarComponent("position", component, state);

    expect(result.text).toBe("Ln 6, Col 11"); // 1-indexed
  });

  it("should render position component with custom format", () => {
    const state = createTestState({
      modal: { currentMode: "normal", cursorPosition: { line: 0, column: 0 } },
    });
    const component: StatusBarComponentType = {
      type: "position",
      format: "{line}:{col}",
    };

    const result = renderStatusBarComponent("position", component, state);

    expect(result.text).toBe("1:1");
  });

  it("should render modified component when buffer is dirty", () => {
    const state = createTestState({
      buffer: {
        id: "test-buffer",
        content: "",
        filePath: "/home/user/test.ts",
        language: "typescript",
        isDirty: true,
        modifiedTime: Date.now(),
      },
    });
    const component: StatusBarComponentType = {
      type: "modified",
      text: "[+]",
    };

    const result = renderStatusBarComponent("modified", component, state);

    expect(result.text).toBe("[+]");
  });

  it("should render empty modified component when buffer is clean", () => {
    const state = createTestState({
      buffer: {
        id: "test-buffer",
        content: "",
        filePath: "/home/user/test.ts",
        language: "typescript",
        isDirty: false,
        modifiedTime: Date.now(),
      },
    });
    const component: StatusBarComponentType = {
      type: "modified",
      text: "[+]",
    };

    const result = renderStatusBarComponent("modified", component, state);

    expect(result.text).toBe("");
  });

  it("should render text component", () => {
    const state = createTestState();
    const component: StatusBarComponentType = {
      type: "text",
      text: "static text",
      fg: "#FF0000",
    };

    const result = renderStatusBarComponent("text", component, state);

    expect(result.text).toBe("static text");
    expect(result.fg).toBe("#FF0000");
  });

  it("should render lineCount component", () => {
    const state = createTestState({
      buffer: {
        id: "test-buffer",
        content: "line 1\nline 2\nline 3",
        filePath: "/home/user/test.ts",
        language: "typescript",
        isDirty: false,
        modifiedTime: Date.now(),
      },
    });
    const component: StatusBarComponentType = { type: "lineCount" };

    const result = renderStatusBarComponent("lineCount", component, state);

    expect(result.text).toBe("3 lines");
  });

  it("should render fileSize component in bytes", () => {
    const state = createTestState({
      buffer: {
        id: "test-buffer",
        content: "hello", // 5 bytes
        filePath: "/home/user/test.ts",
        language: "typescript",
        isDirty: false,
        modifiedTime: Date.now(),
      },
    });
    const component: StatusBarComponentType = { type: "fileSize", format: "bytes" };

    const result = renderStatusBarComponent("fileSize", component, state);

    expect(result.text).toBe("5 B");
  });

  it("should render fileSize component in KB", () => {
    const state = createTestState({
      buffer: {
        id: "test-buffer",
        content: "x".repeat(2048), // 2 KB
        filePath: "/home/user/test.ts",
        language: "typescript",
        isDirty: false,
        modifiedTime: Date.now(),
      },
    });
    const component: StatusBarComponentType = { type: "fileSize", format: "kb" };

    const result = renderStatusBarComponent("fileSize", component, state);

    expect(result.text).toContain("KB");
  });

  it("should render fileSize component in human format", () => {
    const state = createTestState({
      buffer: {
        id: "test-buffer",
        content: "x".repeat(512), // 512 bytes
        filePath: "/home/user/test.ts",
        language: "typescript",
        isDirty: false,
        modifiedTime: Date.now(),
      },
    });
    const component: StatusBarComponentType = { type: "fileSize", format: "human" };

    const result = renderStatusBarComponent("fileSize", component, state);

    expect(result.text).toBe("512 B");
  });

  it("should render gitBranch component", () => {
    const state = createTestState();
    const component: StatusBarComponentType = { type: "gitBranch", ifExists: false };

    const result = renderStatusBarComponent("gitBranch", component, state);

    // Currently returns "(no git)" as placeholder
    expect(result.text).toBe("(no git)");
  });

  it("should skip unknown component types", () => {
    const state = createTestState();
    const component = { type: "unknown" } as StatusBarComponentType;

    const result = renderStatusBarComponent("unknown", component, state);

    expect(result.text).toBe("");
  });
});
