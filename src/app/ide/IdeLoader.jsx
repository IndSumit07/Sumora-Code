"use client";

import dynamic from "next/dynamic";

const Ide = dynamic(() => import("./Ide"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-[#1e1e1e] text-[#858585] text-[13px]">
      Loading IDE…
    </div>
  ),
});

export default function IdeLoader() {
  return <Ide />;
}
