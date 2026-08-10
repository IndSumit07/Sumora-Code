"use client";

import { ChevronRight, FolderClosed, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { fileIcon } from "../lib/vscode-data";

function TreeFile({ node, depth, activeFileId, onSelect }) {
  const { icon: Icon, color } = fileIcon(node.name);
  const isActive = node.id === activeFileId;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(node)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(node);
        }
      }}
      className={cn(
        "group/file flex items-center gap-1.5 h-[22px] pr-2 cursor-pointer select-none transition-colors",
        isActive
          ? "bg-[#04395e] text-white"
          : "text-[#cccccc] hover:bg-[#2a2d2e]"
      )}
      style={{ paddingLeft: 4 + depth * 14 }}
      title={node.id}
    >
      <span className="w-[14px] flex-shrink-0" />
      <Icon size={16} className="flex-shrink-0" style={{ color }} />
      <span className="truncate text-[13px] leading-none">{node.name}</span>
    </div>
  );
}

function TreeFolder({ node, depth, expanded, activeFileId, onToggle, onSelect }) {
  const isOpen = expanded.has(node.id);

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggle(node.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle(node.id);
          }
        }}
        className="group/folder flex items-center gap-1.5 h-[22px] pr-2 cursor-pointer select-none text-[#cccccc] hover:bg-[#2a2d2e] transition-colors"
        style={{ paddingLeft: 4 + depth * 14 }}
        title={node.id}
      >
        <ChevronRight
          size={14}
          className={cn(
            "text-[#cccccc] flex-shrink-0 transition-transform duration-100",
            isOpen && "rotate-90"
          )}
        />
        {isOpen ? (
          <FolderOpen size={16} className="text-[#dcb67a] flex-shrink-0" fill="currentColor" />
        ) : (
          <FolderClosed size={16} className="text-[#dcb67a] flex-shrink-0" fill="currentColor" />
        )}
        <span className="truncate text-[13px] leading-none">{node.name}</span>
      </div>

      {isOpen && (
        <div className="relative ml-[7px] border-l border-[#2d2d2d]">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              activeFileId={activeFileId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeItem({ node, depth, expanded, activeFileId, onToggle, onSelect }) {
  if (node.type === "folder") {
    return (
      <TreeFolder
        node={node}
        depth={depth}
        expanded={expanded}
        activeFileId={activeFileId}
        onToggle={onToggle}
        onSelect={onSelect}
      />
    );
  }
  return (
    <TreeFile node={node} depth={depth} activeFileId={activeFileId} onSelect={onSelect} />
  );
}

export default function FileTree({ tree, expanded, activeFileId, onToggle, onSelect }) {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden py-1 min-h-0">
      {tree.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          depth={0}
          expanded={expanded}
          activeFileId={activeFileId}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
