import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Local UI fonts (neither is monospace — used for chrome/UI only)
const uiFont = localFont({
  src: [
    { path: "../../public/fonts/font1.ttf", weight: "400", style: "normal" },
  ],
  variable: "--font-ui",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

// Coding font for Monaco editor (true monospace)
const editorFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-editor",
  display: "swap",
  fallback: ["Fira Code", "ui-monospace", "monospace"],
});

export const metadata = {
  title: "Sumora Code — Java & C++ Online Compiler",
  description:
    "A distraction-free online code editor and compiler for Java and C++. Write, run, and test code instantly in your browser.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${uiFont.variable} ${editorFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
