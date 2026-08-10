"use client";

import { MoreHorizontal } from "lucide-react";

export default function ExplorerHeader({ onMore }) {
  return (
    <div className="flex items-center justify-between h-9 px-3 bg-[#2d2d2d] border-b border-[#1e1e1e] flex-shrink-0 select-none">
      <span className="text-[11px] font-semibold tracking-[0.08em] text-[#bbbbbb] uppercase">
        Explorer
      </span>
      <button
        onClick={onMore}
        aria-label="More actions"
        className="flex items-center justify-center w-6 h-6 rounded-[4px] text-[#cccccc] hover:bg-[#ffffff14] transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
    </div>
  );
}
