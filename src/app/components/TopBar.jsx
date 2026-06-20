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
    <header className="topbar" role="banner">
      {/* Sidebar toggle */}
      <button
        className="sidebar-toggle-btn"
        onClick={onToggleSidebar}
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <PanelLeft size={17} />
      </button>

      {/* Brand */}
      <span className="topbar-brand">
        Sumora<span> Code</span>
      </span>

      {/* Copy signal container (zero width so it doesn't push the Save button) */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", right: "0", marginRight: "12px", whiteSpace: "nowrap", pointerEvents: "none" }}>
          {copySignal && (
            <span className="copy-signal">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {copySignal}
            </span>
          )}
        </div>
      </div>

      {/* Save button */}
      <button
        className="save-btn"
        onClick={onSave}
        aria-label="Save (Ctrl+S)"
        title="Save (Ctrl+S)"
      >
        <Save size={14} />
        Save
      </button>

      {/* Save status indicator */}
      <SaveIndicator status={saveStatus} visible={saveStatusVisible} />

      {/* Language selector */}
      <label htmlFor="language-select" className="sr-only">
        Language
      </label>
      <select
        id="language-select"
        className="lang-select"
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        aria-label="Select programming language"
      >
        <option value="java">Java</option>
        <option value="cpp">C++</option>
      </select>

      {/* Run button */}
      <button
        id="run-button"
        className="run-btn"
        onClick={onRun}
        disabled={isRunning}
        aria-label={isRunning ? "Running..." : "Run code (Ctrl+Alt+')"}
        title="Run (Ctrl+Alt+')"
      >
        {isRunning ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Running...
          </>
        ) : (
          <>
            {/* Play icon */}
            <svg
              aria-hidden="true"
              width="13"
              height="13"
              viewBox="0 0 12 12"
              fill="currentColor"
            >
              <path d="M2 1.5v9l8-4.5-8-4.5z" />
            </svg>
            Run
          </>
        )}
      </button>

      {/* User email */}
      {userEmail && (
        <span className="topbar-user" title={userEmail}>
          {userEmail.length > 24
            ? userEmail.slice(0, 22) + "..."
            : userEmail}
        </span>
      )}

      {/* Logout */}
      {onLogout && (
        <button
          className="sidebar-toggle-btn"
          onClick={onLogout}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={15} />
        </button>
      )}

      {/* Theme toggle */}
      <button
        id="theme-toggle"
        className="theme-btn"
        onClick={onThemeToggle}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      >
        {theme === "dark" ? (
          /* Sun icon */
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
          /* Moon icon */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>
    </header>
  );
}
