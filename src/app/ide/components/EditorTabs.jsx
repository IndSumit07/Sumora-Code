"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fileIcon } from "../lib/vscode-data";

export default function EditorTabs({ openTabs, activeFileId, onSelect, onClose }) {
  return (
    <div className="flex items-stretch h-[35px] bg-[#252526] flex-shrink-0 select-none overflow-x-auto no-scrollbar">
      {openTabs.length === 0 && (
        <div className="flex items-center px-3 text-[13px] text-[#969696]">
          No open editors
        </div>
      )}
      {openTabs.map((file) => {
        const { icon: Icon, color } = fileIcon(file.name);
        const isActive = file.id === activeFileId;
        return (
          <div
            key={file.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(file.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(file.id);
              }
            }}
            className={cn(
              "group/tab relative flex items-center gap-1.5 pl-3 pr-2 h-full min-w-0 cursor-pointer border-r border-[#1b1b1b] transition-colors",
              isActive ? "bg-[#1e1e1e] text-white" : "bg-[#2d2d2d] text-[#969696] hover:bg-[#2d2d2d] hover:text-[#cccccc]"
            )}
          >
            {isActive && <span className="absolute inset-x-0 top-0 h-px bg-[#0078d4]" />}
            <Icon size={15} className="flex-shrink-0" style={{ color }} />
            <span className="truncate max-w-[160px] text-[13px] leading-none">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(file.id);
              }}
              aria-label={`Close ${file.name}`}
              title="Close"
              className={cn(
                "flex items-center justify-center w-4 h-4 rounded-[3px] transition-colors",
                isActive
                  ? "text-[#cccccc] hover:bg-[#ffffff1a] hover:text-white"
                  : "text-[#969696] opacity-0 hover:bg-[#ffffff14] hover:text-[#cccccc] group-hover/tab:opacity-100"
              )}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
