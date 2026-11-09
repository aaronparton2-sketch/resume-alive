import { findIcon } from "@/lib/icons.mjs";

export const runtime = "nodejs";

// GET /api/icon?name=Claude&theme=dark -> that tool's logo. Used for skills that
// aren't in data/tech-icons.json yet (e.g. a resume someone just uploaded at /create).
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const name = (params.get("name") || "").slice(0, 60);
  if (!name) return new Response("Missing name", { status: 400 });
  const icon = await findIcon(name);
  if (!icon) return new Response("No icon", { status: 404, headers: { "Cache-Control": "public, s-maxage=86400" } });
  const img = params.get("theme") === "dark" && icon.dark ? icon.dark : icon.light;
  return new Response(new Uint8Array(img.buffer), {
    headers: {
      "Content-Type": img.contentType,
      "Cache-Control": "public, max-age=604800, s-maxage=604800",
      "X-Invert-In-Dark": String(icon.invertInDark),
    },
  });
}
