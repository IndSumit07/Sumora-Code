"use client";

import { PanelLeft, Save, LogOut } from "lucide-react";
import SaveIndicator from "./SaveIndicator";

/**
 * TopBar — sidebar toggle, save button, language dropdown, run button, theme toggle, save status.
 */
export default function TopBar({
  language,
  onLanguageChange,
  onRun,
  isRunning,
  theme,
  onThemeToggle,
  onToggleSidebar,
  isSidebarOpen,
  saveStatus,
  saveStatusVisible,
  onSave,
  userEmail,
  onLogout,
  copySignal,
}) {
  return (
    <header
      role="banner"
      className="flex items-center gap-2 h-12 px-3 border-b border-zinc-800 bg-[var(--bg-topbar)] flex-shrink-0 z-10"
    >
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
      >
        <PanelLeft size={17} />
      </button>

      {/* Brand */}
      <span className="text-sm font-bold tracking-tight text-zinc-100 select-none">
        Sumora<span className="text-zinc-500">Code</span>
      </span>

      {/* Copy signal */}
      <div className="relative flex items-center">
        {copySignal && (
          <span className="absolute left-2 whitespace-nowrap pointer-events-none flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md animate-in fade-in duration-150">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {copySignal}
          </span>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Save button */}
      <button
        onClick={onSave}
        aria-label="Save (Ctrl+S)"
        title="Save (Ctrl+S)"
        className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 transition-all"
      >
        <Save size={13} />
        Save
      </button>

      {/* Save indicator */}
      <SaveIndicator status={saveStatus} visible={saveStatusVisible} />

      {/* Language selector */}
      <label htmlFor="language-select" className="sr-only">Language</label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        aria-label="Select programming language"
        className="h-8 px-2.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 cursor-pointer transition-colors appearance-none"
      >
        <option value="java">Java</option>
        <option value="cpp">C++</option>
      </select>

      {/* Run button */}
      <button
        id="run-button"
        onClick={onRun}
        disabled={isRunning}
        aria-label={isRunning ? "Running..." : "Run code (Ctrl+')"}
        title="Run (Ctrl+')"
        className="flex items-center gap-1.5 px-3.5 h-8 rounded-lg text-xs font-bold bg-[var(--btn-run-bg)] text-[var(--btn-run-text)] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        {isRunning ? (
          <>
            <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            Running…
          </>
        ) : (
          <>
            <svg aria-hidden="true" width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 1.5v9l8-4.5-8-4.5z" />
            </svg>
            Run
          </>
        )}
      </button>

      {/* User email */}
      {userEmail && (
        <span
          title={userEmail}
          className="hidden sm:block text-xs text-zinc-500 max-w-[140px] truncate"
        >
          {userEmail}
        </span>
      )}

      {/* Logout */}
      {onLogout && (
        <button
          onClick={onLogout}
          aria-label="Sign out"
          title="Sign out"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={15} />
        </button>
      )}

      {/* Theme toggle */}
      <button
        id="theme-toggle"
        onClick={onThemeToggle}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
      >
        {theme === "dark" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>
    </header>
  );
}
