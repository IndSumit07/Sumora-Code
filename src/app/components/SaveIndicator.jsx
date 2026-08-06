"use client";

import { Loader2, Check, X } from "lucide-react";

export default function SaveIndicator({ status, visible }) {
  if (!visible || status === "idle") return null;

  const base =
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold";

  const variants = {
    saving: "bg-zinc-800 text-zinc-300 border border-zinc-700",
    saved:  "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    error:  "bg-red-500/20 text-red-400 border border-red-500/30",
  };

  return (
    <span className={`${base} ${variants[status] ?? ""} animate-in fade-in zoom-in-95 duration-200`}>
      {status === "saving" && <Loader2 size={12} className="animate-spin" />}
      {status === "saved"  && <Check size={12} />}
      {status === "error"  && <X size={12} />}
      {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Error"}
    </span>
  );
}
