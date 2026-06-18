"use client";

import { useEffect, useRef } from "react";

/**
 * IOPanel — Input (stdin) + Output panels stacked in the right column.
 */
export default function IOPanel({ input, onInputChange, output, isError }) {
  const outputRef = useRef(null);

  // Auto-scroll output to bottom whenever it updates
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const hasOutput = output !== null && output !== undefined && output !== "";

  return (
    <>
      {/* ── stdin ── */}
      <div className="panel input-panel fade-in">
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

      {/* ── stdout / stderr ── */}
      <div className="panel output-panel fade-in">
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
    </>
  );
}
