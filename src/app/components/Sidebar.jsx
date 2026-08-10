"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  Check,
  ChevronRight,
  ChevronsDownUp,
  Coffee,
  Cpu,
  File,
  FilePlus2,
  Folder,
  FolderOpen,
  FolderPlus,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ── Language icon ──────────────────────────────────────────────────────────
function LangBadge({ language }) {
  if (language === "java") return <Coffee size={14} className="text-orange-400/70 flex-shrink-0" />;
  if (language === "cpp") return <Cpu size={14} className="text-sky-400/70 flex-shrink-0" />;
  return <File size={14} className="text-zinc-500/70 flex-shrink-0" />;
}

// ── Shared primitives ──────────────────────────────────────────────────────
function PanelHeader({ title, children }) {
  return (
    <div className="flex items-center justify-between h-9 pl-3 pr-1.5 flex-shrink-0 border-b border-[var(--sb-border)]">
      <span className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-[var(--sb-text-muted)] select-none">
        {title}
      </span>
      <div className="flex items-center gap-0.5">{children}</div>
    </div>
  );
}

function PanelIconButton({ title, onClick, children, danger }) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center w-6 h-6 rounded text-[var(--sb-text-muted)] transition-colors",
        danger
          ? "hover:text-red-400/80 hover:bg-red-500/10"
          : "hover:text-[var(--sb-text)] hover:bg-[var(--sb-item-hover)]"
      )}
    >
      {children}
    </button>
  );
}

function SmallAction({ title, onClick, children }) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className="flex items-center justify-center w-5 h-5 rounded hover:bg-[var(--sb-item-active)] text-[var(--sb-text-muted)] hover:text-[var(--sb-text)] transition-colors"
    >
      {children}
    </button>
  );
}

// ── Inline rename / create input ───────────────────────────────────────────
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
      className="flex items-center gap-1 flex-1 min-w-0"
      onSubmit={(e) => { e.preventDefault(); commit(); }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={ref}
        className="flex-1 min-w-0 h-6 px-1.5 rounded bg-[var(--sb-input)] border border-[var(--sb-border)] text-[var(--sb-text)] text-xs outline-none focus:border-[var(--sb-accent)]"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); onCancel(); } }}
      />
      <button type="submit" className="p-0.5 text-emerald-400/80 hover:text-emerald-300 flex-shrink-0">
        <Check size={12} />
      </button>
      <button type="button" onClick={onCancel} className="p-0.5 text-[var(--sb-text-muted)] hover:text-[var(--sb-text)] flex-shrink-0">
        <X size={12} />
      </button>
    </form>
  );
}

// ── Inline create placeholder (appears in tree while naming) ───────────────
function InlineCreateItem({ type, parentId, onCommit, onCancel }) {
  const [draft, setDraft] = useState(type === "folder" ? "New Folder" : "Untitled");
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);

  const commit = () => {
    const t = draft.trim();
    if (t) onCommit(t, parentId);
    else onCancel();
  };

  return (
    <div className="flex items-center gap-1.5 h-[26px] pr-1" style={{ paddingLeft: 8 + (parentId ? 1 : 0) * 14 }}>
      {type === "folder"
        ? <Folder size={14} className="text-[var(--sb-folder)] flex-shrink-0" />
        : <LangBadge language="java" />
      }
      <form
        className="flex items-center gap-1 flex-1 min-w-0"
        onSubmit={(e) => { e.preventDefault(); commit(); }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={ref}
          className="flex-1 min-w-0 h-6 px-1.5 rounded bg-[var(--sb-input)] border border-[var(--sb-accent)] text-[var(--sb-text)] text-xs outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); onCancel(); } }}
        />
        <button type="submit" className="p-0.5 text-emerald-400/80 hover:text-emerald-300 flex-shrink-0">
          <Check size={12} />
        </button>
        <button type="button" onClick={onCancel} className="p-0.5 text-[var(--sb-text-muted)] hover:text-[var(--sb-text)] flex-shrink-0">
          <X size={12} />
        </button>
      </form>
    </div>
  );
}

