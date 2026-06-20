"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import TopBar from "./components/TopBar";
import EditorPanel from "./components/EditorPanel";
import IOPanel from "./components/IOPanel";
import Sidebar from "./components/Sidebar";
import { LANGUAGES, THEME_KEY } from "./lib/constants";

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadPersistedTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || "dark";
  } catch {
    return "dark";
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EditorPage() {
  const router = useRouter();
  const defaultLang = "java";

  // ── Core state ───────────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState(defaultLang);
  const [code, setCode] = useState("");
  const [originalCode, setOriginalCode] = useState("");
  const [input, setInput] = useState("");
  const [originalInput, setOriginalInput] = useState("");
  const [output, setOutput] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const isDirty = code !== originalCode || input !== originalInput;

  // ── Sidebar + MongoDB state ──────────────────────────────────────────────
  const [files, setFiles] = useState([]);
  const [currentFileId, setCurrentFileId] = useState(null);
  const [currentFileName, setCurrentFileName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveStatusVisible, setSaveStatusVisible] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [copySignal, setCopySignal] = useState(null);
  const [newFilePopupVisible, setNewFilePopupVisible] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  // ── Resize state ─────────────────────────────────────────────────────────
  const [editorWidthPx, setEditorWidthPx] = useState(null);
  const [inputHeightPx, setInputHeightPx] = useState(null);
  const [isDraggingH, setIsDraggingH] = useState(false);
  const [isDraggingV, setIsDraggingV] = useState(false);

  // Refs
  const editorAreaRef = useRef(null);
  const ioColRef = useRef(null);
  const saveStatusTimerRef = useRef(null);
  const copySignalTimerRef = useRef(null);
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

  // ── On mount ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const savedTheme = loadPersistedTheme();
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    fetch("/api/auth/me")
      .then(async (r) => {
        if (!r.ok) throw new Error("Not OK");
        return r.json();
      })
      .then((data) => {
        if (!data.authenticated) {
          router.replace("/login");
        } else {
          setUserEmail(data.email);
          fetchFiles();
          setMounted(true);
        }
      })
      .catch(() => {
        router.replace("/login");
      });
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

  // ── Language change ───────────────────────────────────────────────────────
  const handleLanguageChange = useCallback((newLang) => {
    setLanguage(newLang);
  }, []);

  // ── Theme toggle ──────────────────────────────────────────────────────────
  const handleThemeToggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      saveTheme(next);
      return next;
    });
  }, []);

  // ── Unsaved changes prompt (Browser refresh/close) ───────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }, [router]);

  const handleLogoutClick = useCallback(() => {
    if (isDirty) {
      setLogoutConfirmVisible(true);
    } else {
      handleLogout();
    }
  }, [isDirty, handleLogout]);

  // ── Save to MongoDB (Ctrl+S) ─────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (saveStatus === "saving") return;

    if (!currentFileId) {
      setSaveStatus("saving");
      setSaveStatusVisible(true);
      try {
        const snippet = LANGUAGES[language]?.snippet ?? LANGUAGES[defaultLang].snippet;
        const res = await fetch("/api/codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: "Untitled", language, code: code || snippet, input }),
        });
        if (!res.ok) throw new Error("Save failed");
        const newFile = await res.json();
        setCurrentFileId(newFile._id);
        setCurrentFileName(newFile.question);
        setSaveStatus("saved");
        setOriginalCode(code || snippet);
        setOriginalInput(input);
        await fetchFiles();
      } catch {
        setSaveStatus("error");
      }
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
      setOriginalCode(code);
      setOriginalInput(input);
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
  }, [currentFileId, language, code, input, saveStatus, fetchFiles]);

  // ── Sidebar handlers ─────────────────────────────────────────────────────
  const handleSelectFile = useCallback(async (file) => {
    try {
      const res = await fetch(`/api/codes/${file._id}`);
      if (!res.ok) return;
      const data = await res.json();
      setCurrentFileId(data._id);
      setCurrentFileName(data.question);
      setLanguage(data.language || defaultLang);
      const fetchedCode = data.code ?? LANGUAGES[data.language || defaultLang].snippet;
      setCode(fetchedCode);
      setOriginalCode(fetchedCode);
      const fetchedInput = data.input || "";
      setInput(fetchedInput);
      setOriginalInput(fetchedInput);
    } catch {
      // silently fail — editor state unchanged
    }
  }, []);

  const handleNewFile = useCallback(async (questionName) => {
    if (isDirty) {
      await handleSave();
    }
    const snippet = LANGUAGES[language]?.snippet ?? LANGUAGES[defaultLang].snippet;
    const name = (questionName || "").trim() || "Untitled";
    try {
      const res = await fetch("/api/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: name, language, code: snippet, input: "" }),
      });
      if (!res.ok) return;
      const newFile = await res.json();
      setCurrentFileId(newFile._id);
      setCurrentFileName(newFile.question);
      setCode(snippet);
      setOriginalCode(snippet);
      setInput("");
      setOriginalInput("");
      await fetchFiles();
    } catch {
      // silently fail
    }
  }, [language, fetchFiles, isDirty, handleSave]);

  const handleRenameFile = useCallback(
    async (id, newName) => {
      if (!id) return;
      if (id === currentFileId) {
        setCurrentFileName(newName);
      }
      try {
        await fetch(`/api/codes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: newName }),
        });
        setFiles((prev) =>
          prev.map((f) =>
            f._id === id ? { ...f, question: newName } : f
          )
        );
      } catch {
        // silently fail
      }
    },
    [currentFileId]
  );

  const handleDeleteFile = useCallback(async (id) => {
    setDeleteConfirmId(id);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    if (!id) return;
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
  }, [deleteConfirmId, currentFileId]);


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
    const STEP = 50;
    const handleKeyDown = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      if (e.key === "s" && !e.altKey) {
        e.preventDefault();
        handleSave();
        return;
      }
      if (e.key === "'" && e.altKey) {
        e.preventDefault();
        handleRun();
        return;
      }
      if (e.key === "Enter" && e.altKey) {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
        return;
      }
      if (e.code === "Space" && e.altKey) {
        e.preventDefault();
        setNewFileName("");
        setNewFilePopupVisible(true);
        return;
      }

      // Ctrl+Alt+Arrow: adjust IO panel sizes
      if (e.altKey && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        if (e.key === "ArrowRight") {
          setEditorWidthPx((prev) => {
            const container = editorAreaRef.current;
            if (!container) return prev;
            const maxW = container.getBoundingClientRect().width - 20 - 10 - 180;
            const current = prev ?? container.getBoundingClientRect().width * 0.65;
            return Math.min(current + STEP, maxW);
          });
        } else if (e.key === "ArrowLeft") {
          setEditorWidthPx((prev) => {
            const container = editorAreaRef.current;
            if (!container) return prev;
            const current = prev ?? container.getBoundingClientRect().width * 0.65;
            return Math.max(current - STEP, 180);
          });
        } else if (e.key === "ArrowUp") {
          setInputHeightPx((prev) => {
            const container = ioColRef.current;
            if (!container) return prev;
            const current = prev ?? container.getBoundingClientRect().height * 0.35;
            return Math.max(current - STEP, 80);
          });
        } else if (e.key === "ArrowDown") {
          setInputHeightPx((prev) => {
            const container = ioColRef.current;
            if (!container) return prev;
            const maxH = container.getBoundingClientRect().height - 10 - 80;
            const current = prev ?? container.getBoundingClientRect().height * 0.35;
            return Math.min(current + STEP, maxH);
          });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRun, handleSave]);

  // ── Handle Copy ───────────────────────────────────────────────────────────
  const handleCopy = useCallback((isWholeCode) => {
    setCopySignal(isWholeCode ? "Whole code copied!" : "Selected text copied!");
    if (copySignalTimerRef.current) clearTimeout(copySignalTimerRef.current);
    copySignalTimerRef.current = setTimeout(() => {
      setCopySignal(null);
    }, 2500);
  }, []);

  // ── Horizontal resize (editor ↔ sidebar) ───────────────────
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
    return (
      <div className="app-loading-shell" aria-hidden="true">
        {/* Topbar skeleton */}
        <div className="app-loading-topbar">
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 100, height: 14, borderRadius: 4 }} />
          <div style={{ flex: 1 }} />
          <div className="skeleton" style={{ width: 70, height: 32, borderRadius: 8 }} />
          <div className="skeleton skeleton-circle" style={{ width: 28, height: 28 }} />
          <div className="skeleton" style={{ width: 100, height: 32, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 70, height: 32, borderRadius: 8 }} />
          <div className="skeleton skeleton-circle" style={{ width: 36, height: 36 }} />
          <div className="skeleton skeleton-circle" style={{ width: 36, height: 36 }} />
        </div>
        <div className="app-loading-body">
          {/* Sidebar skeleton */}
          <div className="app-loading-sidebar">
            <div className="skeleton" style={{ width: 90, height: 12, borderRadius: 4, marginBottom: 12 }} />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ width: '100%', height: 36, borderRadius: 8, marginBottom: 4 }} />
            ))}
          </div>
          {/* Editor skeleton */}
          <div className="app-loading-editor">
            <div className="skeleton" style={{ width: 140, height: 12, borderRadius: 4, marginBottom: 16 }} />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton skeleton-line" style={{ width: `${[72, 88, 65, 90, 55][i - 1]}%`, height: 14 }} />
            ))}
          </div>
          {/* IO skeleton */}
          <div className="app-loading-io">
            <div className="skeleton" style={{ width: 60, height: 12, borderRadius: 4, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: '100%', height: 80, borderRadius: 8 }} />
            <div style={{ height: 16 }} />
            <div className="skeleton" style={{ width: 50, height: 12, borderRadius: 4, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: '100%', height: 100, borderRadius: 8 }} />
          </div>
        </div>
      </div>
    );
  }

  const hasActiveFile = currentFileId !== null;

  return (
    <div
      className={`app-shell${isDraggingH ? " is-resizing" : ""}${
        isDraggingV ? " is-resizing-v" : ""
      }`}
    >
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
        userEmail={userEmail}
        onLogout={handleLogoutClick}
        copySignal={copySignal}
      />

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Sidebar
          isOpen={isSidebarOpen}
          files={files}
          currentFileId={currentFileId}
          onSelectFile={handleSelectFile}
          onNewFile={() => {
            setNewFileName("");
            setNewFilePopupVisible(true);
          }}
          onDeleteFile={handleDeleteFile}
          onRenameFile={handleRenameFile}
        />

        <main className="editor-area" ref={editorAreaRef} role="main">
          <div
            className="editor-col"
            style={{
              flex: editorWidthPx ? `0 0 ${editorWidthPx}px` : "0 0 65%",
              minWidth: 0,
            }}
          >
            {hasActiveFile ? (
              <EditorPanel
                language={language}
                monacoLang={LANGUAGES[language]?.monacoLang ?? "java"}
                value={code}
                onChange={(val) => setCode(val ?? "")}
                theme={theme}
                fileName={currentFileName || null}
                onRename={(newName) => handleRenameFile(currentFileId, newName)}
                onCopy={handleCopy}
              />
            ) : (
              <div className="panel editor-panel fade-in editor-empty-panel">
                <div className="editor-watermark" aria-hidden="true">
                  SUMORA
                </div>
              </div>
            )}
          </div>

          <div
            className={`resize-handle resize-handle-h${
              isDraggingH ? " dragging" : ""
            }`}
            onMouseDown={startHResize}
            title="Drag to resize editor"
            aria-hidden="true"
          />

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

      {deleteConfirmId && (
        <div
          className="confirm-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirmId(null);
          }}
        >
          <div className="confirm-dialog">
            <div style={{ marginBottom: "12px" }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--accent-red-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </div>
            </div>
            <div className="confirm-dialog-title">Delete file?</div>
            <div className="confirm-dialog-name">
              {files.find((f) => f._id === deleteConfirmId)?.question ?? "this file"}
            </div>
            <div className="confirm-dialog-subtitle">
              This action cannot be undone.
            </div>
            <div className="confirm-dialog-actions">
              <button
                className="confirm-dialog-btn confirm-dialog-btn-cancel"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                className="confirm-dialog-btn confirm-dialog-btn-danger"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {logoutConfirmVisible && (
        <div
          className="confirm-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLogoutConfirmVisible(false);
          }}
        >
          <div className="confirm-dialog">
            <div style={{ marginBottom: "12px" }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(251, 146, 60, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
            </div>
            <div className="confirm-dialog-title">Unsaved Changes</div>
            <div className="confirm-dialog-subtitle">
              You have unsaved changes. Do you want to save before logging out?
            </div>
            <div className="confirm-dialog-actions" style={{ flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                <button
                  className="confirm-dialog-btn confirm-dialog-btn-cancel"
                  style={{ flex: 1 }}
                  onClick={() => setLogoutConfirmVisible(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-dialog-btn confirm-dialog-btn-danger"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setLogoutConfirmVisible(false);
                    handleLogout();
                  }}
                >
                  Logout without saving
                </button>
              </div>
              <button
                className="confirm-dialog-btn confirm-dialog-btn-primary"
                style={{ width: "100%" }}
                onClick={async () => {
                  await handleSave();
                  setLogoutConfirmVisible(false);
                  handleLogout();
                }}
              >
                Save & Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {newFilePopupVisible && (
        <div
          className="confirm-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNewFilePopupVisible(false);
          }}
        >
          <div className="confirm-dialog">
            <div style={{ marginBottom: "12px" }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(96, 165, 250, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
            </div>
            <div className="confirm-dialog-title">New File</div>
            <div className="confirm-dialog-subtitle">
              Enter a question name for your new file.
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setNewFilePopupVisible(false);
                handleNewFile(newFileName);
              }}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <input
                autoFocus
                className="save-dialog-input"
                placeholder="e.g. Two Sum, Merge Sort..."
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setNewFilePopupVisible(false);
                }}
              />
              <div className="confirm-dialog-actions">
                <button
                  type="button"
                  className="confirm-dialog-btn confirm-dialog-btn-cancel"
                  onClick={() => setNewFilePopupVisible(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="confirm-dialog-btn confirm-dialog-btn-primary"
                >
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
