import {
  Braces,
  CodeXml,
  FileCode,
  FileImage,
  FileKey,
  FileLock,
  FileText,
  FileType,
  ScrollText,
} from "lucide-react";

// ── File icon mapping (VS Code "Minimal" style colors) ─────────────────────
const EXT_ICONS = {
  js: { icon: FileCode, color: "#eab308" },
  mjs: { icon: FileCode, color: "#eab308" },
  cjs: { icon: FileCode, color: "#eab308" },
  jsx: { icon: FileCode, color: "#eab308" },
  ts: { icon: CodeXml, color: "#3b82f6" },
  tsx: { icon: CodeXml, color: "#3b82f6" },
  json: { icon: Braces, color: "#f59e0b" },
  md: { icon: ScrollText, color: "#60a5fa" },
  css: { icon: FileType, color: "#38bdf8" },
  scss: { icon: FileType, color: "#38bdf8" },
  html: { icon: FileType, color: "#f97316" },
  png: { icon: FileImage, color: "#c084fc" },
  jpg: { icon: FileImage, color: "#c084fc" },
  jpeg: { icon: FileImage, color: "#c084fc" },
  svg: { icon: FileImage, color: "#c084fc" },
  ico: { icon: FileImage, color: "#c084fc" },
  ttf: { icon: FileType, color: "#94a3b8" },
  woff: { icon: FileType, color: "#94a3b8" },
  woff2: { icon: FileType, color: "#94a3b8" },
};

const NAME_ICONS = {
  ".env.local": { icon: FileKey, color: "#8b949e" },
  ".gitignore": { icon: FileLock, color: "#8b949e" },
  ".gitattributes": { icon: FileLock, color: "#8b949e" },
  ".eslintrc": { icon: FileCode, color: "#8b949e" },
  ".prettierrc": { icon: Braces, color: "#8b949e" },
};

export function fileIcon(name) {
  const byName = NAME_ICONS[name];
  if (byName) return byName;
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext) {
    const byExt = EXT_ICONS[ext];
    if (byExt) return byExt;
  }
  return { icon: FileText, color: "#8b949e" };
}

export function languageFor(name) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["js", "mjs", "cjs", "jsx"].includes(ext)) return "javascript";
  if (["ts", "tsx"].includes(ext)) return "typescript";
  if (ext === "json") return "json";
  if (ext === "md") return "markdown";
  if (["css", "scss"].includes(ext)) return "css";
  if (ext === "html") return "html";
  if (name.startsWith(".env")) return "plaintext";
  return "plaintext";
}

// ── Project tree ────────────────────────────────────────────────────────────
export const PROJECT_NAME = "SUMORA-CODE";

export const fileTree = [
  { id: ".commandcode", name: ".commandcode", type: "folder", children: [] },
  { id: ".next", name: ".next", type: "folder", children: [] },
  { id: "node_modules", name: "node_modules", type: "folder", children: [] },
  {
    id: "public",
    name: "public",
    type: "folder",
    children: [
      { id: "public/fonts", name: "fonts", type: "folder", children: [] },
      { id: "public/logo.png", name: "logo.png", type: "file" },
    ],
  },
  {
    id: "scripts",
    name: "scripts",
    type: "folder",
    children: [{ id: "scripts/seed-user.mjs", name: "seed-user.mjs", type: "file" }],
  },
  {
    id: "src",
    name: "src",
    type: "folder",
    children: [
      { id: "src/app", name: "app", type: "folder", children: [] },
      { id: "src/components", name: "components", type: "folder", children: [] },
      { id: "src/hooks", name: "hooks", type: "folder", children: [] },
      { id: "src/lib", name: "lib", type: "folder", children: [] },
    ],
  },
  { id: ".env.local", name: ".env.local", type: "file" },
  { id: ".gitignore", name: ".gitignore", type: "file" },
  { id: "AGENTS.md", name: "AGENTS.md", type: "file" },
  { id: "CLAUDE.md", name: "CLAUDE.md", type: "file" },
  { id: "components.json", name: "components.json", type: "file" },
  { id: "eslint.config.mjs", name: "eslint.config.mjs", type: "file" },
  { id: "jsconfig.json", name: "jsconfig.json", type: "file" },
  { id: "next.config.mjs", name: "next.config.mjs", type: "file" },
  { id: "package-lock.json", name: "package-lock.json", type: "file" },
  { id: "package.json", name: "package.json", type: "file" },
  { id: "postcss.config.mjs", name: "postcss.config.mjs", type: "file" },
  { id: "README.md", name: "README.md", type: "file" },
];

