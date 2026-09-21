"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  ChevronRight,
  File,
  FilePlus2,
  Folder,
  FolderOpen,
  FolderPlus,
  Home,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ── Folder neutral style ───────────────────────────────────────────────────
const FOLDER_STYLE = {
  accent: "var(--sb-text-muted)",
  bg: "rgba(255,255,255,0.04)",
  border: "var(--sb-border)",
  hoverBg: "rgba(255,255,255,0.07)",
  hoverBorder: "rgba(255,255,255,0.14)",
};

// ── Language badge ─────────────────────────────────────────────────────────
const LANG_MAP = {
  python: { label: "Py",  color: "#4ec9b0", bg: "rgba(61,143,205,0.15)"  },
  c:      { label: "C",   color: "#569cd6", bg: "rgba(86,156,214,0.15)"  },
  cpp:    { label: "C++", color: "#b09fda", bg: "rgba(157,127,205,0.15)" },
  java:   { label: "JV",  color: "#e0a060", bg: "rgba(240,160,75,0.15)"  },
};

function LangBadge({ language }) {
  const m = LANG_MAP[language];
  if (!m) return <File size={13} style={{ color: "var(--sb-text-muted)", flexShrink: 0 }} />;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 22, height: 15, borderRadius: 3,
      background: m.bg, color: m.color,
      fontSize: 9, fontWeight: 700, fontFamily: "monospace",
      flexShrink: 0, letterSpacing: -0.5,
    }}>
      {m.label}
    </span>
  );
}

// ── Inline rename input ────────────────────────────────────────────────────
function InlineRename({ value, onCommit, onCancel }) {
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);

  const commit = () => {
    const t = draft.trim();
    if (t && t !== value) onCommit(t);
    else onCancel();
  };

  return (
    <form
      className="flex flex-1 min-w-0"
      onSubmit={(e) => { e.preventDefault(); commit(); }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); onCancel(); } }}
        style={{
          flex: 1, minWidth: 0, height: 22, padding: "0 6px", borderRadius: 3,
          background: "var(--sb-input)", border: "1px solid var(--sb-accent)",
          color: "var(--sb-text)", fontSize: 12, outline: "none",
          boxShadow: "0 0 0 1px var(--sb-accent)",
        }}
      />
    </form>
  );
}

// ── Inline create input ────────────────────────────────────────────────────
function InlineCreate({ type, onCommit, onCancel }) {
  const [draft, setDraft] = useState("");
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const commit = () => {
    const t = draft.trim();
    if (t) onCommit(t);
    else onCancel();
  };

  const Icon = type === "folder" ? Folder : File;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "6px 10px", margin: "3px 6px", borderRadius: 8,
      background: "var(--sb-item-hover)", border: "1px solid var(--sb-accent)",
    }}>
      <Icon size={13} style={{ color: type === "folder" ? "var(--sb-folder)" : "var(--sb-text-muted)", flexShrink: 0 }} />
      <form className="flex flex-1 min-w-0" onSubmit={(e) => { e.preventDefault(); commit(); }}>
        <input
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); onCancel(); } }}
          placeholder={type === "folder" ? "Folder name…" : "File name…"}
          style={{
            flex: 1, minWidth: 0, height: 20, padding: "0 4px", borderRadius: 2,
            background: "transparent", border: "none",
            color: "var(--sb-text)", fontSize: 12, outline: "none",
          }}
        />
      </form>
    </div>
  );
}

