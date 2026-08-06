"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  Plus,
  FolderPlus,
  Trash2,
  Pencil,
  Check,
  X,
  MoreHorizontal,
  Coffee,
  Cpu,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ── Language icon ──────────────────────────────────────────────────────────
function LangBadge({ language }) {
  if (language === "java") return <Coffee size={12} className="text-orange-400 flex-shrink-0" />;
  if (language === "cpp")  return <Cpu size={12} className="text-blue-400 flex-shrink-0" />;
  return <File size={12} className="text-zinc-500 flex-shrink-0" />;
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
      className="flex items-center gap-1 flex-1"
      onSubmit={(e) => { e.preventDefault(); commit(); }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={ref}
        className="flex-1 min-w-0 h-6 px-1.5 rounded bg-zinc-800 border border-zinc-600 text-zinc-100 text-xs font-mono outline-none focus:border-zinc-400"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); onCancel(); } }}
      />
      <button type="submit" className="p-0.5 text-emerald-400 hover:text-emerald-300">
        <Check size={12} />
      </button>
      <button type="button" onClick={onCancel} className="p-0.5 text-zinc-500 hover:text-zinc-300">
        <X size={12} />
      </button>
    </form>
  );
}

// ── File item ─────────────────────────────────────────────────────────────
function FileItem({ file, isActive, onSelect, onRename, onDelete }) {
  const [renaming, setRenaming] = useState(false);

  return (
    <SidebarMenuSubItem>
      {renaming ? (
        <div className="flex items-center gap-1 px-2 py-1">
          <LangBadge language={file.language} />
          <InlineRename
            value={file.question}
            onCommit={(name) => { onRename(file._id, name); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
          />
        </div>
      ) : (
        <SidebarMenuSubButton
          isActive={isActive}
          onClick={() => onSelect(file)}
          className={cn(
            "group/file flex items-center gap-2 cursor-pointer",
            isActive && "bg-zinc-700/50 text-zinc-100"
          )}
        >
          <LangBadge language={file.language} />
          <span className="flex-1 truncate text-xs">{file.question}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="opacity-0 group-hover/file:opacity-100 p-0.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={12} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 bg-zinc-900 border-zinc-800 text-zinc-200">
              <DropdownMenuItem
                className="gap-2 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 text-xs"
                onClick={(e) => { e.stopPropagation(); setRenaming(true); }}
              >
                <Pencil size={12} /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-300 text-xs"
                onClick={(e) => { e.stopPropagation(); onDelete(file._id); }}
              >
                <Trash2 size={12} /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuSubButton>
      )}
    </SidebarMenuSubItem>
  );
}

// ── Folder item ────────────────────────────────────────────────────────────
function FolderItem({
  folder,
  files,
  allFolders,
  currentFileId,
  onSelectFile,
  onRenameFile,
  onDeleteFile,
  onRenameFolder,
  onDeleteFolder,
  onCreateFile,
  onCreateSubFolder,
  depth = 0,
}) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);

  const subFolders = allFolders.filter((f) => f.parentId === folder._id);
  const folderFiles = files.filter((f) => f.folderId === folder._id);
  const hasChildren = subFolders.length > 0 || folderFiles.length > 0;

  return (
    <SidebarMenuItem>
      {renaming ? (
        <div className="flex items-center gap-1 px-2 py-1">
          <Folder size={13} className="text-zinc-400 flex-shrink-0" />
          <InlineRename
            value={folder.name}
            onCommit={(name) => { onRenameFolder(folder._id, name); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
          />
        </div>
      ) : (
        <SidebarMenuButton
          onClick={() => setOpen((prev) => !prev)}
          className="group/folder flex items-center gap-1.5 cursor-pointer"
          tooltip={folder.name}
        >
          <ChevronRight
            size={14}
            className={cn(
              "text-zinc-500 transition-transform duration-150 flex-shrink-0",
              open && "rotate-90"
            )}
          />
          {open
            ? <FolderOpen size={14} className="text-yellow-400 flex-shrink-0" />
            : <Folder size={14} className="text-yellow-500 flex-shrink-0" />
          }
          <span className="flex-1 truncate text-sm">{folder.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="opacity-0 group-hover/folder:opacity-100 p-0.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={13} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-zinc-900 border-zinc-800 text-zinc-200">
              <DropdownMenuItem
                className="gap-2 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 text-xs"
                onClick={(e) => { e.stopPropagation(); onCreateFile(folder._id); }}
              >
                <Plus size={12} /> New File Here
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 text-xs"
                onClick={(e) => { e.stopPropagation(); onCreateSubFolder(folder._id); }}
              >
                <FolderPlus size={12} /> New Sub-folder
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 text-xs"
                onClick={(e) => { e.stopPropagation(); setRenaming(true); }}
              >
                <Pencil size={12} /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-300 text-xs"
                onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder._id); }}
              >
                <Trash2 size={12} /> Delete Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuButton>
      )}

      {open && hasChildren && (
        <SidebarMenuSub>
          {/* Sub-folders */}
          {subFolders.map((sub) => (
            <FolderItem
              key={sub._id}
              folder={sub}
              files={files}
              allFolders={allFolders}
              currentFileId={currentFileId}
              onSelectFile={onSelectFile}
              onRenameFile={onRenameFile}
              onDeleteFile={onDeleteFile}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateFile={onCreateFile}
              onCreateSubFolder={onCreateSubFolder}
              depth={depth + 1}
            />
          ))}
          {/* Files in this folder */}
          {folderFiles.map((file) => (
            <FileItem
              key={file._id}
              file={file}
              isActive={file._id === currentFileId}
              onSelect={onSelectFile}
              onRename={onRenameFile}
              onDelete={onDeleteFile}
            />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

// ── Main AppSidebar ────────────────────────────────────────────────────────
function AppSidebar({
  files,
  folders,
  currentFileId,
  onSelectFile,
  onNewFile,
  onDeleteFile,
  onRenameFile,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}) {
  const rootFiles   = files.filter((f) => !f.folderId);
  const rootFolders = folders.filter((f) => !f.parentId);

  const handleCreateFile = useCallback((folderId) => {
    onNewFile(folderId ?? null);
  }, [onNewFile]);

  const handleCreateSubFolder = useCallback((parentId) => {
    onCreateFolder("New Folder", parentId);
  }, [onCreateFolder]);

  return (
    <Sidebar className="border-r border-zinc-800" collapsible="icon">
      <SidebarContent className="bg-[var(--bg-topbar)]">
        <SidebarGroup>
          <div className="flex items-center justify-between px-2 py-1">
            <SidebarGroupLabel className="text-[10px] font-bold tracking-widest uppercase text-zinc-600">
              Files
            </SidebarGroupLabel>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handleCreateFile(null)}
                title="New file (Ctrl+Alt+Space)"
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => onCreateFolder("New Folder", null)}
                title="New folder"
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <FolderPlus size={14} />
              </button>
            </div>
          </div>

          <SidebarMenu>
            {/* Root folders */}
            {rootFolders.map((folder) => (
              <FolderItem
                key={folder._id}
                folder={folder}
                files={files}
                allFolders={folders}
                currentFileId={currentFileId}
                onSelectFile={onSelectFile}
                onRenameFile={onRenameFile}
                onDeleteFile={onDeleteFile}
                onRenameFolder={onRenameFolder}
                onDeleteFolder={onDeleteFolder}
                onCreateFile={handleCreateFile}
                onCreateSubFolder={handleCreateSubFolder}
              />
            ))}

            {/* Root files (no folder) */}
            {rootFiles.length > 0 && (
              <>
                {rootFolders.length > 0 && (
                  <div className="h-px bg-zinc-800 mx-2 my-1" />
                )}
                {rootFiles.map((file) => (
                  <SidebarMenuItem key={file._id}>
                    <SidebarMenuButton
                      isActive={file._id === currentFileId}
                      onClick={() => onSelectFile(file)}
                      className={cn(
                        "group/rootfile flex items-center gap-2 cursor-pointer",
                        file._id === currentFileId && "bg-zinc-700/50 text-zinc-100"
                      )}
                      tooltip={file.question}
                    >
                      <LangBadge language={file.language} />
                      <span className="flex-1 truncate text-sm">{file.question}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="opacity-0 group-hover/rootfile:opacity-100 p-0.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal size={13} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 bg-zinc-900 border-zinc-800 text-zinc-200">
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 text-xs"
                            onClick={(e) => { e.stopPropagation(); onRenameFile(file._id, file.question); }}
                          >
                            <Pencil size={12} /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-300 text-xs"
                            onClick={(e) => { e.stopPropagation(); onDeleteFile(file._id); }}
                          >
                            <Trash2 size={12} /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </>
            )}

            {/* Empty state */}
            {rootFolders.length === 0 && rootFiles.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-zinc-600">
                <Folder size={28} strokeWidth={1.5} />
                <span className="text-xs text-center leading-relaxed">
                  No files yet.<br />Click <strong>+</strong> to create one.
                </span>
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

// ── Exported wrapper ───────────────────────────────────────────────────────
export default function SidebarWrapper({
  isOpen,
  files,
  currentFileId,
  onSelectFile,
  onNewFile,
  onDeleteFile,
  onRenameFile,
}) {
  const [folders, setFolders] = useState([]);
  // Track pending rename for root-level files via inline modal
  const [pendingRename, setPendingRename] = useState(null);

  // Fetch folders on mount
  useEffect(() => {
    fetch("/api/folders")
      .then((r) => r.ok ? r.json() : [])
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
      setFolders((prev) => prev.map((f) => f._id === id ? { ...f, name } : f));
    } catch {}
  }, []);

  const handleDeleteFolder = useCallback(async (id) => {
    try {
      await fetch(`/api/folders/${id}`, { method: "DELETE" });
      setFolders((prev) => prev.filter((f) => f._id !== id));
    } catch {}
  }, []);

  return (
    <SidebarProvider
      defaultOpen={isOpen}
      open={isOpen}
      style={{ "--sidebar-width": "14rem", "--sidebar-width-icon": "3rem" }}
    >
      <AppSidebar
        files={files}
        folders={folders}
        currentFileId={currentFileId}
        onSelectFile={onSelectFile}
        onNewFile={onNewFile}
        onDeleteFile={onDeleteFile}
        onRenameFile={handleRenameFile}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
      />

      {/* Inline rename modal for root files */}
      {pendingRename && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setPendingRename(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-80 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-zinc-100 mb-1">Rename File</h3>
            <p className="text-xs text-zinc-500 mb-4">Enter a new name for the file.</p>
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
                className="w-full h-10 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm outline-none focus:border-zinc-500 font-mono"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setPendingRename(null)}
                  className="px-3 h-8 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 h-8 rounded-lg text-xs font-bold bg-zinc-700 hover:bg-zinc-600 text-zinc-100 transition-colors"
                >
                  Rename
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}
