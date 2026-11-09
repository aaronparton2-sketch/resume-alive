import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import resume from "@/data/resume.json";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-face" });

export const metadata: Metadata = {
  title: `${resume.name} | ${resume.roles[0] ?? "Resume"}`,
  description: resume.headline,
  openGraph: { title: resume.name, description: resume.headline },
};

// Sets light/dark before the page paints, so there's no flash of the wrong theme.
const themeScript = `try{var q=new URLSearchParams(location.search).get("theme");var t=(q==="dark"||q==="light")?q:localStorage.getItem("theme");if(!t){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
