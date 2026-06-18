"use client";

import { useEffect, useRef } from "react";

/**
 * IOPanel — Input (stdin) + resizable divider + Output panels.
 * The vertical resize is controlled by the parent (page.js).
 */
export default function IOPanel({
  input,
  onInputChange,
  output,
  isError,
  inputHeightPct,
  onVResizeStart,
  containerRef,
}) {
  const outputRef = useRef(null);

  // Auto-scroll output to bottom whenever it updates
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const hasOutput = output !== null && output !== undefined && output !== "";

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}
    >
      {/* ── stdin ── */}
      <div
        className="panel input-panel fade-in"
        style={{ flex: `0 0 ${inputHeightPct}%`, minHeight: 0 }}
      >
        <div className="panel-label">stdin · input</div>
        <textarea
          id="stdin-input"
          className="io-textarea"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Provide program input here…"
          spellCheck={false}
          autoComplete="off"
          aria-label="Program standard input"
        />
      </div>

      {/* ── Vertical resize handle ── */}
      <div
        className="resize-handle resize-handle-v"
        onMouseDown={onVResizeStart}
        title="Drag to resize"
        aria-hidden="true"
      />

      {/* ── stdout / stderr ── */}
      <div className="panel output-panel fade-in" style={{ flex: 1, minHeight: 0 }}>
        <div className="panel-label">output</div>
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
          {!hasOutput ? "Run your code to see output here…" : output}
        </div>
      </div>
    </div>
  );
}
