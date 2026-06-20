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

  const handleNewFile = useCallback(async () => {
    if (isDirty) {
      await handleSave();
    }
    const snippet = LANGUAGES[language]?.snippet ?? LANGUAGES[defaultLang].snippet;
    try {
      const res = await fetch("/api/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Untitled", language, code: snippet, input: "" }),
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
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
      if (e.ctrlKey && e.key === "'") {
        e.preventDefault();
        handleRun();
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
    return <div className="app-shell" aria-hidden="true" />;
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
          onNewFile={handleNewFile}
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
                className="confirm-dialog-btn"
                style={{ background: "var(--accent-primary)", color: "white", width: "100%" }}
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
    </div>
  );
}
