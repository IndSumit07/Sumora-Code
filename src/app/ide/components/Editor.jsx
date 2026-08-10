"use client";

import EditorTabs from "./EditorTabs";
import Breadcrumbs from "./Breadcrumbs";
import CodeEditor from "./CodeEditor";

export default function Editor({ openTabs, activeFileId, onSelectTab, onCloseTab }) {
  return (
    <main
      aria-label="Editor"
      className="flex flex-col flex-1 min-w-0 min-h-0 bg-[#1e1e1e] overflow-hidden"
      style={{ fontFamily: "var(--font-ui), system-ui, -apple-system, sans-serif" }}
    >
      <EditorTabs
        openTabs={openTabs}
        activeFileId={activeFileId}
        onSelect={onSelectTab}
        onClose={onCloseTab}
      />
      <Breadcrumbs fileId={activeFileId} />
      <CodeEditor fileId={activeFileId} />
    </main>
  );
}
