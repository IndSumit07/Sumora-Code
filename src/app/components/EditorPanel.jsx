"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Pencil, Check, X } from "lucide-react";

// Monaco must be loaded client-side only
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        color: "var(--text-muted)",
        fontSize: "13px",
        fontFamily: "inherit",
        animation: "fadeIn 300ms ease both",
      }}
    >
      <div className="spinner-lg" />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <span style={{ fontWeight: 600 }}>Loading editor</span>
        <div className="loading-dots">
          <span /><span /><span />
        </div>
      </div>
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

let snippetsDefined = false;

function defineSnippets(monaco) {
  if (snippetsDefined) return;
  snippetsDefined = true;

  // Java Snippets
  monaco.languages.registerCompletionItemProvider("java", {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions = [
        {
          label: "sout",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "System.out.println($1);",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Print to standard output",
          range: range,
        },
        {
          label: "psvm",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "public static void main(String[] args) {\n\t$1\n}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Main method",
          range: range,
        },
        {
          label: "fori",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "for (int i = 0; i < $1; i++) {\n\t$2\n}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "For loop (i)",
          range: range,
        },
        {
          label: "forj",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "for (int j = 0; j < $1; j++) {\n\t$2\n}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "For loop (j)",
          range: range,
        }
      ];
      return { suggestions };
    },
  });

  // C++ Snippets
  monaco.languages.registerCompletionItemProvider("cpp", {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions = [
        {
          label: "cout",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "cout << $1 << \"\\\\n\";",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Print to standard output",
          range: range,
        },
        {
          label: "cin",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "cin >> $1;",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Read from standard input",
          range: range,
        },
        {
          label: "fori",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "for (int i = 0; i < $1; i++) {\n\t$2\n}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "For loop (i)",
          range: range,
        },
        {
          label: "forj",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "for (int j = 0; j < $1; j++) {\n\t$2\n}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "For loop (j)",
          range: range,
        }
      ];
      return { suggestions };
    },
  });
}

// ── Inline filename edit ────────────────────────────────────────────────────

function FilenameLabel({ fileName, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(fileName);
  const inputRef = useRef(null);

  useEffect(() => {
    setDraft(fileName);
  }, [fileName]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== fileName) {
      onRename(trimmed);
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(fileName);
    setEditing(false);
  };

  if (editing) {
    return (
      <form
        className="panel-label editor-filename editor-filename-edit"
        onSubmit={(e) => { e.preventDefault(); commit(); }}
      >
        <input
          ref={inputRef}
          className="editor-filename-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancel();
          }}
        />
        <button type="submit" className="editor-filename-action" aria-label="Confirm rename"><Check size={13} /></button>
        <button type="button" className="editor-filename-action" onClick={cancel} aria-label="Cancel rename"><X size={13} /></button>
      </form>
    );
  }

  return (
    <div className="panel-label editor-filename">
      <span className="editor-filename-text">{fileName}</span>
      <button
        className="editor-filename-edit-btn"
        onClick={() => setEditing(true)}
        title="Rename file"
        aria-label="Rename file"
      >
        <Pencil size={12} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function EditorPanel({ language, monacoLang, value, onChange, theme, fileName, onRename, onCopy }) {
  const monacoRef = useRef(null);
  const editorRef = useRef(null);

  const monacoTheme = theme === "dark" ? "cp-dark" : "cp-light";

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
      defineSnippets(monaco);
      monaco.editor.setTheme(monacoTheme);

      // Custom copy behavior
      editor.onKeyDown(async (e) => {
        if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyC) {
          const selection = editor.getSelection();
          if (selection && selection.isEmpty()) {
            e.preventDefault();
            const fullText = editor.getValue();
            try {
              await navigator.clipboard.writeText(fullText);
              if (onCopy) onCopy(true);
            } catch (err) {
              console.error("Failed to copy full text:", err);
            }
          } else if (selection) {
            e.preventDefault();
            const selectedText = editor.getModel().getValueInRange(selection);
            try {
              await navigator.clipboard.writeText(selectedText);
              if (onCopy) onCopy(false);
            } catch (err) {
              console.error("Failed to copy selected text:", err);
            }
          }
        }
      });

      editor.focus();
    },
    [monacoTheme, onCopy]
  );

  const options = {
    fontSize: 14,
    lineHeight: 22,
    fontFamily:
      "var(--font-editor), 'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
    fontLigatures: true,
    fontVariants: "common-ligatures",
    minimap: { enabled: false },
    wordWrap: "on",
    lineNumbers: "on",
    renderWhitespace: "none",
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: "smooth",
    cursorSmoothCaretAnimation: "on",
    cursorInvertSelection: false,
    mouseWheelZoom: true,
    padding: { top: 14, bottom: 14 },
    renderLineHighlight: "all",
    renderLineHighlightOnlyWhenFocus: false,
    bracketPairColorization: { enabled: true, independentColorPoolPerBracketType: true },
    guides: { bracketPairs: true, indentation: true, highlightActiveBracketPair: true },
    suggest: { showKeywords: true, showSnippets: true },
    tabSize: 4,
    insertSpaces: true,
    detectIndentation: true,
    automaticLayout: true,
    fastScrollSensitivity: 8,
    scrollbar: {
      vertical: "auto",
      horizontal: "auto",
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6,
      useShadows: false,
    },
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    roundedSelection: true,
    folding: true,
    showFoldingControls: "mouseover",
    matchBrackets: "always",
    occurrencesHighlight: "singleFile",
    selectionHighlight: true,
    colorDecorators: true,
    contextmenu: true,
    copyWithSyntaxHighlighting: true,
    multiCursorModifier: "ctrlCmd",
    formatOnPaste: true,
    formatOnType: false,
    links: true,
    wordBasedSuggestions: "off",
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnCommitCharacter: true,
  };

  return (
    <div className="panel editor-panel fade-in" style={{ flex: 1 }}>
      {fileName && <FilenameLabel fileName={fileName} onRename={onRename} />}
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <MonacoEditor
          height="100%"
          language={monacoLang}
          value={value}
          onChange={onChange}
          onMount={handleMount}
          theme={monacoTheme}
          options={options}
          loading={null}
        />
      </div>
    </div>
  );
}
