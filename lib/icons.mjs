// Finds the logo for a skill or tool name ("Claude", "n8n", "VS Code", "Monkey C").
// Used by scripts/fetch-icons.mjs (saves into public/tech/) and app/api/icon (live fallback).
//
// Order tried: an explicit override below -> svgl.app (full-colour logos, light + dark versions)
// -> Simple Icons (brand-coloured) -> the tool's website favicon (via lib/logos.mjs).
import { findLogo } from "./logos.mjs";

const UA = "ResumeAlive/1.0 (+https://github.com/aaronparton2-sketch/resume-alive)";

// Different names for the same thing. Left side is what people write, right side is what we search.
export const ALIASES = {
  "vs code": "visual studio code",
  vscode: "visual studio code",
  codex: "openai",
  "openai codex": "openai",
  chatgpt: "openai",
  "claude code": "claude",
  "claude api": "claude",
  "meta ads": "meta",
  "facebook ads": "meta",
  "instagram ads": "meta",
  "next.js": "nextjs",
  "next js": "nextjs",
  postgres: "postgresql",
  seo: "google search console",
  "search console": "google search console",
  "short-form video": "instagram",
  reels: "instagram",
  js: "javascript",
  ts: "typescript",
  "tailwind css": "tailwindcss",
  tailwind: "tailwindcss",
  gcp: "google cloud",
  aws: "amazon web services",
};

// Names the public logo libraries don't carry.
const OVERRIDES = {
  "monkey c": { url: "https://garmin.gallerycdn.vsassets.io/extensions/garmin/monkey-c/1.1.3/1770137116475/Microsoft.VisualStudio.Services.Icons.Default" },
  apify: { domain: "apify.com" },
  "power bi": { domain: "powerbi.microsoft.com" },
  excel: { svgl: "excel" },
  "google search console": { simple: "googlesearchconsole" },
  "google ads": { simple: "googleads" },
  meta: { simple: "meta" },
  nextjs: { svgl: "next.js" },
  mailchimp: { simple: "mailchimp" },
};

export function normalise(name) {
  const key = String(name || "").trim().toLowerCase();
  return ALIASES[key] || key;
}

export function fileKey(name) {
  return normalise(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function get(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: ctrl.signal, redirect: "follow" });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") || "").split(";")[0];
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 100) return null;
    const svg = type.includes("svg") || buffer.subarray(0, 300).toString().includes("<svg");
    return { buffer, contentType: svg ? "image/svg+xml" : type || "image/png" };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Is this SVG basically black (so it disappears on a dark page)?
function isDarkMono(buffer) {
  const s = buffer.toString();
  const fills = [...s.matchAll(/(?:fill|stop-color)\s*[:=]\s*["']?(#[0-9a-f]{3,6}|black|white|currentColor)/gi)].map((m) => m[1].toLowerCase());
  if (!fills.length) return !/fill=["']none/.test(s); // no fill = default black
  return fills.every((f) => {
    if (f === "black" || f === "currentcolor") return true;
    if (f === "white") return false;
    let h = f.slice(1);
    if (h.length === 3) h = [...h].map((c) => c + c).join("");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.18;
  });
}

async function fromSvgl(query) {
  const res = await fetch(`https://api.svgl.app?search=${encodeURIComponent(query)}`, { headers: { "User-Agent": UA } }).catch(() => null);
  if (!res || !res.ok) return null;
  const list = await res.json().catch(() => null);
  if (!Array.isArray(list) || !list.length) return null;
  const q = query.replace(/[^a-z0-9]/g, "");
  const pick =
    list.find((x) => x.title.toLowerCase().replace(/[^a-z0-9]/g, "") === q) ||
    list.find((x) => x.title.toLowerCase().replace(/[^a-z0-9]/g, "").startsWith(q)) ||
    list[0];
  const route = pick.route;
  const lightUrl = typeof route === "string" ? route : route.light;
  const darkUrl = typeof route === "string" ? null : route.dark;
  const light = await get(lightUrl);
  if (!light) return null;
  const dark = darkUrl ? await get(darkUrl) : null;
  return { light, dark, source: "svgl" };
}

async function fromSimple(slug) {
  const light = await get(`https://cdn.simpleicons.org/${slug}`);
  if (!light) return null;
  const dark = isDarkMono(light.buffer) ? await get(`https://cdn.simpleicons.org/${slug}/ffffff`) : null;
  return { light, dark, source: "simpleicons" };
}

/** Returns { light: {buffer, contentType}, dark: {...} | null, invertInDark: boolean, source } or null. */
export async function findIcon(name) {
  const key = normalise(name);
  if (!key) return null;
  const o = OVERRIDES[key] || {};
  let found = null;

  if (o.url) {
    const light = await get(o.url);
    if (light) found = { light, dark: null, source: "override" };
  }
  if (!found && o.domain) {
    const logo = await findLogo(o.domain);
    if (logo) found = { light: logo, dark: null, source: "favicon" };
  }
  if (!found && o.simple) found = await fromSimple(o.simple);
  if (!found) found = await fromSvgl(o.svgl || key);
  if (!found) found = await fromSimple(key.replace(/\./g, "dot").replace(/[^a-z0-9]/g, ""));
  if (!found) return null;

  const invertInDark = !found.dark && found.light.contentType.includes("svg") && isDarkMono(found.light.buffer);
  return { ...found, invertInDark };
}

export function extOf(contentType) {
  if (contentType.includes("svg")) return "svg";
  if (contentType.includes("jpeg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("icon")) return "ico";
  return "png";
}
