"use client";

import { useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { contentFor, languageFor } from "../lib/vscode-data";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-[#858585] text-[13px]">
      Loading editor…
    </div>
  ),
});

const VSCODE_DARK = {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#1e1e1e",
    "editor.foreground": "#d4d4d4",
    "editor.lineHighlightBackground": "#2a2a2a",
    "editor.selectionBackground": "#264f78",
    "editor.inactiveSelectionBackground": "#3a3d41",
    "editorCursor.foreground": "#aeafad",
    "editorLineNumber.foreground": "#858585",
    "editorLineNumber.activeForeground": "#c6c6c6",
    "editorIndentGuide.background1": "#404040",
    "editorIndentGuide.activeBackground1": "#707070",
    "editorWidget.background": "#252526",
    "editorWidget.border": "#454545",
    "input.background": "#3c3c3c",
    "input.foreground": "#cccccc",
    "input.border": "#454545",
    "scrollbarSlider.background": "#4a4a4a80",
    "scrollbarSlider.hoverBackground": "#4a4a4acc",
    "scrollbarSlider.activeBackground": "#4a4a4a",
  },
};

let themeDefined = false;

function ensureTheme(monaco) {
  if (themeDefined) return;
  themeDefined = true;
  monaco.editor.defineTheme("vscode-dark", VSCODE_DARK);
}

export default function CodeEditor({ fileId }) {
  const monacoRef = useRef(null);

  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme("vscode-dark");
    }
  }, []);

  const handleMount = useCallback((editor, monaco) => {
    monacoRef.current = monaco;
    ensureTheme(monaco);
    monaco.editor.setTheme("vscode-dark");
  }, []);

  if (!fileId) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center bg-[#1e1e1e]">
        <span className="text-[13px] text-[#858585] select-none">
          No editor open — select a file from the explorer.
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 bg-[#1e1e1e]">
      <MonacoEditor
        height="100%"
        language={languageFor(fileId)}
        value={contentFor(fileId)}
        onMount={handleMount}
        theme="vscode-dark"
        options={{
          fontSize: 14,
          fontFamily: "var(--font-editor), 'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
          fontLigatures: true,
          lineNumbers: "on",
          minimap: { enabled: false },
          wordWrap: "off",
          tabSize: 2,
          insertSpaces: true,
          smoothScrolling: true,
          scrollBeyondLastLine: false,
          cursorBlinking: "blink",
          cursorSmoothCaretAnimation: "on",
          automaticLayout: true,
          renderLineHighlight: "all",
          renderLineHighlightOnlyWhenFocus: false,
          padding: { top: 8, bottom: 8 },
          folding: true,
          showFoldingControls: "mouseover",
          bracketPairColorization: { enabled: true, independentColorPoolPerBracketType: true },
          guides: { indentation: true, bracketPairs: false, highlightActiveBracketPair: true },
          matchBrackets: "always",
          selectionHighlight: true,
          occurrencesHighlight: "off",
          suggest: { enabled: false },
          quickSuggestions: false,
          parameterHints: { enabled: false },
          hover: { enabled: false },
          links: false,
          contextmenu: true,
          stickyScroll: { enabled: false },
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
            useShadows: false,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          roundedSelection: true,
          renderWhitespace: "none",
          formatOnPaste: false,
          formatOnType: false,
          wordBasedSuggestions: "off",
          fixedOverflowWidgets: true,
        }}
      />
    </div>
  );
}
