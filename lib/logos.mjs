// Finds the best logo for a company from its website domain.
// Used by app/api/logo (live sites) and scripts/fetch-logos.mjs (saves files into public/logos).
//
// Order tried, best first:
//   1. The icons the company's own homepage declares (apple-touch-icon, then the biggest <link rel="icon">)
//   2. https://<domain>/apple-touch-icon.png
//   3. Google's favicon service at 128px
//   4. DuckDuckGo's favicon service
// LinkedIn logos are not used: LinkedIn blocks automated access and its terms forbid scraping.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36 ResumeAlive/1.0";

export function cleanDomain(input) {
  if (!input) return null;
  let d = String(input).trim().toLowerCase();
  d = d.replace(/^[a-z]+:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d) ? d : null;
}

async function get(url, ms = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: ctrl.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function asImage(url) {
  const res = await get(url);
  if (!res || !res.ok) return null;
  const type = (res.headers.get("content-type") || "").split(";")[0].trim();
  const buf = Buffer.from(await res.arrayBuffer());
  const looksSvg = type.includes("svg") || buf.subarray(0, 200).toString().includes("<svg");
  if (!type.startsWith("image/") && !looksSvg && !url.endsWith(".ico")) return null;
  if (buf.length < 200) return null; // blank or 1px placeholders
  return { url, buffer: buf, contentType: looksSvg ? "image/svg+xml" : type || "image/x-icon" };
}

function declaredIcons(html, base) {
  const out = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const rel = (tag.match(/\brel=["']?([^"'>]+)/i) || [])[1]?.toLowerCase() || "";
    if (!rel.includes("icon")) continue;
    const href = (tag.match(/\bhref=["']?([^"' >]+)/i) || [])[1];
    if (!href || href.startsWith("data:")) continue;
    const sizes = (tag.match(/\bsizes=["']?([^"'>]+)/i) || [])[1] || "";
    const px = Math.max(0, ...sizes.split(/\s+/).map((s) => parseInt(s, 10) || 0));
    const score = (rel.includes("apple-touch") ? 1000 : 0) + (href.endsWith(".svg") ? 500 : 0) + px;
    try {
      out.push({ url: new URL(href, base).toString(), score });
    } catch {}
  }
  return out.sort((a, b) => b.score - a.score).map((i) => i.url);
}

// The logo image in the site header (<img class="custom-logo">, alt="Acme logo", .../logo.png),
// for sites that never declare a favicon.
function headerLogos(html, base) {
  const out = [];
  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    if (!/logo|seal|crest|brand/i.test(tag)) continue;
    const src = (tag.match(/\bsrc=["']([^"']+)/i) || [])[1];
    if (!src || src.startsWith("data:")) continue;
    const score = (/custom-logo|site-logo/i.test(tag) ? 100 : 0) + (/seal|crest|icon|mark/i.test(tag) ? 20 : 0);
    try {
      out.push({ url: new URL(src, base).toString(), score });
    } catch {}
  }
  return out.sort((a, b) => b.score - a.score).map((i) => i.url);
}

/** Returns { url, buffer, contentType, source } or null. */
export async function findLogo(rawDomain) {
  const domain = cleanDomain(rawDomain);
  if (!domain) return null;

  let homeHtml = null;
  for (const home of [`https://${domain}/`, `https://www.${domain}/`]) {
    const res = await get(home);
    if (!res || !res.ok) continue;
    const html = (await res.text()).slice(0, 300_000);
    for (const url of declaredIcons(html, res.url).slice(0, 4)) {
      const img = await asImage(url);
      if (img) return { ...img, source: "website" };
    }
    homeHtml = { html, base: res.url };
    break;
  }

  const touch = await asImage(`https://${domain}/apple-touch-icon.png`);
  if (touch) return { ...touch, source: "apple-touch-icon" };

  if (homeHtml) {
    for (const url of headerLogos(homeHtml.html, homeHtml.base).slice(0, 3)) {
      const img = await asImage(url);
      if (img) return { ...img, source: "header logo" };
    }
  }

  const google = await asImage(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
  if (google) return { ...google, source: "google" };

  const ddg = await asImage(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
  if (ddg) return { ...ddg, source: "duckduckgo" };

  return null;
}

export function extFor(contentType) {
  if (contentType.includes("svg")) return "svg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  return "ico";
}
