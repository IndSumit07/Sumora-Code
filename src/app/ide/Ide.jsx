"use client";

import { useCallback, useRef, useState } from "react";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Explorer from "./components/Explorer";
import Editor from "./components/Editor";
import { fileById, INITIAL_EXPANDED, PROJECT_NAME } from "./lib/vscode-data";

const MIN_WIDTH = 200;
const MAX_WIDTH = 500;
const DEFAULT_WIDTH = 290;

export default function Ide() {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    if (window.innerWidth < 1024 && window.innerWidth >= 768) return 240;
    return DEFAULT_WIDTH;
  });
  const [expanded, setExpanded] = useState(() => new Set(INITIAL_EXPANDED));
  const [openTabs, setOpenTabs] = useState(() => {
    const initial = fileById("scripts/seed-user.mjs");
    return initial ? [initial] : [];
  });
  const [activeFileId, setActiveFileId] = useState("scripts/seed-user.mjs");
  const [mobileOpen, setMobileOpen] = useState(false);

  const containerRef = useRef(null);

  // ── Sidebar resize ────────────────────────────────────────────────────────
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const onMove = (ev) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const next = Math.min(Math.max(ev.clientX - rect.left, MIN_WIDTH), MAX_WIDTH);
      setSidebarWidth(next);
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  // ── Tree ──────────────────────────────────────────────────────────────────
  const toggleFolder = useCallback((id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const selectFile = useCallback((file) => {
    setOpenTabs((prev) => (prev.some((t) => t.id === file.id) ? prev : [...prev, file]));
    setActiveFileId(file.id);
    setMobileOpen(false);
  }, []);

  const selectTab = useCallback((id) => {
    setActiveFileId(id);
  }, []);

  const closeTab = useCallback((id) => {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      setActiveFileId((active) => {
        if (active !== id) return active;
        if (next.length === 0) return null;
        const activeIdx = prev.findIndex((t) => t.id === id);
        return next[Math.min(activeIdx, next.length - 1)].id;
      });
      return next;
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex h-screen w-screen overflow-hidden bg-[#1e1e1e] text-[#cccccc]"
      style={{ fontFamily: "var(--font-ui), system-ui, -apple-system, sans-serif" }}
    >
      {/* ── Mobile drawer ──────────────────────────────────────────────────── */}
      <button
        onClick={() => setMobileOpen((p) => !p)}
        aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
        className="fixed top-2 left-2 z-[60] flex items-center justify-center w-8 h-8 bg-[#2d2d2d] border border-[#454545] text-[#cccccc] hover:text-white rounded-[4px] md:hidden transition-colors"
      >
        <PanelLeft size={16} />
      </button>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[290px] transition-transform duration-200 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Explorer
          expanded={expanded}
          activeFileId={activeFileId}
          onToggle={toggleFolder}
          onSelect={selectFile}
          onNewFile={() => {}}
          onNewFolder={() => {}}
          onRefresh={() => {}}
          onCollapseAll={collapseAll}
        />
      </div>

      {/* ── Desktop sidebar ────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col flex-shrink-0 h-full" style={{ width: sidebarWidth }}>
        <Explorer
          expanded={expanded}
          activeFileId={activeFileId}
          onToggle={toggleFolder}
          onSelect={selectFile}
          onNewFile={() => {}}
          onNewFolder={() => {}}
          onRefresh={() => {}}
          onCollapseAll={collapseAll}
        />
      </div>

      {/* ── Resize handle ──────────────────────────────────────────────────── */}
      <div
        onPointerDown={handleResizeStart}
        title="Drag to resize sidebar"
        className="hidden md:block flex-shrink-0 w-[5px] cursor-col-resize bg-transparent hover:bg-[#0078d4] active:bg-[#0078d4] transition-colors"
        aria-hidden="true"
      />

      {/* ── Editor ─────────────────────────────────────────────────────────── */}
      <Editor openTabs={openTabs} activeFileId={activeFileId} onSelectTab={selectTab} onCloseTab={closeTab} />

      <span className="sr-only">{PROJECT_NAME}</span>
    </div>
  );
}
