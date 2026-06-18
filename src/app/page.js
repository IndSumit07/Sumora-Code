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
      // Expired — discard
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
  } catch {
    // Storage quota exceeded or unavailable — silently fail
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // noop
  }
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EditorPage() {
  const defaultLang = "java";

  // ── State ────────────────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState(defaultLang);
  const [code, setCode] = useState(LANGUAGES[defaultLang].snippet);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const saveTimerRef = useRef(null);

  // ── On mount: restore persisted state ────────────────────────────────────
  useEffect(() => {
    // Theme (no expiry)
    const savedTheme = loadPersistedTheme();
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Code state (2-hour TTL)
    const saved = loadPersistedState();
    if (saved) {
      setLanguage(saved.language || defaultLang);
      setCode(saved.code ?? LANGUAGES[saved.language || defaultLang].snippet);
      setInput(saved.input || "");
    }

    setMounted(true);
  }, []);

  // ── Debounced persist on change ───────────────────────────────────────────
  const debounceSave = useCallback((newState) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveState(newState);
    }, DEBOUNCE_MS);
  }, []);

  // Persist whenever relevant state changes (after mount)
  useEffect(() => {
    if (!mounted) return;
    debounceSave({ language, code, input });
  }, [language, code, input, mounted, debounceSave]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // ── Language change ───────────────────────────────────────────────────────
  const handleLanguageChange = useCallback(
    (newLang) => {
      setLanguage(newLang);
      // Only reset code to snippet if the current code matches another lang's snippet
      // (i.e., user hasn't written custom code yet)
      const currentIsDefault = Object.values(LANGUAGES).some(
        (l) => l.snippet === code
      );
      if (currentIsDefault) {
        setCode(LANGUAGES[newLang].snippet);
      }
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

  // ── Keyboard shortcut: Ctrl/Cmd+Enter ────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRun]);

  // ── Apply theme on first render (before hydration, prevent flash) ─────────
  // This is handled via the data-theme attribute set above.
  // We suppress hydration mismatch by not rendering until mounted.
  if (!mounted) {
    return (
      <div
        className="app-shell"
        style={{
          background: "var(--bg-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="app-shell">
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
      <main className="editor-area" role="main">
        {/* Left: Monaco editor */}
        <div className="editor-col">
          <EditorPanel
            language={language}
            value={code}
            onChange={(val) => setCode(val ?? "")}
            theme={theme}
          />
        </div>

        {/* Right: stdin + stdout */}
        <div className="io-col">
          <IOPanel
            input={input}
            onInputChange={setInput}
            output={output}
            isError={isError}
          />
        </div>
      </main>
    </div>
  );
}
