"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { pathParts } from "../lib/vscode-data";

export default function Breadcrumbs({ fileId }) {
  if (!fileId) return null;

  const parts = pathParts(fileId);

  return (
    <div
      className="flex items-center gap-0.5 h-[26px] px-4 bg-[#252526] border-b border-[#454545] flex-shrink-0 select-none overflow-x-auto no-scrollbar"
      aria-label="File breadcrumbs"
    >
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1;
        return (
          <span key={i} className="flex items-center gap-0.5 whitespace-nowrap">
            {i > 0 && (
              <ChevronRight size={12} className="text-[#9d9d9d] flex-shrink-0" aria-hidden="true" />
            )}
            <span className={cn("text-xs", isLast ? "text-[#cccccc]" : "text-[#9d9d9d]")}>
              {part}
            </span>
          </span>
        );
      })}
    </div>
  );
}
