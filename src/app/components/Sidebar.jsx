"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, Trash2, Plus, Pencil, Check, X } from "lucide-react";

function SidebarItem({
  file,
  currentFileId,
  onSelectFile,
  onDeleteFile,
  onRenameFile,
  formatDate,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(file.question);
  const inputRef = useRef(null);

  useEffect(() => {
    setDraft(file.question);
  }, [file.question]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== file.question) {
      onRenameFile(file._id, trimmed);
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(file.question);
    setEditing(false);
  };

  if (editing) {
    return (
      <div
        className={`sidebar-item${file._id === currentFileId ? " active" : ""}`}
        onClick={() => onSelectFile(file)}
      >
        <FileText size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
        <form
          className="sidebar-item-edit-form"
          onSubmit={(e) => {
            e.preventDefault();
            commit();
          }}
          style={{ display: "flex", alignItems: "center", flex: 1, gap: "4px" }}
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              minWidth: 0,
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "3px",
              padding: "2px 4px",
              fontSize: "inherit",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <button
            type="submit"
            onClick={(e) => e.stopPropagation()}
            className="sidebar-item-delete"
            aria-label="Confirm rename"
          >
            <Check size={12} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cancel();
            }}
            className="sidebar-item-delete"
            aria-label="Cancel rename"
          >
            <X size={12} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      className={`sidebar-item${file._id === currentFileId ? " active" : ""}`}
      onClick={() => onSelectFile(file)}
      title={file.question}
    >
      <FileText size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
      <span className="sidebar-item-name">{file.question}</span>
      <span className="sidebar-item-lang">{file.language}</span>
      <span className="sidebar-item-date">{formatDate(file.updatedAt)}</span>
      
      <div style={{ display: "flex", gap: "2px", marginLeft: "auto" }}>
        <button
          className="sidebar-item-delete"
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          title="Edit file name"
          aria-label={`Edit ${file.question}`}
        >
          <Pencil size={12} />
        </button>
        <button
          className="sidebar-item-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteFile(file._id);
          }}
          title="Delete file"
          aria-label={`Delete ${file.question}`}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({
  isOpen,
  files,
  currentFileId,
  onSelectFile,
  onNewFile,
  onDeleteFile,
  onRenameFile,
}) {
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <aside className={`sidebar${isOpen ? "" : " collapsed"}`}>
      <div className="sidebar-header">
        <span className="sidebar-header-title">Your Codes</span>
        <button
          className="sidebar-new-file-btn"
          onClick={onNewFile}
          title="New file"
          aria-label="Create new file"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* File list */}
      <div className="sidebar-list">
        {files.length === 0 ? (
          <div className="sidebar-empty">
            <FileText size={20} style={{ opacity: 0.4 }} />
            <span>No saved files yet</span>
          </div>
        ) : (
          files.map((file) => (
            <SidebarItem
              key={file._id}
              file={file}
              currentFileId={currentFileId}
              onSelectFile={onSelectFile}
              onDeleteFile={onDeleteFile}
              onRenameFile={onRenameFile}
              formatDate={formatDate}
            />
          ))
        )}
      </div>
    </aside>
  );
}
