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
  const [newFileFolderId, setNewFileFolderId] = useState(null);

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

  const handleNewFile = useCallback(async (questionName, folderId) => {
    if (isDirty) {
      await handleSave();
    }
    const snippet = LANGUAGES[language]?.snippet ?? LANGUAGES[defaultLang].snippet;
    const name = (questionName || "").trim() || "Untitled";
    try {
      const res = await fetch("/api/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: name, language, code: snippet, input: "", folderId: folderId ?? null }),
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

  // Triggered by Sidebar's onNewFile (passes folderId)
  const handleSidebarNewFile = useCallback((folderId) => {
    setNewFileFolderId(folderId ?? null);
    setNewFileName("");
    setNewFilePopupVisible(true);
  }, []);

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
      if (e.key === "'") {
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
        setNewFileFolderId(null);
        setNewFilePopupVisible(true);
        return;
      }

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

  // ── Horizontal resize (editor ↔ io) ───────────────────────────────────────
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
      <div className="flex flex-col h-screen bg-[var(--bg-base)] overflow-hidden" aria-hidden="true">
        {/* Topbar skeleton */}
        <div className="flex items-center gap-3 h-12 px-3 border-b border-zinc-800 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 animate-pulse" />
          <div className="w-24 h-4 rounded bg-zinc-800 animate-pulse" />
          <div className="flex-1" />
          <div className="w-16 h-8 rounded-lg bg-zinc-800 animate-pulse" />
          <div className="w-24 h-8 rounded-lg bg-zinc-800 animate-pulse" />
          <div className="w-16 h-8 rounded-lg bg-zinc-800 animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
        </div>
        {/* Body skeleton */}
        <div className="flex flex-1 min-h-0">
          <div className="w-52 border-r border-zinc-800 p-3 flex-shrink-0">
            <div className="w-20 h-3 rounded bg-zinc-800 animate-pulse mb-3" />
            {[1,2,3,4].map((i) => (
              <div key={i} className="w-full h-9 rounded-lg bg-zinc-800 animate-pulse mb-2" />
            ))}
          </div>
          <div className="flex-1 p-4 flex gap-2 min-w-0">
            <div className="flex-[0_0_65%] rounded-xl bg-zinc-800/50 animate-pulse" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex-[0_0_35%] rounded-xl bg-zinc-800/50 animate-pulse" />
              <div className="flex-1 rounded-xl bg-zinc-800/50 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveFile = currentFileId !== null;

  // Shared overlay classes
  const overlayClass = "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm";
  const dialogClass = "bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-80 shadow-2xl";
  const btnBase = "flex-1 h-9 rounded-lg text-xs font-semibold transition-all";

  return (
    <div className={`flex flex-col h-screen overflow-hidden bg-[var(--bg-base)] ${isDraggingH || isDraggingV ? "select-none cursor-col-resize" : ""}`}>
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

      <Sidebar
        isOpen={isSidebarOpen}
        files={files}
        currentFileId={currentFileId}
        onSelectFile={handleSelectFile}
        onNewFile={handleSidebarNewFile}
        onDeleteFile={handleDeleteFile}
        onRenameFile={handleRenameFile}
      >
        {/* ── Main editor area (inside SidebarInset) ── */}
        <main className="flex flex-1 min-h-0 min-w-0 gap-2 p-2" ref={editorAreaRef} role="main">
          {/* Editor column */}
          <div
            className="flex min-h-0"
            style={{ flex: editorWidthPx ? `0 0 ${editorWidthPx}px` : "0 0 65%", minWidth: 0 }}
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
              <div className="flex flex-1 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)]">
                <span className="text-[clamp(3rem,8vw,7rem)] font-black text-zinc-800 tracking-tight select-none">
                  SUMORA
                </span>
              </div>
            )}
          </div>

          {/* Horizontal resize handle */}
          <div
            className={`w-1.5 cursor-col-resize flex items-center justify-center group flex-shrink-0 ${isDraggingH ? "opacity-100" : ""}`}
            onMouseDown={startHResize}
            title="Drag to resize editor"
            aria-hidden="true"
          >
            <div className="w-0.5 h-12 rounded-full bg-zinc-700 group-hover:bg-zinc-500 transition-colors" />
          </div>

          {/* IO column */}
          <div className="flex flex-1 min-w-0 min-h-0">
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
      </Sidebar>


      {/* ── Delete confirm dialog ── */}
      {deleteConfirmId && (
        <div className={overlayClass} onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirmId(null); }}>
          <div className={dialogClass}>
            <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </div>
            <h3 className="text-sm font-bold text-zinc-100 text-center mb-1">Delete file?</h3>
            <p className="text-xs text-zinc-400 text-center font-mono mb-1">
              {files.find((f) => f._id === deleteConfirmId)?.question ?? "this file"}
            </p>
            <p className="text-xs text-zinc-600 text-center mb-5">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button className={`${btnBase} text-zinc-400 bg-zinc-800 hover:bg-zinc-700`} onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </button>
              <button className={`${btnBase} text-red-300 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30`} onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Logout confirm dialog ── */}
      {logoutConfirmVisible && (
        <div className={overlayClass} onClick={(e) => { if (e.target === e.currentTarget) setLogoutConfirmVisible(false); }}>
          <div className={dialogClass}>
            <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <h3 className="text-sm font-bold text-zinc-100 text-center mb-2">Unsaved Changes</h3>
            <p className="text-xs text-zinc-500 text-center mb-5">Do you want to save before logging out?</p>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button className={`${btnBase} text-zinc-400 bg-zinc-800 hover:bg-zinc-700`} onClick={() => setLogoutConfirmVisible(false)}>
                  Cancel
                </button>
                <button className={`${btnBase} text-orange-300 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30`} onClick={() => { setLogoutConfirmVisible(false); handleLogout(); }}>
                  Logout anyway
                </button>
              </div>
              <button
                className="w-full h-9 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 transition-all"
                onClick={async () => { await handleSave(); setLogoutConfirmVisible(false); handleLogout(); }}
              >
                Save &amp; Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New file dialog ── */}
      {newFilePopupVisible && (
        <div className={overlayClass} onClick={(e) => { if (e.target === e.currentTarget) setNewFilePopupVisible(false); }}>
          <div className={dialogClass}>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <h3 className="text-sm font-bold text-zinc-100 text-center mb-1">New File</h3>
            <p className="text-xs text-zinc-500 text-center mb-5">Enter a name for your new file.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setNewFilePopupVisible(false);
                handleNewFile(newFileName, newFileFolderId);
              }}
              className="flex flex-col gap-3"
            >
              <input
                autoFocus
                placeholder="e.g. Two Sum, Merge Sort…"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") setNewFilePopupVisible(false); }}
                className="w-full h-10 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm font-mono outline-none focus:border-zinc-500 placeholder:text-zinc-600"
              />
              <div className="flex gap-2">
                <button type="button" className={`${btnBase} text-zinc-400 bg-zinc-800 hover:bg-zinc-700`} onClick={() => setNewFilePopupVisible(false)}>
                  Cancel
                </button>
                <button type="submit" className={`${btnBase} text-zinc-100 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30`}>
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