// ── File item ──────────────────────────────────────────────────────────────
function FileItem({ file, isActive, onSelect, onRename, onDelete, depth = 0 }) {
  const [renaming, setRenaming] = useState(false);

  return (
    <div className="relative" style={{ paddingLeft: 8 + depth * 14 }}>
      {renaming ? (
        <div className="flex items-center gap-1.5 h-6 pr-1">
          <LangBadge language={file.language} />
          <InlineRename
            value={file.question}
            onCommit={(name) => { onRename(file._id, name); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
          />
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelect(file)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(file); } }}
          className={cn(
            "group/file flex items-center gap-1.5 h-[26px] pr-1 cursor-pointer select-none rounded-[4px] transition-colors",
            isActive
              ? "bg-[var(--sb-item-active)] text-[var(--sb-text-active)] font-medium"
              : "text-[var(--sb-text-muted)] hover:bg-[var(--sb-item-hover)] hover:text-[var(--sb-text)]"
          )}
        >
          <LangBadge language={file.language} />
          <span className="flex-1 truncate text-[13px] leading-none">{file.question}</span>
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover/file:opacity-100 flex items-center justify-center w-5 h-5 rounded hover:bg-[var(--sb-item-active)] text-[var(--sb-text-muted)] transition-all"
            >
              <MoreHorizontal size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 bg-[var(--sb-panel)] border-[var(--sb-border)] text-[var(--sb-text)]">
              <DropdownMenuItem className="gap-2 cursor-pointer text-xs hover:bg-[var(--sb-item-hover)] focus:bg-[var(--sb-item-hover)]" onClick={(e) => { e.stopPropagation(); setRenaming(true); }}>
                <Pencil size={12} /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer text-xs text-red-400/80 hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-300" onClick={(e) => { e.stopPropagation(); onDelete(file._id); }}>
                <Trash2 size={12} /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

// ── Folder item ────────────────────────────────────────────────────────────
function FolderItem({ folder, files, allFolders, currentFileId, expanded, collapsedOverride, creatingItem, onToggleFolder, onSelectFile, onRenameFile, onDeleteFile, onRenameFolder, onDeleteFolder, onCreateFile, onCreateSubFolder, depth = 0 }) {
  const [renaming, setRenaming] = useState(false);

  const subFolders = allFolders.filter((f) => f.parentId === folder._id);
  const folderFiles = files.filter((f) => f.folderId === folder._id);
  const hasChildren = subFolders.length > 0 || folderFiles.length > 0;

  const containsActive = useMemo(() => {
    if (!currentFileId) return false;
    const file = files.find((f) => f._id === currentFileId);
    if (!file?.folderId) return false;
    let cur = file.folderId;
    while (cur) {
      if (cur === folder._id) return true;
      cur = allFolders.find((f) => f._id === cur)?.parentId ?? null;
    }
    return false;
  }, [files, allFolders, currentFileId, folder._id]);

  const open = expanded.has(folder._id) || (containsActive && !collapsedOverride.has(folder._id));

  const isCreatingHere = creatingItem && creatingItem.parentId === folder._id;

  return (
    <div>
      {renaming ? (
        <div className="flex items-center gap-1.5 h-6 pr-1" style={{ paddingLeft: 8 + depth * 14 }}>
          <Folder size={14} className="text-[var(--sb-folder)] flex-shrink-0" />
          <InlineRename
            value={folder.name}
            onCommit={(name) => { onRenameFolder(folder._id, name); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
          />
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleFolder(folder._id, !open)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggleFolder(folder._id, !open); } }}
          className={cn(
            "group/folder flex items-center gap-1 h-[26px] pr-1 cursor-pointer select-none rounded-[4px] transition-colors",
            containsActive ? "text-[var(--sb-text)]" : "text-[var(--sb-text-muted)]",
            "hover:bg-[var(--sb-item-hover)] hover:text-[var(--sb-text)]"
          )}
          style={{ paddingLeft: 8 + depth * 14 }}
          title={folder.name}
        >
          <ChevronRight size={13} className={cn("text-[var(--sb-text-muted)] transition-transform duration-150 flex-shrink-0", open && "rotate-90")} />
          {open ? <FolderOpen size={15} className="text-[var(--sb-folder-open)] flex-shrink-0" /> : <Folder size={15} className="text-[var(--sb-folder)] flex-shrink-0" />}
          <span className="flex-1 truncate text-[13px] leading-none">{folder.name}</span>

          <span className="hidden group-hover/folder:flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <SmallAction title="New File" onClick={() => onCreateFile(folder._id)}>
              <FilePlus2 size={13} />
            </SmallAction>
            <SmallAction title="New Folder" onClick={() => onCreateSubFolder(folder._id)}>
              <FolderPlus size={13} />
            </SmallAction>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center justify-center w-5 h-5 rounded hover:bg-[var(--sb-item-active)] text-[var(--sb-text-muted)] hover:text-[var(--sb-text)] transition-colors"
              >
                <MoreHorizontal size={13} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-[var(--sb-panel)] border-[var(--sb-border)] text-[var(--sb-text)]">
                <DropdownMenuItem className="gap-2 cursor-pointer text-xs hover:bg-[var(--sb-item-hover)] focus:bg-[var(--sb-item-hover)]" onClick={(e) => { e.stopPropagation(); onCreateFile(folder._id); }}>
                  <Plus size={12} /> New File Here
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer text-xs hover:bg-[var(--sb-item-hover)] focus:bg-[var(--sb-item-hover)]" onClick={(e) => { e.stopPropagation(); onCreateSubFolder(folder._id); }}>
                  <FolderPlus size={12} /> New Sub-folder
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer text-xs hover:bg-[var(--sb-item-hover)] focus:bg-[var(--sb-item-hover)]" onClick={(e) => { e.stopPropagation(); setRenaming(true); }}>
                  <Pencil size={12} /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer text-xs text-red-400/80 hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-300" onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder._id); }}>
                  <Trash2 size={12} /> Delete Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        </div>
      )}

      {open && (hasChildren || isCreatingHere) && (
        <div className="border-l border-[var(--sb-border)] ml-[15px] pl-[5px]">
          {isCreatingHere && (
            <InlineCreateItem
              type={creatingItem.type}
              parentId={creatingItem.parentId}
              onCommit={creatingItem.onCommit}
              onCancel={creatingItem.onCancel}
            />
          )}
          {subFolders.map((sub) => (
            <FolderItem key={sub._id} folder={sub} files={files} allFolders={allFolders} currentFileId={currentFileId}
              expanded={expanded} collapsedOverride={collapsedOverride} creatingItem={creatingItem}
              onToggleFolder={onToggleFolder}
              onSelectFile={onSelectFile} onRenameFile={onRenameFile} onDeleteFile={onDeleteFile}
              onRenameFolder={onRenameFolder} onDeleteFolder={onDeleteFolder}
              onCreateFile={onCreateFile} onCreateSubFolder={onCreateSubFolder}
              depth={depth + 1} />
          ))}
          {folderFiles.map((file) => (
            <FileItem key={file._id} file={file} isActive={file._id === currentFileId}
              onSelect={onSelectFile} onRename={onRenameFile} onDelete={onDeleteFile} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Explorer panel ─────────────────────────────────────────────────────────
function ExplorerPanel({ files, folders, currentFileId, handlers, expanded, collapsedOverride, creatingItem }) {
  const rootFiles = files.filter((f) => !f.folderId);
  const rootFolders = folders.filter((f) => !f.parentId);
  const isEmpty = rootFolders.length === 0 && rootFiles.length === 0 && !creatingItem;
  const isCreatingAtRoot = creatingItem && creatingItem.parentId === null;

  return (
    <>
      <PanelHeader title="Explorer">
        <PanelIconButton title="New File" onClick={() => handlers.newFile(null)}>
          <FilePlus2 size={14} />
        </PanelIconButton>
        <PanelIconButton title="New Folder" onClick={() => handlers.newFolder(null)}>
          <FolderPlus size={14} />
        </PanelIconButton>
        <PanelIconButton title="Collapse All" onClick={handlers.collapseAll}>
          <ChevronsDownUp size={14} />
        </PanelIconButton>
      </PanelHeader>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {rootFolders.map((folder) => (
          <FolderItem key={folder._id} folder={folder} files={files} allFolders={folders}
            currentFileId={currentFileId} expanded={expanded} collapsedOverride={collapsedOverride}
            creatingItem={creatingItem}
            onToggleFolder={handlers.toggleFolder}
            onSelectFile={handlers.selectFile}
            onRenameFile={handlers.renameFile} onDeleteFile={handlers.deleteFile}
            onRenameFolder={handlers.renameFolder} onDeleteFolder={handlers.deleteFolder}
            onCreateFile={handlers.newFile} onCreateSubFolder={handlers.newFolder} />
        ))}

        {isCreatingAtRoot && (
          <InlineCreateItem
            type={creatingItem.type}
            parentId={null}
            onCommit={creatingItem.onCommit}
            onCancel={creatingItem.onCancel}
          />
        )}

        {rootFiles.map((file) => (
          <FileItem key={file._id} file={file} isActive={file._id === currentFileId}
            onSelect={handlers.selectFile} onRename={handlers.renameFile} onDelete={handlers.deleteFile} />
        ))}

        {isEmpty && (
          <div className="flex flex-col items-center justify-center gap-2.5 py-10 px-6 text-center">
            <Folder size={30} strokeWidth={1.25} className="text-[var(--sb-folder)]" />
            <p className="text-[12px] text-[var(--sb-text-muted)] leading-relaxed">
              No files yet.
              <br />
              Create your first file to get started.
            </p>
            <div className="flex gap-1.5 mt-1">
              <button onClick={() => handlers.newFile(null)} className="flex items-center gap-1 px-2.5 h-7 rounded text-[11px] font-semibold text-[var(--sb-text)] bg-[var(--sb-item-hover)] hover:bg-[var(--sb-item-active)] transition-colors">
                <FilePlus2 size={12} /> New File
              </button>
              <button onClick={() => handlers.newFolder(null)} className="flex items-center gap-1 px-2.5 h-7 rounded text-[11px] font-semibold text-[var(--sb-text)] bg-[var(--sb-item-hover)] hover:bg-[var(--sb-item-active)] transition-colors">
                <FolderPlus size={12} /> New Folder
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Sidebar wrapper ────────────────────────────────────────────────────────
export default function SidebarWrapper({
  isOpen,
  files,
  currentFileId,
  onSelectFile,
  onNewFile,
  onDeleteFile,
  onRenameFile,
  onToggleSidebar,
  userEmail,
  onLogout,
  children,
}) {
  const [folders, setFolders] = useState([]);
  const [pendingRename, setPendingRename] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [collapsedOverride, setCollapsedOverride] = useState(() => new Set());
  const [creatingItem, setCreatingItem] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const MIN_SIDEBAR = 160;
  const MAX_SIDEBAR = 450;

  useEffect(() => {
    fetch("/api/folders")
      .then((r) => (r.ok ? r.json() : []))
      .then(setFolders)
      .catch(() => {});
  }, []);

  const handleRenameFile = useCallback((id, currentName) => {
    setPendingRename({ id, currentName });
  }, []);

  const handleCreateFolder = useCallback(async (name, parentId) => {
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: parentId ?? null }),
      });
      if (!res.ok) return;
      const folder = await res.json();
      setFolders((prev) => [...prev, folder]);
    } catch {}
  }, []);

  const handleRenameFolder = useCallback(async (id, name) => {
    try {
      await fetch(`/api/folders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setFolders((prev) => prev.map((f) => (f._id === id ? { ...f, name } : f)));
    } catch {}
  }, []);

  const handleDeleteFolder = useCallback(async (id) => {
    try {
      await fetch(`/api/folders/${id}`, { method: "DELETE" });
      setFolders((prev) => prev.filter((f) => f._id !== id));
    } catch {}
  }, []);

  const handleToggleFolder = useCallback((id, shouldOpen) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (shouldOpen) next.add(id);
      else next.delete(id);
      return next;
    });
    setCollapsedOverride((prev) => {
      const next = new Set(prev);
      if (shouldOpen) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCollapseAll = useCallback(() => {
    setExpanded(new Set());
    setCollapsedOverride((prev) => {
      const next = new Set(prev);
      folders.forEach((f) => next.add(f._id));
      return next;
    });
  }, [folders]);

  const startSidebarResize = useCallback((e) => {
    e.preventDefault();
    setIsDraggingSidebar(true);
    document.body.classList.add("select-none");
    const startX = e.clientX;
    const startW = sidebarWidth;

    const onMouseMove = (e) => {
      const delta = e.clientX - startX;
      const newW = Math.min(Math.max(startW + delta, MIN_SIDEBAR), MAX_SIDEBAR);
      setSidebarWidth(newW);
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

  // Inline create handlers - open inline input instead of popup
  const handleNewFile = useCallback((parentId) => {
    setCreatingItem({
      type: "file",
      parentId,
      onCommit: (name, pid) => {
        setCreatingItem(null);
        onNewFile(name, pid);
      },
      onCancel: () => setCreatingItem(null),
    });
  }, [onNewFile]);

  const handleNewFolder = useCallback((parentId) => {
    setCreatingItem({
      type: "folder",
      parentId,
      onCommit: (name, pid) => {
        setCreatingItem(null);
        handleCreateFolder(name, pid);
      },
      onCancel: () => setCreatingItem(null),
    });
  }, [handleCreateFolder]);

  const handlers = useMemo(() => ({
    newFile: handleNewFile,
    newFolder: handleNewFolder,
    selectFile: onSelectFile,
    renameFile: onRenameFile,
    deleteFile: onDeleteFile,
    renameFolder: handleRenameFolder,
    deleteFolder: handleDeleteFolder,
    toggleFolder: handleToggleFolder,
    collapseAll: handleCollapseAll,
  }), [handleNewFile, handleNewFolder, onSelectFile, onRenameFile, onDeleteFile, handleRenameFolder, handleDeleteFolder, handleToggleFolder, handleCollapseAll]);

  return (
    <div
      className="flex flex-1 min-h-0 overflow-hidden"
      style={{ fontFamily: "var(--font-ui), system-ui, -apple-system, sans-serif" }}
    >
      {/* Sidebar panel */}
      <div
        className={cn(
          "flex flex-col min-h-0 flex-shrink-0 overflow-hidden border-r border-[var(--sb-border)] bg-[var(--sb-panel)]",
          !isOpen && "w-0 border-r-0"
        )}
        style={isOpen ? { width: sidebarWidth } : undefined}
        aria-hidden={!isOpen}
      >
        <ExplorerPanel
          files={files}
          folders={folders}
          currentFileId={currentFileId}
          handlers={handlers}
          expanded={expanded}
          collapsedOverride={collapsedOverride}
          creatingItem={creatingItem}
        />
      </div>

      {/* Sidebar resize handle */}
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

      {/* Main content */}
      <div className="flex flex-1 min-w-0 min-h-0">{children}</div>

      {/* Inline rename modal for root files */}
      {pendingRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPendingRename(null)}>
          <div className="bg-[var(--sb-panel)] border border-[var(--sb-border)] rounded-2xl p-6 w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-[var(--sb-text)] mb-1">Rename File</h3>
            <p className="text-xs text-[var(--sb-text-muted)] mb-4">Enter a new name for the file.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = e.target.elements.name.value.trim();
                if (val) onRenameFile(pendingRename.id, val);
                setPendingRename(null);
              }}
              className="flex flex-col gap-3"
            >
              <input
                name="name"
                autoFocus
                defaultValue={pendingRename.currentName}
                className="w-full h-10 px-3 rounded-lg bg-[var(--sb-input)] border border-[var(--sb-border)] text-[var(--sb-text)] text-sm outline-none focus:border-[var(--sb-accent)] font-mono"
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setPendingRename(null)} className="px-3 h-8 rounded-lg text-xs font-semibold text-[var(--sb-text-muted)] hover:text-[var(--sb-text)] hover:bg-[var(--sb-item-hover)] transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-3 h-8 rounded-lg text-xs font-bold bg-[var(--sb-item-active)] hover:bg-[var(--sb-accent)] text-[var(--sb-text)] transition-colors">
                  Rename
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
