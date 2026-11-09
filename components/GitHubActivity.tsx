"use client";

import { motion } from "motion/react";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { GitHub } from "./icons";

type Day = { date: string; level: number; count: number } | null;
type Data = {
  user: string;
  weeks?: Day[][];
  total?: number;
  stars?: number;
  publicRepos?: number;
  top?: { name: string; stars: number; url: string; description: string | null }[];
};

// GitHub's own greens
const LEVELS = [
  "bg-[#ebedf0] dark:bg-[#161b22]",
  "bg-[#9be9a8] dark:bg-[#0e4429]",
  "bg-[#40c463] dark:bg-[#006d32]",
  "bg-[#30a14e] dark:bg-[#26a641]",
  "bg-[#216e39] dark:bg-[#39d353]",
];

/** The green-squares contribution graph plus total stars across public repos. */
export function GitHubActivity({ user }: { user: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/github?user=${encodeURIComponent(user)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, [user]);

  const weeks = data?.weeks ?? [];
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <a href={`https://github.com/${user}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-mono text-[12px] text-ink2 hover:text-accent">
          <GitHub className="size-4" /> {user}
        </a>
        <div className="flex flex-wrap gap-3 font-mono text-[12px] text-ink3">
          {data?.total !== undefined && (
            <span>
              <b className="text-ink">{data.total.toLocaleString()}</b> contributions this year
            </span>
          )}
          {data?.stars !== undefined && (
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <b className="text-ink">{data.stars}</b> stars across {data.publicRepos} public repos
            </span>
          )}
        </div>
      </div>

      {/* The graph: one column per week, scrolls sideways on small screens */}
      <div className="overflow-x-auto pb-1 [scrollbar-width:thin]">
        <div className="flex min-w-max gap-[2px]">
          {(weeks.length ? weeks : Array.from({ length: 53 }, () => Array(7).fill(null))).map((week, wi) => (
            <motion.div
              key={wi}
              className="flex flex-col gap-[2px]"
              initial={{ opacity: 0, y: 4 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: wi * 0.008, duration: 0.25 }}
            >
              {Array.from({ length: 7 }, (_, di) => {
                const d = week[di] ?? null;
                return (
                  <span
                    key={di}
                    onMouseEnter={() => d && setHover(`${d.count || "No"} contribution${d.count === 1 ? "" : "s"} on ${new Date(d.date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`)}
                    onMouseLeave={() => setHover(null)}
                    className={`size-[9px] rounded-[2px] transition-transform hover:scale-150 ${d ? LEVELS[d.level] : weeks.length ? "bg-transparent" : `${LEVELS[0]} animate-pulse`}`}
                  />
                );
              })}
            </motion.div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 font-mono text-[11px] text-ink3">
        <span className="min-h-4">{hover ?? " "}</span>
        <span className="flex items-center gap-1">
          Less {LEVELS.map((c) => <span key={c} className={`size-[10px] rounded-[2px] ${c}`} />)} More
        </span>
      </div>

      {data?.top && data.top.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
          {data.top.map((r) => (
            <a
              key={r.name}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              title={r.description ?? r.name}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 font-mono text-[11px] text-ink2 transition hover:-translate-y-0.5 hover:border-amber-400/60 hover:text-ink"
            >
              {r.name}
              <span className="inline-flex items-center gap-0.5 text-ink3">
                <Star className="size-3 fill-amber-400 text-amber-400" />
                {r.stars}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
