"use client";

import ExplorerHeader from "./ExplorerHeader";
import ProjectHeader from "./ProjectHeader";
import FileTree from "./FileTree";
import { fileTree, PROJECT_NAME } from "../lib/vscode-data";

export default function Explorer({ expanded, activeFileId, onToggle, onSelect, onNewFile, onNewFolder, onRefresh, onCollapseAll }) {
  return (
    <aside
      aria-label="Explorer"
      className="flex flex-col h-full bg-[#252526] text-[#cccccc] overflow-hidden"
      style={{ fontFamily: "var(--font-ui), system-ui, -apple-system, sans-serif" }}
    >
      <ExplorerHeader />
      <ProjectHeader
        name={PROJECT_NAME}
        isOpen
        onToggle={() => {}}
        onNewFile={onNewFile}
        onNewFolder={onNewFolder}
        onRefresh={onRefresh}
        onCollapseAll={onCollapseAll}
      />
      <FileTree
        tree={fileTree}
        expanded={expanded}
        activeFileId={activeFileId}
        onToggle={onToggle}
        onSelect={onSelect}
      />
    </aside>
  );
}
