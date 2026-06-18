"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import TopBar from "./components/TopBar";
import EditorPanel from "./components/EditorPanel";
import IOPanel from "./components/IOPanel";
import {
  LANGUAGES,
  STORAGE_KEY,
  THEME_KEY,
  DEBOUNCE_MS,
  STATE_TTL_MS,
} from "./lib/constants";

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > STATE_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function loadPersistedTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || "dark";
  } catch {
    return "dark";
  }
}

function saveState(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, savedAt: Date.now() })
    );
  } catch {}
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EditorPage() {
  const defaultLang = "java";

  // ── Core state ───────────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState(defaultLang);
  const [code, setCode] = useState(LANGUAGES[defaultLang].snippet);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // ── Resize state ─────────────────────────────────────────────────────────
  // editorWidthPx: null means use default CSS (65%). Set on first drag.
  const [editorWidthPx, setEditorWidthPx] = useState(null);
  // inputHeightPx: input panel height in px. null means use default CSS (35%).
  const [inputHeightPx, setInputHeightPx] = useState(null);
  const [isDraggingH, setIsDraggingH] = useState(false);
  const [isDraggingV, setIsDraggingV] = useState(false);

  // Refs for resize calculations
  const editorAreaRef = useRef(null);
  const ioColRef = useRef(null);
  const saveTimerRef = useRef(null);

  // ── On mount: restore state ───────────────────────────────────────────────
  useEffect(() => {
    const savedTheme = loadPersistedTheme();
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    const saved = loadPersistedState();
    if (saved) {
      setLanguage(saved.language || defaultLang);
      setCode(saved.code ?? LANGUAGES[saved.language || defaultLang].snippet);
      setInput(saved.input || "");
    }

    setMounted(true);
  }, []);

  // ── Debounced persist ─────────────────────────────────────────────────────
  const debounceSave = useCallback((newState) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveState(newState), DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    debounceSave({ language, code, input });
  }, [language, code, input, mounted, debounceSave]);

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  // ── Language change ───────────────────────────────────────────────────────
  const handleLanguageChange = useCallback(
    (newLang) => {
      setLanguage(newLang);
      const currentIsDefault = Object.values(LANGUAGES).some((l) => l.snippet === code);
      if (currentIsDefault) setCode(LANGUAGES[newLang].snippet);
    },
    [code]
  );

  // ── Theme toggle ──────────────────────────────────────────────────────────
  const handleThemeToggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      saveTheme(next);
      return next;
    });
  }, []);

  // ── Code execution ────────────────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput(null);
    setIsError(false);

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, stdin: input }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setOutput(data.error || "An unexpected error occurred.");
        setIsError(true);
      } else {
        setOutput(data.output);
        setIsError(data.isError);
      }
    } catch (err) {
      setOutput(`Network error: ${err.message}`);
      setIsError(true);
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, language, code, input]);

  // ── Keyboard shortcuts: Ctrl/Cmd+Enter and Ctrl+' ────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Enter
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
      // Ctrl + ' (apostrophe)
      if (e.ctrlKey && e.key === "'") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRun]);


  // ── Horizontal resize (editor ↔ sidebar) ─ pixel-based ───────────────────
  const startHResize = useCallback((e) => {
    e.preventDefault();
    setIsDraggingH(true);

    const onMouseMove = (e) => {
      const container = editorAreaRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      // rect.left includes left padding (10px). Mouse position relative to inner left edge:
      const mouseX = e.clientX - rect.left - 10; // 10px left padding
      // Keep editor between 180px and (container - handle - sidebar min)
      const maxW = rect.width - 20 - 10 - 180; // padding(20) + handle(10) + sidebar min(180)
      const newW = Math.min(Math.max(mouseX, 180), maxW);
      setEditorWidthPx(newW);
    };

    const onMouseUp = () => {
      setIsDraggingH(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  // ── Vertical resize (input ↔ output) ─────────────────────────────────────
  const startVResize = useCallback((e) => {
    e.preventDefault();
    setIsDraggingV(true);

    const onMouseMove = (e) => {
      const container = ioColRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      // Mouse position relative to top of io-col container
      const mouseY = e.clientY - rect.top;
      // Clamp between 80px min for input and (total - handle - 80px min for output)
      const maxH = rect.height - 10 - 80;
      const newH = Math.min(Math.max(mouseY, 80), maxH);
      setInputHeightPx(newH);
    };

    const onMouseUp = () => {
      setIsDraggingV(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  // ── Loading shell ─────────────────────────────────────────────────────────
  if (!mounted) {
    return <div className="app-shell" aria-hidden="true" />;
  }

  return (
    <div
      className={`app-shell${isDraggingH ? " is-resizing" : ""}${isDraggingV ? " is-resizing-v" : ""}`}
    >
      {/* ── Top bar ── */}
      <TopBar
        language={language}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        isRunning={isRunning}
        theme={theme}
        onThemeToggle={handleThemeToggle}
      />

      {/* ── Main editor area ── */}
      <main className="editor-area" ref={editorAreaRef} role="main">
        {/* Left: Monaco editor */}
        <div
          className="editor-col"
          style={{
            flex: editorWidthPx ? `0 0 ${editorWidthPx}px` : "0 0 65%",
            minWidth: 0,
          }}
        >
          <EditorPanel
            language={language}
            monacoLang={LANGUAGES[language]?.monacoLang ?? "java"}
            value={code}
            onChange={(val) => setCode(val ?? "")}
            theme={theme}
          />
        </div>

        {/* Horizontal resize handle */}
        <div
          className={`resize-handle resize-handle-h${isDraggingH ? " dragging" : ""}`}
          onMouseDown={startHResize}
          title="Drag to resize editor"
          aria-hidden="true"
        />

        {/* Right: stdin + stdout */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <IOPanel
            input={input}
            onInputChange={setInput}
            output={output}
            isError={isError}
            inputHeightPx={inputHeightPx}
            onVResizeStart={startVResize}
            containerRef={ioColRef}
          />
        </div>
      </main>
    </div>
  );
}
