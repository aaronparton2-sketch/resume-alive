import { cleanDomain, findLogo } from "@/lib/logos.mjs";

export const runtime = "nodejs";

// GET /api/logo?domain=alcoa.com -> the company's logo, cached for a week.
export async function GET(req: Request) {
  const domain = cleanDomain(new URL(req.url).searchParams.get("domain"));
  if (!domain) return new Response("Bad domain", { status: 400 });
  const logo = await findLogo(domain);
  if (!logo) return new Response("No logo found", { status: 404, headers: { "Cache-Control": "public, s-maxage=86400" } });
  return new Response(new Uint8Array(logo.buffer), {
    headers: {
      "Content-Type": logo.contentType,
      "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
      "X-Logo-Source": logo.source,
    },
  });
}