export const INITIAL_EXPANDED = new Set(["public", "public/fonts", "scripts", "src", "src/app", "src/components", "src/hooks", "src/lib"]);

// ── Mock file contents ──────────────────────────────────────────────────────
export const FILE_CONTENT = {
  "scripts/seed-user.mjs": `/**
 * Seed script — creates a user in MongoDB.
 *
 * Usage:
 *   node scripts/seed-user.mjs <email> <password>
 *
 * Reads MONGO_URI from .env.local automatically via dotenv.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import mongoose from "mongoose";

// --- Load .env.local manually (no dotenv dependency needed) ---
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const lines = readFileSync(envPath, "utf-8").split(/\\r?\\n/);

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) continue;

      const eqIdx = trimmed.indexOf("=");

      if (eqIdx === -1) continue;

      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();

      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    console.warn(
      "⚠ Could not read .env.local — make sure MONGO_URI is set."
    );
  }
}
`,
  "package.json": `{
  "name": "cp-editor",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@base-ui/react": "^1.7.0",
    "@monaco-editor/react": "^4.7.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.20.0",
    "mongoose": "^9.7.1",
    "next": "16.2.9",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "shadcn": "^4.16.1",
    "tailwind-merge": "^3.6.0",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "eslint": "^9",
    "eslint-config-next": "16.2.9",
    "tailwindcss": "^4"
  }
}
`,
  "README.md": `# Sumora Code

A distraction-free online code editor and compiler for **Java** and **C++**.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Scripts

- \`npm run dev\` — start the development server
- \`npm run build\` — create an optimized production build
- \`node scripts/seed-user.mjs <email> <password>\` — seed a user in MongoDB

## Tech Stack

- Next.js (App Router)
- React 19
- Tailwind CSS v4
- shadcn/ui
- MongoDB + Mongoose
- Monaco Editor
`,
  "AGENTS.md": `<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure
may all differ from your training data. Read the relevant guide in
\`node_modules/next/dist/docs/\` before writing any code. Heed deprecation
notices.
<!-- END:nextjs-agent-rules -->
`,
  "CLAUDE.md": `# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working
with code in this repository.

## Build Commands

- \`npm run dev\` — start the dev server
- \`npm run build\` — production build
- \`npm run lint\` — run ESLint
`,
  "components.json": `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": true,
  "tsx": false,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
`,
  "next.config.mjs": `/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

export default nextConfig;
`,
  "jsconfig.json": `{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
`,
  "postcss.config.mjs": `const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`,
  "eslint.config.mjs": `import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
`,
  ".env.local": `# MongoDB connection string
MONGO_URI=mongodb://127.0.0.1:27017/cp-editor

# Session secret used to sign cookies
SESSION_SECRET=replace-me-with-a-long-random-string
`,
  ".gitignore": `# dependencies
/node_modules
/.pnp
.pnp.*

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*

# env files
.env*.local
`,
};

export function contentFor(id) {
  return FILE_CONTENT[id] ?? `// ${id.split("/").pop()} — no preview available\n`;
}

export function pathParts(id) {
  return id.split("/");
}

export function fileById(id) {
  const walk = (nodes) => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = walk(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(fileTree);
}
