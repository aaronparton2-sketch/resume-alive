"use client";

import { useState } from "react";
import manifest from "@/data/tech-icons.json";

type Entry = { light: string; dark: string | null; invert: boolean } | null;
const ICONS = manifest as Record<string, Entry>;

// Same rules as lib/icons.mjs (kept tiny here so the browser doesn't load the server code)
const ALIASES: Record<string, string> = {
  "vs code": "visual studio code", vscode: "visual studio code", codex: "openai", "openai codex": "openai",
  chatgpt: "openai", "claude code": "claude", "claude api": "claude", "meta ads": "meta", "facebook ads": "meta",
  "instagram ads": "meta", "next.js": "nextjs", "next js": "nextjs", postgres: "postgresql",
  seo: "google search console", "search console": "google search console", "short-form video": "instagram",
  reels: "instagram", js: "javascript", ts: "typescript", "tailwind css": "tailwindcss", tailwind: "tailwindcss",
};
export function iconKey(name: string) {
  const k = name.trim().toLowerCase();
  return (ALIASES[k] || k).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** A tool's logo. Saved logos come from data/tech-icons.json; anything new is fetched live from /api/icon. */
export function TechIcon({ name, className = "size-4" }: { name: string; className?: string }) {
  const key = iconKey(name);
  const entry = key in ICONS ? ICONS[key] : undefined;
  const [failed, setFailed] = useState(false);

  if (entry === null || failed) {
    return (
      <span className={`${className} grid shrink-0 place-items-center rounded-[4px] bg-ink/10 text-[8px] font-bold leading-none text-ink2`}>
        {name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()}
      </span>
    );
  }
  if (entry === undefined) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/api/icon?name=${encodeURIComponent(name)}`} alt="" className={`${className} shrink-0 object-contain`} onError={() => setFailed(true)} />;
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={entry.light}
        alt=""
        className={`${className} shrink-0 object-contain ${entry.dark ? "dark:hidden" : entry.invert ? "dark:invert" : ""}`}
        onError={() => setFailed(true)}
      />
      {entry.dark && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.dark} alt="" className={`${className} hidden shrink-0 object-contain dark:block`} />
      )}
    </>
  );
}
