"use client";

import { ChevronDown, ChevronsDownUp, FilePlus2, FolderClosed, FolderOpen, FolderPlus, RefreshCw } from "lucide-react";

function HeaderAction({ title, onClick, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex items-center justify-center w-6 h-6 rounded-[4px] text-[#cccccc] hover:bg-[#ffffff14] transition-colors"
    >
      {children}
    </button>
  );
}

export default function ProjectHeader({ name, isOpen, onToggle, onNewFile, onNewFolder, onRefresh, onCollapseAll }) {
  return (
    <div className="group flex items-center h-[30px] pl-2 pr-1.5 gap-0.5 flex-shrink-0 select-none">
      <button
        onClick={onToggle}
        aria-label={isOpen ? "Collapse project" : "Expand project"}
        className="flex items-center gap-1 flex-1 min-w-0 text-left text-[13px] font-medium text-[#cccccc] hover:text-white transition-colors"
      >
        {isOpen ? (
          <ChevronDown size={14} className="text-[#cccccc] flex-shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-[#cccccc] flex-shrink-0 -rotate-90 transition-transform" />
        )}
        {isOpen ? (
          <FolderOpen size={16} className="text-[#dcb67a] flex-shrink-0" fill="currentColor" />
        ) : (
          <FolderClosed size={16} className="text-[#dcb67a] flex-shrink-0" fill="currentColor" />
        )}
        <span className="truncate">{name}</span>
      </button>

      <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
        <HeaderAction title="New File" onClick={onNewFile}>
          <FilePlus2 size={15} />
        </HeaderAction>
        <HeaderAction title="New Folder" onClick={onNewFolder}>
          <FolderPlus size={15} />
        </HeaderAction>
        <HeaderAction title="Refresh" onClick={onRefresh}>
          <RefreshCw size={14} />
        </HeaderAction>
        <HeaderAction title="Collapse All" onClick={onCollapseAll}>
          <ChevronsDownUp size={14} />
        </HeaderAction>
      </div>
    </div>
  );
}
