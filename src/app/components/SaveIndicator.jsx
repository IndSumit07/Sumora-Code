"use client";

import { Loader2, Check, X } from "lucide-react";

export default function SaveIndicator({ status, visible }) {
  if (!visible || status === "idle") return null;

  return (
    <span className={`save-status ${status}`} style={{ animation: "popIn 300ms cubic-bezier(0.16, 1, 0.3, 1) both" }}>
      {status === "saving" && <Loader2 size={16} className="animate-spin" />}
      {status === "saved" && <Check size={16} />}
      {status === "error" && <X size={16} />}
    </span>
  );
}
