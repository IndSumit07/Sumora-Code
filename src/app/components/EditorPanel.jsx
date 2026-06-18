"use client";

import { useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

// Monaco must be loaded client-side only
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        fontSize: "13px",
        fontFamily: "inherit",
      }}
    >
      Loading editor…
    </div>
  ),
});

// ── Custom Monaco themes ──────────────────────────────────────────────────

const DARK_THEME = {
  base: "vs-dark",
  inherit: false,
  rules: [
    // VS Code Dark+ palette
    { token: "",             foreground: "d4d4d4", background: "111111" },
    { token: "comment",      foreground: "6a9955", fontStyle: "italic" },
    { token: "comment.doc",  foreground: "608b4e", fontStyle: "italic" },
    { token: "keyword",      foreground: "569cd6" },
    { token: "keyword.control", foreground: "c586c0" },
    { token: "string",       foreground: "ce9178" },
    { token: "string.escape",foreground: "d7ba7d" },
    { token: "number",       foreground: "b5cea8" },
    { token: "type",         foreground: "4ec9b0" },
    { token: "type.identifier", foreground: "4ec9b0" },
    { token: "delimiter",    foreground: "d4d4d4" },
    { token: "operator",     foreground: "d4d4d4" },
    { token: "variable",     foreground: "9cdcfe" },
    { token: "variable.predefined", foreground: "4fc1ff" },
    { token: "identifier",   foreground: "d4d4d4" },
    { token: "function",     foreground: "dcdcaa" },
    { token: "annotation",   foreground: "dcdcaa" },
    { token: "constant",     foreground: "4fc1ff" },
    { token: "tag",          foreground: "569cd6" },
    { token: "attribute.name", foreground: "9cdcfe" },
    { token: "attribute.value", foreground: "ce9178" },
    { token: "namespace",    foreground: "4ec9b0" },
  ],
  colors: {
    "editor.background":              "#111111",
    "editor.foreground":              "#d4d4d4",
    "editor.lineHighlightBackground": "#1a1a1a",
    "editor.selectionBackground":     "#264f78",
    "editor.inactiveSelectionBackground": "#3a3d41",
    "editorCursor.foreground":        "#aeafad",
    "editorLineNumber.foreground":    "#3a3a3a",
    "editorLineNumber.activeForeground": "#c6c6c6",
    "editorIndentGuide.background1":  "#2a2a2a",
    "editorIndentGuide.activeBackground1": "#404040",
    "editor.findMatchBackground":     "#515c6a",
    "editor.findMatchHighlightBackground": "#314365",
    "editorWidget.background":        "#1a1a1a",
    "editorWidget.border":            "#2e2e2e",
    "input.background":               "#222222",
    "input.foreground":               "#d4d4d4",
    "input.border":                   "#2e2e2e",
    "scrollbar.shadow":               "#00000060",
    "scrollbarSlider.background":     "#2e2e2e40",
    "scrollbarSlider.hoverBackground":"#40404080",
    "scrollbarSlider.activeBackground":"#606060",
  },
};

const LIGHT_THEME = {
  base: "vs",
  inherit: false,
  rules: [
    // VS Code Light+ palette
    { token: "",             foreground: "000000", background: "ffffff" },
    { token: "comment",      foreground: "008000", fontStyle: "italic" },
    { token: "comment.doc",  foreground: "008000", fontStyle: "italic" },
    { token: "keyword",      foreground: "0000ff" },
    { token: "keyword.control", foreground: "af00db" },
    { token: "string",       foreground: "a31515" },
    { token: "string.escape",foreground: "ee0000" },
    { token: "number",       foreground: "098658" },
    { token: "type",         foreground: "267f99" },
    { token: "type.identifier", foreground: "267f99" },
    { token: "delimiter",    foreground: "000000" },
    { token: "operator",     foreground: "000000" },
    { token: "variable",     foreground: "001080" },
    { token: "variable.predefined", foreground: "0070c1" },
    { token: "identifier",   foreground: "000000" },
    { token: "function",     foreground: "795e26" },
    { token: "annotation",   foreground: "795e26" },
    { token: "constant",     foreground: "0070c1" },
    { token: "tag",          foreground: "800000" },
    { token: "attribute.name", foreground: "ff0000" },
    { token: "attribute.value", foreground: "0000ff" },
    { token: "namespace",    foreground: "267f99" },
  ],
  colors: {
    "editor.background":              "#ffffff",
    "editor.foreground":              "#000000",
    "editor.lineHighlightBackground": "#f5f5f5",
    "editor.selectionBackground":     "#add6ff",
    "editor.inactiveSelectionBackground": "#e5ebf1",
    "editorCursor.foreground":        "#000000",
    "editorLineNumber.foreground":    "#cccccc",
    "editorLineNumber.activeForeground": "#0b216f",
    "editorIndentGuide.background1":  "#e8e8e8",
    "editorIndentGuide.activeBackground1": "#cccccc",
    "editorWidget.background":        "#f5f5f5",
    "editorWidget.border":            "#d4d4d4",
    "input.background":               "#ffffff",
    "input.foreground":               "#000000",
    "input.border":                   "#d4d4d4",
    "scrollbarSlider.background":     "#d4d4d440",
    "scrollbarSlider.hoverBackground":"#cccccc80",
  },
};

function defineThemes(monaco) {
  monaco.editor.defineTheme("cp-dark", DARK_THEME);
  monaco.editor.defineTheme("cp-light", LIGHT_THEME);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function EditorPanel({ language, value, onChange, theme }) {
  const monacoRef = useRef(null);
  const editorRef = useRef(null);

  const monacoTheme = theme === "dark" ? "cp-dark" : "cp-light";

  // Update theme when it changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(monacoTheme);
    }
  }, [monacoTheme]);

  const handleMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      defineThemes(monaco);
      monaco.editor.setTheme(monacoTheme);

      // Focus the editor on mount
      editor.focus();
    },
    [monacoTheme]
  );

  const options = {
    fontSize: 14,
    lineHeight: 22,           // ~1.6 at 14px
    fontFamily:
      "var(--font-editor), 'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
    fontLigatures: true,
    minimap: { enabled: false },
    wordWrap: "on",
    lineNumbers: "on",
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: "smooth",
    cursorSmoothCaretAnimation: "on",
    padding: { top: 14, bottom: 14 },
    renderLineHighlight: "line",
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: true, indentation: true },
    suggest: { showKeywords: true },
    tabSize: 4,
    insertSpaces: true,
    automaticLayout: true,
    scrollbar: {
      vertical: "auto",
      horizontal: "auto",
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6,
    },
  };

  return (
    <div className="panel editor-panel fade-in" style={{ flex: 1 }}>
      <MonacoEditor
        height="100%"
        language={language === "cpp" ? "cpp" : "java"}
        value={value}
        onChange={onChange}
        onMount={handleMount}
        theme={monacoTheme}
        options={options}
        loading={null}
      />
    </div>
  );
}
