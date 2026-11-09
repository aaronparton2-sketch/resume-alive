// GET /api/github?user=octocat
// -> the last year of contributions (the green squares) and stars across their public repos.
// Works without a token. Set GITHUB_TOKEN to lift GitHub's 60-requests-an-hour limit.
// Private contributions only show if the person ticks "Include private contributions" on their GitHub profile.

export const runtime = "nodejs";
export const revalidate = 3600;

type Day = { date: string; level: number; count: number };

export async function GET(req: Request) {
  const user = (new URL(req.url).searchParams.get("user") || "").trim();
  if (!/^[A-Za-z0-9-]{1,39}$/.test(user)) return Response.json({ error: "Bad username" }, { status: 400 });

  const [contrib, repos] = await Promise.all([contributions(user), stars(user)]);
  if (!contrib && !repos) return Response.json({ error: "GitHub didn't answer" }, { status: 502 });

  return Response.json(
    { user, ...contrib, ...repos },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}

async function contributions(user: string) {
  const res = await fetch(`https://github.com/users/${user}/contributions`, {
    headers: { "User-Agent": "ResumeAlive/1.0" },
    next: { revalidate: 3600 },
  }).catch(() => null);
  if (!res?.ok) return null;
  const html = await res.text();

  // Each square: <td ... data-date="2026-01-04" id="contribution-day-component-0-5" data-level="2">
  // Its count lives in a matching <tool-tip for="contribution-day-component-0-5">3 contributions on ...</tool-tip>
  const counts = new Map<string, number>();
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const n = m[2].match(/^(\d+)/);
    counts.set(m[1], n ? Number(n[1]) : 0);
  }
  const days: Day[] = [];
  for (const m of html.matchAll(/<td\b[^>]*>/g)) {
    const tag = m[0];
    const date = tag.match(/data-date="([^"]+)"/)?.[1];
    if (!date) continue;
    const id = tag.match(/id="([^"]+)"/)?.[1] ?? "";
    days.push({ date, level: Number(tag.match(/data-level="(\d)"/)?.[1] ?? 0), count: counts.get(id) ?? 0 });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));

  // Group into weeks (columns), Sunday first, like GitHub
  const weeks: (Day | null)[][] = [];
  let week: (Day | null)[] = [];
  days.forEach((d, i) => {
    const dow = new Date(d.date + "T00:00:00Z").getUTCDay();
    if (i === 0) week = Array(dow).fill(null);
    week.push(d);
    if (dow === 6) {
      weeks.push(week);
      week = [];
    }
  });
  if (week.length) weeks.push(week);

  const total =
    Number(html.match(/([\d,]+)\s+contributions?\s+in the last year/)?.[1].replace(/,/g, "")) ||
    days.reduce((n, d) => n + d.count, 0);
  return { weeks, total };
}

async function stars(user: string) {
  const headers: Record<string, string> = { "User-Agent": "ResumeAlive/1.0", Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&type=owner&sort=updated`, {
    headers,
    next: { revalidate: 3600 },
  }).catch(() => null);
  if (!res?.ok) return null;
  const list = (await res.json()) as { name: string; stargazers_count: number; fork: boolean; private: boolean; html_url: string; description: string | null }[];
  const own = list.filter((r) => !r.fork && !r.private);
  return {
    stars: own.reduce((n, r) => n + r.stargazers_count, 0),
    publicRepos: own.length,
    top: own
      .filter((r) => r.stargazers_count > 0)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 4)
      .map((r) => ({ name: r.name, stars: r.stargazers_count, url: r.html_url, description: r.description })),
  };
}
