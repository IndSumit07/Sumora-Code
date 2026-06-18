"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import TopBar from "./components/TopBar";
import EditorPanel from "./components/EditorPanel";
import IOPanel from "./components/IOPanel";
import Sidebar from "./components/Sidebar";
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

  // ── Sidebar + MongoDB state ──────────────────────────────────────────────
  const [files, setFiles] = useState([]);
  const [currentFileId, setCurrentFileId] = useState(null);
  const [currentFileName, setCurrentFileName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveStatusVisible, setSaveStatusVisible] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveDialogName, setSaveDialogName] = useState("");
  const saveDialogInputRef = useRef(null);

  // ── Resize state ─────────────────────────────────────────────────────────
  const [editorWidthPx, setEditorWidthPx] = useState(null);
  const [inputHeightPx, setInputHeightPx] = useState(null);
  const [isDraggingH, setIsDraggingH] = useState(false);
  const [isDraggingV, setIsDraggingV] = useState(false);

  // Refs
  const editorAreaRef = useRef(null);
  const ioColRef = useRef(null);
  const saveTimerRef = useRef(null);
  const saveStatusTimerRef = useRef(null);
  const fetchingRef = useRef(false);

  // ── Fetch files from MongoDB ─────────────────────────────────────────────
  const fetchFiles = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const res = await fetch("/api/codes");
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch {
      // MongoDB may not be connected; silently ignore
    } finally {
      fetchingRef.current = false;
    }
  }, []);

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

    fetchFiles();
    setMounted(true);
  }, []);

  // ── Save status auto-dismiss timer ──────────────────────────────────────
  useEffect(() => {
    if (saveStatus === "saved" || saveStatus === "error") {
      setSaveStatusVisible(true);
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = setTimeout(() => {
        setSaveStatusVisible(false);
        setSaveStatus("idle");
      }, 2000);
    }
    return () => {
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    };
  }, [saveStatus]);

  // ── Debounced persist to localStorage ────────────────────────────────────
  const debounceSave = useCallback((newState) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveState(newState), DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    debounceSave({ language, code, input });
  }, [language, code, input, mounted, debounceSave]);

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    []
  );

  // ── Language change ───────────────────────────────────────────────────────
  const handleLanguageChange = useCallback(
    (newLang) => {
      setLanguage(newLang);
      const currentIsDefault = Object.values(LANGUAGES).some(
        (l) => l.snippet === code
      );
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

  // ── Sidebar handlers ─────────────────────────────────────────────────────
  const handleSelectFile = useCallback(async (file) => {
    try {
      const res = await fetch(`/api/codes/${file._id}`);
      if (!res.ok) return;
      const data = await res.json();
      setCurrentFileId(data._id);
      setCurrentFileName(data.question);
      setLanguage(data.language || defaultLang);
      setCode(data.code ?? LANGUAGES[data.language || defaultLang].snippet);
      setInput(data.input || "");
    } catch {
      // silently fail — editor state unchanged
    }
  }, []);

  const handleNewFile = useCallback(
    async (question) => {
      const snippet = LANGUAGES[language]?.snippet ?? LANGUAGES[defaultLang].snippet;
      try {
        const res = await fetch("/api/codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, language, code: snippet, input: "" }),
        });
        if (!res.ok) return;
        const newFile = await res.json();
        setCurrentFileId(newFile._id);
        setCurrentFileName(newFile.question);
        setCode(snippet);
        setInput("");
        await fetchFiles();
      } catch {
        // silently fail
      }
    },
    [language, fetchFiles]
  );

  const handleDeleteFile = useCallback(
    async (id) => {
      try {
        const res = await fetch(`/api/codes/${id}`, { method: "DELETE" });
        if (!res.ok) return;
        if (currentFileId === id) {
          setCurrentFileId(null);
          setCurrentFileName("");
        }
        setFiles((prev) => prev.filter((f) => f._id !== id));
      } catch {
        // silently fail
      }
    },
    [currentFileId]
  );

  // ── Save to MongoDB (Ctrl+S) ─────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (saveStatus === "saving") return;

    if (!currentFileId) {
      // No file selected — show save-as dialog
      setShowSaveDialog(true);
      setTimeout(() => saveDialogInputRef.current?.focus(), 50);
      return;
    }

    setSaveStatus("saving");
    setSaveStatusVisible(true);

    try {
      const res = await fetch(`/api/codes/${currentFileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, input }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("saved");
      setFiles((prev) =>
        prev.map((f) =>
          f._id === currentFileId
            ? { ...f, language, updatedAt: new Date().toISOString() }
            : f
        )
      );
    } catch {
      setSaveStatus("error");
    }
  }, [currentFileId, language, code, input, saveStatus]);

  const handleSaveAs = useCallback(async () => {
    const name = saveDialogName.trim();
    if (!name) return;

    setShowSaveDialog(false);
    setSaveDialogName("");
    setSaveStatus("saving");
    setSaveStatusVisible(true);

    try {
      const res = await fetch("/api/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: name, language, code, input }),
      });
      if (!res.ok) throw new Error("Save failed");
      const newFile = await res.json();
      setCurrentFileId(newFile._id);
      setCurrentFileName(newFile.question);
      setSaveStatus("saved");
      await fetchFiles();
    } catch {
      setSaveStatus("error");
    }
  }, [saveDialogName, language, code, input, fetchFiles]);

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

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S — save to MongoDB
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
        return;
      }
      // Ctrl/Cmd + Enter — run
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
      // Ctrl + ' (apostrophe) — run
      if (e.ctrlKey && e.key === "'") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRun, handleSave]);

  // ── Horizontal resize (editor ↔ sidebar) ─ pixel-based ──────────────────
  const startHResize = useCallback((e) => {
    e.preventDefault();
    setIsDraggingH(true);

    const onMouseMove = (e) => {
      const container = editorAreaRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - 10;
      const maxW = rect.width - 20 - 10 - 180;
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

  // ── Vertical resize (input ↔ output) ────────────────────────────────────
  const startVResize = useCallback((e) => {
    e.preventDefault();
    setIsDraggingV(true);

    const onMouseMove = (e) => {
      const container = ioColRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
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

  // ── Loading shell ────────────────────────────────────────────────────────
  if (!mounted) {
    return <div className="app-shell" aria-hidden="true" />;
  }

  return (
    <div
      className={`app-shell${isDraggingH ? " is-resizing" : ""}${
        isDraggingV ? " is-resizing-v" : ""
      }`}
    >
      {/* ── Top bar ── */}
      <TopBar
        language={language}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        isRunning={isRunning}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        saveStatus={saveStatus}
        saveStatusVisible={saveStatusVisible}
        onSave={handleSave}
      />

      {/* ── Body: sidebar + editor area ── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          files={files}
          currentFileId={currentFileId}
          onSelectFile={handleSelectFile}
          onNewFile={handleNewFile}
          onDeleteFile={handleDeleteFile}
        />

        {/* Main editor area */}
        <main className="editor-area" ref={editorAreaRef} role="main">
          {/* Left: Monaco editor */}
          <div
            className="editor-col"
            style={{
              flex: editorWidthPx
                ? `0 0 ${editorWidthPx}px`
                : "0 0 65%",
              minWidth: 0,
            }}
          >
            <EditorPanel
              language={language}
              monacoLang={LANGUAGES[language]?.monacoLang ?? "java"}
              value={code}
              onChange={(val) => setCode(val ?? "")}
              theme={theme}
              fileName={currentFileName || null}
            />
          </div>

          {/* Horizontal resize handle */}
          <div
            className={`resize-handle resize-handle-h${
              isDraggingH ? " dragging" : ""
            }`}
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

      {/* ── Save-as dialog ── */}
      {showSaveDialog && (
        <div
          className="save-dialog-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSaveDialog(false);
              setSaveDialogName("");
            }
          }}
        >
          <div className="save-dialog">
            <div className="save-dialog-title">Save code as</div>
            <div className="save-dialog-lang">{LANGUAGES[language]?.label ?? language}</div>
            <input
              ref={saveDialogInputRef}
              type="text"
              className="save-dialog-input"
              placeholder="Enter question name…"
              value={saveDialogName}
              onChange={(e) => setSaveDialogName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveAs();
                if (e.key === "Escape") {
                  setShowSaveDialog(false);
                  setSaveDialogName("");
                }
              }}
            />
            <div className="save-dialog-actions">
              <button
                className="save-dialog-btn save-dialog-btn-cancel"
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveDialogName("");
                }}
              >
                Cancel
              </button>
              <button
                className="save-dialog-btn save-dialog-btn-primary"
                onClick={handleSaveAs}
                disabled={!saveDialogName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
