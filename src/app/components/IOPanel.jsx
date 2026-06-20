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
      style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}
    >
      {/* stdin */}
      <div
        className="panel input-panel fade-in"
        style={{
          flex: inputHeightPx ? `0 0 ${inputHeightPx}px` : "0 0 35%",
          minHeight: 0,
        }}
      >
        <div className="panel-label">
          <span className="panel-label-dot" style={{ background: "var(--accent-blue)" }} />
          stdin · input
        </div>
        <textarea
          id="stdin-input"
          className="io-textarea"
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
        className="resize-handle resize-handle-v"
        onMouseDown={onVResizeStart}
        title="Drag to resize"
        aria-hidden="true"
      />

      {/* stdout / stderr */}
      <div className="panel output-panel fade-in" style={{ flex: 1, minHeight: 0 }}>
        <div className="panel-label" style={{ justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="panel-label-dot" style={{
              background: hasOutput ? (isError ? "var(--accent-red)" : "var(--accent-green)") : "var(--text-muted)",
            }} />
            output
          </span>
          {hasOutput && (
            <button
              onClick={handleCopyOutput}
              style={{
                background: "none",
                border: "none",
                color: copied ? "var(--accent-green)" : "var(--text-muted)",
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: 11,
                fontFamily: "inherit",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "color 150ms ease",
              }}
              title="Copy output"
              aria-label="Copy output to clipboard"
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
          className={`output-content ${
            !hasOutput
              ? "output-placeholder"
              : isError
              ? "output-error"
              : "output-success"
          }`}
          role="region"
          aria-label="Program output"
          aria-live="polite"
        >
          {!hasOutput ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 8,
              opacity: 0.5,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span>Run your code to see output here</span>
            </div>
          ) : output}
        </div>
      </div>
    </div>
  );
}