// ── Breadcrumb bar ─────────────────────────────────────────────────────────
function BreadcrumbBar({ navStack, onNavigate }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 1,
        padding: "0 8px", height: 30, flexShrink: 0,
        borderBottom: "1px solid var(--sb-border)",
        background: "var(--sb-panel)",
        overflowX: "auto", overflowY: "hidden",
      }}
      className="scrollbar-hide"
    >
      {navStack.map((seg, i) => {
        const isLast = i === navStack.length - 1;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
            <button
              onClick={() => !isLast && onNavigate(i)}
              disabled={isLast}
              title={seg.name}
              style={{
                display: "flex", alignItems: "center", gap: 3,
                padding: "2px 5px", borderRadius: 4, border: "none",
                color: isLast ? "var(--sb-text)" : "var(--sb-text-muted)",
                fontSize: 11, fontWeight: isLast ? 600 : 400,
                background: isLast ? "var(--sb-item-hover)" : "transparent",
                cursor: isLast ? "default" : "pointer",
                maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => { if (!isLast) { e.currentTarget.style.background = "var(--sb-item-hover)"; e.currentTarget.style.color = "var(--sb-text)"; } }}
              onMouseLeave={(e) => { if (!isLast) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sb-text-muted)"; } }}
            >
              {i === 0 && <Home size={9} style={{ flexShrink: 0 }} />}
              {seg.name}
            </button>
            {!isLast && <ChevronRight size={10} style={{ color: "var(--sb-text-muted)", flexShrink: 0 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Panel header ───────────────────────────────────────────────────────────
function PanelHeader({ title, actions }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 36, padding: "0 4px 0 10px", flexShrink: 0,
      borderBottom: "1px solid var(--sb-border)",
      background: "var(--sb-panel)",
    }}>
      <span style={{
        fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
        textTransform: "uppercase", userSelect: "none",
        color: "var(--sb-text-muted)",
      }}>
        {title}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 1 }}>{actions}</div>
    </div>
  );
}

function IconBtn({ title, onClick, children }) {
  return (
    <button
      title={title} aria-label={title} onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 26, height: 26, borderRadius: 5, border: "none",
        color: "var(--sb-text-muted)", background: "transparent", cursor: "pointer",
        transition: "all 0.12s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--sb-text)"; e.currentTarget.style.background = "var(--sb-item-hover)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--sb-text-muted)"; e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

// ── Delete confirm dialog ──────────────────────────────────────────────────
function DeleteConfirm({ name, type, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: "var(--sb-panel)", border: "1px solid var(--sb-border)",
        borderRadius: 16, padding: 24, width: 300,
        boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "rgba(239,68,68,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 14px",
        }}>
          <Trash2 size={18} style={{ color: "#ef4444" }} />
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", textAlign: "center", marginBottom: 4 }}>
          Delete {type}?
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center", fontFamily: "monospace", marginBottom: 4, wordBreak: "break-all" }}>
          {name}
        </p>
        <p style={{ fontSize: 11, color: "var(--sb-text-muted)", textAlign: "center", marginBottom: 20 }}>
          This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", background: "var(--tb-btn-bg)", border: "none", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#fca5a5", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Folder card ────────────────────────────────────────────────────────────
// Uses a plain div (not role=button) as the outer wrapper to avoid nested <button> violations.
// The DropdownMenuTrigger buttons live inside a stopPropagation container.
function FolderCard({ folder, onNavigate, onRename, onDelete, onNewFileInFolder, onNewSubFolder }) {
  const [hovered, setHovered] = useState(false);
  const [renaming, setRenaming] = useState(false);

  if (renaming) {
    return (
      <div style={{ padding: "3px 6px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 10px", borderRadius: 8,
          background: "var(--sb-item-hover)", border: "1px solid var(--sb-accent)",
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: FOLDER_STYLE.bg, border: `1px solid ${FOLDER_STYLE.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Folder size={17} style={{ color: FOLDER_STYLE.accent }} />
          </div>
          <InlineRename
            value={folder.name}
            onCommit={(name) => { onRename(folder._id, name); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ padding: "3px 6px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card — plain div, keyboard/click handled directly */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 10px", borderRadius: 10,
          background: hovered ? FOLDER_STYLE.hoverBg : "rgba(255,255,255,0.03)",
          border: `1px solid ${hovered ? FOLDER_STYLE.hoverBorder : "var(--sb-border)"}`,
          transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
          cursor: "pointer",
          outline: "none",
        }}
        onClick={() => onNavigate(folder)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate(folder); } }}
        tabIndex={0}
        aria-label={`Open folder ${folder.name}`}
      >
        {/* Icon */}
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: FOLDER_STYLE.bg, border: `1px solid ${FOLDER_STYLE.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.18s",
          pointerEvents: "none",
        }}>
          {hovered
            ? <FolderOpen size={17} style={{ color: "var(--sb-text)" }} />
            : <Folder     size={17} style={{ color: FOLDER_STYLE.accent }} />
          }
        </div>

        {/* Name + file count */}
        <div style={{ flex: 1, minWidth: 0, pointerEvents: "none" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sb-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {folder.name}
          </div>

        </div>

        {/* Hover action area — stopPropagation so clicks don't trigger navigate */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 2, opacity: hovered ? 1 : 0, transition: "opacity 0.15s", flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 22, height: 22, borderRadius: 5, border: "none",
                background: "transparent", cursor: "pointer", color: "var(--sb-text-muted)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "var(--sb-text)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sb-text-muted)"; }}
            >
              <MoreHorizontal size={13} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44" style={{ background: "#252526", border: "1px solid #454545", color: "#cccccc", borderRadius: 6, padding: "4px 0" }}>
              <DropdownMenuItem className="gap-2 cursor-pointer focus:outline-none" style={{ fontSize: 12, padding: "5px 12px" }} onClick={() => onNewFileInFolder(folder)}>
                <FilePlus2 size={12} /> New File Here
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer focus:outline-none" style={{ fontSize: 12, padding: "5px 12px" }} onClick={() => onNewSubFolder(folder)}>
                <FolderPlus size={12} /> New Sub-folder
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ background: "#454545", margin: "2px 0" }} />
              <DropdownMenuItem className="gap-2 cursor-pointer focus:outline-none" style={{ fontSize: 12, padding: "5px 12px" }} onClick={() => setRenaming(true)}>
                <Pencil size={12} /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer focus:outline-none" style={{ fontSize: 12, padding: "5px 12px", color: "#f48771" }} onClick={() => onDelete(folder._id, folder.name)}>
                <Trash2 size={12} /> Delete Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Chevron */}
        <ChevronRight
          size={13}
          style={{
            color: "var(--sb-text-muted)",
            flexShrink: 0,
            transition: "transform 0.15s",
            transform: hovered ? "translateX(1px)" : "none",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

// ── File row ───────────────────────────────────────────────────────────────
function FileRow({ file, isActive, onSelect, onRename, onDelete }) {
  const [renaming, setRenaming] = useState(false);
  const [hovered, setHovered] = useState(false);

  if (renaming) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "4px 8px 4px 10px", margin: "1px 6px", borderRadius: 7,
        background: "var(--sb-item-hover)", border: "1px solid var(--sb-accent)",
      }}>
        <LangBadge language={file.language} />
        <InlineRename
          value={file.question}
          onCommit={(name) => { onRename(file._id, name); setRenaming(false); }}
          onCancel={() => setRenaming(false)}
        />
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(file)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(file); } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 8px 5px 10px", margin: "1px 6px", borderRadius: 7,
        background: isActive ? "var(--sb-item-active)" : hovered ? "var(--sb-item-hover)" : "transparent",
        border: `1px solid ${isActive ? "var(--sb-accent)" : "transparent"}`,
        color: isActive ? "var(--sb-text-active)" : "var(--sb-text)",
        cursor: "pointer", transition: "background 0.12s, border-color 0.12s",
        outline: "none",
      }}
    >
      <LangBadge language={file.language} />
      <span style={{ flex: 1, fontSize: 13, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {file.question}
      </span>
      {/* Actions — stopPropagation to prevent triggering onSelect */}
      <div
        style={{ opacity: hovered || isActive ? 1 : 0, transition: "opacity 0.12s", display: "flex" }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 20, height: 20, borderRadius: 4, border: "none",
              background: "transparent", cursor: "pointer", color: "var(--sb-text-muted)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "var(--sb-text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sb-text-muted)"; }}
          >
            <MoreHorizontal size={12} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40" style={{ background: "#252526", border: "1px solid #454545", color: "#cccccc", borderRadius: 6, padding: "4px 0" }}>
            <DropdownMenuItem className="gap-2 cursor-pointer focus:outline-none" style={{ fontSize: 12, padding: "5px 12px" }} onClick={() => setRenaming(true)}>
              <Pencil size={12} /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer focus:outline-none" style={{ fontSize: 12, padding: "5px 12px", color: "#f48771" }} onClick={() => onDelete(file._id, file.question)}>
              <Trash2 size={12} /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────
function LoadingView() {
  return (
    <div style={{ padding: "8px 6px", display: "flex", flexDirection: "column", gap: 4 }}>
      {[70, 55, 80].map((w, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 10px", borderRadius: 10,
          background: "rgba(255,255,255,0.03)", border: "1px solid var(--sb-border)",
          opacity: 0.7 - i * 0.15,
        }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--tb-skeleton)" }} className="animate-pulse" />
          <div style={{ flex: 1 }}>
            <div style={{ height: 10, borderRadius: 4, background: "var(--tb-skeleton)", width: `${w}%` }} className="animate-pulse" />
            <div style={{ height: 8, borderRadius: 3, background: "var(--tb-skeleton)", width: "35%", marginTop: 5 }} className="animate-pulse" />
          </div>
          <div style={{ width: 13, height: 13, borderRadius: 3, background: "var(--tb-skeleton)" }} className="animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ── Section divider label ──────────────────────────────────────────────────
function SectionLabel({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px 3px" }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--sb-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--sb-border)", opacity: 0.6 }} />
    </div>
  );
}

// ── Main SidebarWrapper ────────────────────────────────────────────────────
export default function SidebarWrapper({
  isOpen,
  currentFileId,
  onSelectFile,
  onNewFile,       // async (name, folderId) — page.js creates the file + opens it in editor
  onFileDeleted,   // (id) — page.js clears editor if the deleted file was open
  onFileRenamed,   // (id, newName) — page.js updates editor title bar
  onToggleSidebar,
  userEmail,
  onLogout,
  refreshTrigger,  // number bumped by page.js to trigger a sidebar refresh
  children,
}) {
  // navStack: [{ id: null|string, name: string }, ...]
  const [navStack, setNavStack] = useState([{ id: null, name: "Explorer" }]);

  // viewCache: { "root"|folderId: { folders, files, loading, loaded } }
  const [viewCache, setViewCache] = useState({});

  const [creatingItem, setCreatingItem] = useState(null); // { type, parentId }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name, type }

  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const MIN_SIDEBAR = 160, MAX_SIDEBAR = 450;

  // ── Derived ──────────────────────────────────────────────────────────────
  const currentView = navStack[navStack.length - 1];
  const viewKey = currentView.id ?? "root";
  const currentData = viewCache[viewKey] ?? { folders: [], files: [], loading: false, loaded: false };
  const isRoot = navStack.length === 1;
  const isEmpty =
    !currentData.loading && currentData.loaded &&
    currentData.folders.length === 0 && currentData.files.length === 0 &&
    !creatingItem;

  // ── Fetch a view ─────────────────────────────────────────────────────────
  const fetchView = useCallback(async (key) => {
    setViewCache((prev) => ({ ...prev, [key]: { ...(prev[key] ?? {}), loading: true } }));
    try {
      const param = key === "root" ? "root" : key;
      const [foldersRes, filesRes] = await Promise.all([
        fetch(`/api/folders?parentId=${param}&withCount=1`),
        fetch(`/api/codes?folderId=${param}`),
      ]);
      const [folders, files] = await Promise.all([
        foldersRes.ok ? foldersRes.json() : [],
        filesRes.ok  ? filesRes.json()  : [],
      ]);
      setViewCache((prev) => ({ ...prev, [key]: { folders, files, loading: false, loaded: true } }));
    } catch {
      setViewCache((prev) => ({ ...prev, [key]: { ...(prev[key] ?? {}), loading: false, loaded: true } }));
    }
  }, []);

  // ── On mount: load root ───────────────────────────────────────────────────
  useEffect(() => { fetchView("root"); }, [fetchView]);

  // ── page.js refresh signal ────────────────────────────────────────────────
  useEffect(() => {
    if (refreshTrigger > 0) fetchView(viewKey);
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigate into a folder ────────────────────────────────────────────────
  const navigateInto = useCallback((folder, afterNav) => {
    setNavStack((prev) => [...prev, { id: folder._id, name: folder.name }]);
    setCreatingItem(afterNav ?? null);
    fetchView(folder._id);
  }, [fetchView]);

  // ── Navigate to breadcrumb level ──────────────────────────────────────────
  const navigateTo = useCallback((index) => {
    setNavStack((prev) => prev.slice(0, index + 1));
    setCreatingItem(null);
  }, []);

  const refreshCurrentView = useCallback(() => { fetchView(viewKey); }, [fetchView, viewKey]);

  // ── Folder CRUD ───────────────────────────────────────────────────────────
  const handleCreateFolder = useCallback(async (name) => {
    setCreatingItem(null);
    const parentId = currentView.id ?? null;
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId }),
      });
      if (!res.ok) return;
      const folder = await res.json();
      setViewCache((prev) => {
        const curr = prev[viewKey] ?? { folders: [], files: [], loading: false, loaded: true };
        return { ...prev, [viewKey]: { ...curr, folders: [...curr.folders, { ...folder, fileCount: 0 }] } };
      });
    } catch {}
  }, [currentView.id, viewKey]);

  const handleRenameFolder = useCallback(async (id, name) => {
    try {
      await fetch(`/api/folders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setViewCache((prev) => {
        const curr = prev[viewKey];
        if (!curr) return prev;
        return { ...prev, [viewKey]: { ...curr, folders: curr.folders.map((f) => (f._id === id ? { ...f, name } : f)) } };
      });
      setNavStack((prev) => prev.map((seg) => (seg.id === id ? { ...seg, name } : seg)));
    } catch {}
  }, [viewKey]);

  const handleDeleteFolderRequest = useCallback((id, name) => {
    setDeleteConfirm({ id, name, type: "folder" });
  }, []);

  const confirmDeleteFolder = useCallback(async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm(null);
    try {
      await fetch(`/api/folders/${id}`, { method: "DELETE" });
      setViewCache((prev) => {
        const curr = prev[viewKey];
        if (!curr) return prev;
        return { ...prev, [viewKey]: { ...curr, folders: curr.folders.filter((f) => f._id !== id) } };
      });
      setNavStack((prev) => {
        const idx = prev.findIndex((seg) => seg.id === id);
        return idx > 0 ? prev.slice(0, idx) : prev;
      });
    } catch {}
  }, [deleteConfirm, viewKey]);

  // ── File CRUD ─────────────────────────────────────────────────────────────
  const handleCommitNewFile = useCallback(async (name) => {
    setCreatingItem(null);
    const folderId = currentView.id ?? null;
    await onNewFile(name, folderId);
    fetchView(viewKey);
  }, [currentView.id, onNewFile, fetchView, viewKey]);

  const handleRenameFile = useCallback(async (id, name) => {
    try {
      await fetch(`/api/codes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: name }),
      });
      setViewCache((prev) => {
        const curr = prev[viewKey];
        if (!curr) return prev;
        return { ...prev, [viewKey]: { ...curr, files: curr.files.map((f) => (f._id === id ? { ...f, question: name } : f)) } };
      });
      onFileRenamed?.(id, name);
    } catch {}
  }, [viewKey, onFileRenamed]);

  const handleDeleteFileRequest = useCallback((id, name) => {
    setDeleteConfirm({ id, name, type: "file" });
  }, []);

  const confirmDeleteFile = useCallback(async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm(null);
    try {
      const res = await fetch(`/api/codes/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setViewCache((prev) => {
        const curr = prev[viewKey];
        if (!curr) return prev;
        return { ...prev, [viewKey]: { ...curr, files: curr.files.filter((f) => f._id !== id) } };
      });
      onFileDeleted?.(id);
    } catch {}
  }, [deleteConfirm, viewKey, onFileDeleted]);

  // ── Navigate-then-create helpers ──────────────────────────────────────────
  const handleNewFileInFolder = useCallback((folder) => {
    navigateInto(folder, { type: "file", parentId: folder._id });
  }, [navigateInto]);

  const handleNewSubFolder = useCallback((folder) => {
    navigateInto(folder, { type: "folder", parentId: folder._id });
  }, [navigateInto]);

  // ── Sidebar resize ────────────────────────────────────────────────────────
  const startSidebarResize = useCallback((e) => {
    e.preventDefault();
    setIsDraggingSidebar(true);
    document.body.classList.add("select-none");
    const startX = e.clientX, startW = sidebarWidth;
    const onMouseMove = (e) => {
      setSidebarWidth(Math.min(Math.max(startW + e.clientX - startX, MIN_SIDEBAR), MAX_SIDEBAR));
    };
    const onMouseUp = () => {
      setIsDraggingSidebar(false);
      document.body.classList.remove("select-none");
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [sidebarWidth]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>

      {/* ── Sidebar panel ── */}
      <div
        className={cn(
          "flex flex-col min-h-0 flex-shrink-0 overflow-hidden border-r border-[var(--sb-border)] bg-[var(--sb-panel)]",
          !isOpen && "w-0 border-r-0"
        )}
        style={isOpen ? { width: sidebarWidth } : undefined}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <PanelHeader
          title={isRoot ? "Explorer" : currentView.name}
          actions={
            <>
              <IconBtn title="New File" onClick={() => setCreatingItem({ type: "file", parentId: currentView.id ?? null })}>
                <FilePlus2 size={13} />
              </IconBtn>
              <IconBtn title="New Folder" onClick={() => setCreatingItem({ type: "folder", parentId: currentView.id ?? null })}>
                <FolderPlus size={13} />
              </IconBtn>
              <IconBtn title="Refresh" onClick={refreshCurrentView}>
                <RotateCcw size={12} />
              </IconBtn>
            </>
          }
        />

        {/* Breadcrumb — only when not at root */}
        {navStack.length > 1 && (
          <BreadcrumbBar navStack={navStack} onNavigate={navigateTo} />
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: "6px 0 8px" }}>

          {/* Loading skeleton */}
          {currentData.loading && !currentData.loaded && <LoadingView />}

          {/* Main content */}
          {(!currentData.loading || currentData.loaded) && (
            <>
              {/* Inline create input */}
              {creatingItem && (
                <InlineCreate
                  type={creatingItem.type}
                  onCommit={(name) => {
                    if (creatingItem.type === "folder") handleCreateFolder(name);
                    else handleCommitNewFile(name);
                  }}
                  onCancel={() => setCreatingItem(null)}
                />
              )}

              {/* Folders */}
              {currentData.folders.length > 0 && (
                <>
                  {!isRoot && currentData.files.length > 0 && <SectionLabel label="Sub-folders" />}
                  {currentData.folders.map((folder) => (
                    <FolderCard
                      key={folder._id}
                      folder={folder}
                      onNavigate={navigateInto}
                      onRename={handleRenameFolder}
                      onDelete={handleDeleteFolderRequest}
                      onNewFileInFolder={handleNewFileInFolder}
                      onNewSubFolder={handleNewSubFolder}
                    />
                  ))}
                </>
              )}

              {/* Files */}
              {currentData.files.length > 0 && (
                <>
                  {currentData.folders.length > 0 && <SectionLabel label="Files" />}
                  {currentData.files.map((file) => (
                    <FileRow
                      key={file._id}
                      file={file}
                      isActive={file._id === currentFileId}
                      onSelect={onSelectFile}
                      onRename={handleRenameFile}
                      onDelete={handleDeleteFileRequest}
                    />
                  ))}
                </>
              )}

              {/* Empty state */}
              {isEmpty && (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 12, padding: "36px 16px", textAlign: "center",
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: "var(--sb-item-hover)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {isRoot
                      ? <Folder     size={24} strokeWidth={1.25} style={{ color: "var(--sb-folder)" }} />
                      : <FolderOpen size={24} strokeWidth={1.25} style={{ color: "var(--sb-folder)" }} />
                    }
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--sb-text)", marginBottom: 5 }}>
                      {isRoot ? "No folders yet" : "Folder is empty"}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--sb-text-muted)", lineHeight: 1.6 }}>
                      {isRoot
                        ? "Create a folder to organise\nyour code files."
                        : "Add files or sub-folders\nto get started."}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => setCreatingItem({ type: "file", parentId: currentView.id ?? null })}
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 11px", borderRadius: 7, fontSize: 11, fontWeight: 600, color: "var(--sb-text)", background: "var(--sb-item-hover)", border: "none", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-item-active)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--sb-item-hover)"; }}
                    >
                      <FilePlus2 size={11} /> New File
                    </button>
                    <button
                      onClick={() => setCreatingItem({ type: "folder", parentId: currentView.id ?? null })}
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 11px", borderRadius: 7, fontSize: 11, fontWeight: 600, color: "var(--sb-text)", background: "var(--sb-item-hover)", border: "none", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sb-item-active)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--sb-item-hover)"; }}
                    >
                      <FolderPlus size={11} /> New Folder
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Resize handle ── */}
      {isOpen && (
        <div
          className={cn(
            "w-1 flex-shrink-0 cursor-col-resize flex items-center justify-center group",
            isDraggingSidebar ? "bg-[var(--sb-accent)]/20" : "hover:bg-[var(--sb-accent)]/10"
          )}
          onMouseDown={startSidebarResize}
          title="Drag to resize sidebar"
          aria-hidden="true"
        >
          <div className={cn(
            "w-px h-8 rounded-full transition-colors",
            isDraggingSidebar ? "bg-[var(--sb-accent)]" : "bg-[var(--sb-border)] group-hover:bg-[var(--sb-accent)]"
          )} />
        </div>
      )}

      {/* ── Main content slot ── */}
      <div className="flex flex-1 min-w-0 min-h-0">{children}</div>

      {/* ── Delete confirm dialog ── */}
      {deleteConfirm && (
        <DeleteConfirm
          name={deleteConfirm.name}
          type={deleteConfirm.type}
          onConfirm={deleteConfirm.type === "folder" ? confirmDeleteFolder : confirmDeleteFile}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
