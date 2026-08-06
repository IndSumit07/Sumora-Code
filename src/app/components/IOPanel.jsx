"use client";

import { useEffect, useRef, useState } from "react";

/**
 * IOPanel — Input (stdin) + resizable divider + Output panels.
 * The vertical resize is controlled by the parent (page.js).
 */
export default function IOPanel({
  input,
  onInputChange,
  output,
  isError,
  inputHeightPx,
  onVResizeStart,
  containerRef,
}) {
  const outputRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  // Auto-scroll output to bottom whenever it updates
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const hasOutput = output !== null && output !== undefined && output !== "";

  const handleCopyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently fail
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full min-h-0"
    >
      {/* stdin */}
      <div
        className="flex flex-col min-h-0 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] overflow-hidden shadow-[var(--shadow-panel)]"
        style={{ flex: inputHeightPx ? `0 0 ${inputHeightPx}px` : "0 0 35%", minHeight: 0 }}
      >
        <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-[var(--border-subtle)] flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-muted)]">
            stdin · input
          </span>
        </div>
        <textarea
          id="stdin-input"
          className="flex-1 w-full resize-none bg-transparent text-[var(--text-primary)] text-[13px] font-mono leading-6 px-3.5 py-3 outline-none placeholder:text-[var(--text-muted)] min-h-0"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Provide program input here..."
          spellCheck={false}
          autoComplete="off"
          aria-label="Program standard input"
        />
      </div>

      {/* Vertical resize handle */}
      <div
        className="h-2 cursor-row-resize flex items-center justify-center group flex-shrink-0"
        onMouseDown={onVResizeStart}
        title="Drag to resize"
        aria-hidden="true"
      >
        <div className="w-8 h-0.5 rounded-full bg-[var(--border-subtle)] group-hover:bg-[var(--text-muted)] transition-colors" />
      </div>

      {/* stdout / stderr */}
      <div className="flex flex-col min-h-0 flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] overflow-hidden shadow-[var(--shadow-panel)]">
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-[var(--border-subtle)] flex-shrink-0">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0 transition-colors"
              style={{
                background: hasOutput
                  ? isError ? "var(--accent-red)" : "var(--accent-green)"
                  : "var(--text-muted)",
              }}
            />
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-muted)]">output</span>
          </span>
          {hasOutput && (
            <button
              onClick={handleCopyOutput}
              title="Copy output"
              aria-label="Copy output to clipboard"
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                copied
                  ? "text-emerald-400"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {copied ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copy
                </>
              )}
            </button>
          )}
        </div>

        <div
          id="output-area"
          ref={outputRef}
          className={`flex-1 overflow-auto text-[13px] font-mono leading-6 px-3.5 py-3 whitespace-pre-wrap break-words min-h-0 ${
            !hasOutput
              ? "flex flex-col items-center justify-center text-[var(--text-muted)] opacity-50"
              : isError
              ? "text-red-400"
              : "text-emerald-400"
          }`}
          role="region"
          aria-label="Program output"
          aria-live="polite"
        >
          {!hasOutput ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 opacity-70">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span className="text-xs">Run your code to see output here</span>
            </div>
          ) : output}
        </div>
      </div>
    </div>
  );
}
