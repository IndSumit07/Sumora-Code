"use client";

import { FileText, Trash2, Plus } from "lucide-react";

export default function Sidebar({
  isOpen,
  files,
  currentFileId,
  onSelectFile,
  onNewFile,
  onDeleteFile,
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
            <div
              key={file._id}
              className={`sidebar-item${file._id === currentFileId ? " active" : ""}`}
              onClick={() => onSelectFile(file)}
              title={file.question}
            >
              <FileText size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
              <span className="sidebar-item-name">{file.question}</span>
              <span className="sidebar-item-lang">{file.language}</span>
              <span className="sidebar-item-date">{formatDate(file.updatedAt)}</span>
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
          ))
        )}
      </div>
    </aside>
  );
}
