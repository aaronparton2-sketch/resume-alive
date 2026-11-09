"use client";

import { useInView } from "motion/react";
import { Bookmark, Eye, Heart, MessageCircle, Send } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Resume } from "@/lib/schema";
import { Instagram } from "./icons";

type Social = NonNullable<Resume["social"]>;
type Reel = Social["reels"][number];

const SECONDS_PER_REEL = 3.5; // lower = faster

/** Endless, auto-scrolling strip of reels with their results. Hover pauses it. */
export function ReelCarousel({ social }: { social: Social }) {
  const reels = [...social.reels, ...social.reels]; // doubled so the loop is seamless
  return (
    <div className="group/rc relative -mx-5 overflow-hidden sm:-mx-12">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-paper to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-paper to-transparent sm:w-16" />
      <div
        className="flex w-max gap-3 px-5 will-change-transform group-hover/rc:[animation-play-state:paused] sm:px-12"
        style={{ animation: `reel-marquee ${social.reels.length * SECONDS_PER_REEL}s linear infinite` }}
      >
        {reels.map((r, i) => (
          <ReelCard key={i} reel={r} />
        ))}
      </div>
    </div>
  );
}

/** Only the reels actually on screen play, so the page stays smooth. */
function ReelCard({ reel: r }: { reel: Reel }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const vref = useRef<HTMLVideoElement>(null);
  const visible = useInView(ref, { amount: 0.2 });
  useEffect(() => {
    const v = vref.current;
    if (!v) return;
    if (visible) v.play().catch(() => {});
    else v.pause();
  }, [visible]);
  return (
    <a
      ref={ref}
      href={r.url}
      target="_blank"
      rel="noreferrer"
      aria-label={`${r.title}: ${r.views} views`}
      className="group/reel relative block aspect-[9/16] w-[150px] shrink-0 overflow-hidden rounded-xl border border-line bg-card2 transition-transform duration-300 hover:-translate-y-1 sm:w-[170px]"
    >
      {r.video ? (
        <video ref={vref} src={r.video} poster={r.poster} muted loop playsInline preload="none" className="size-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.poster} alt="" loading="lazy" className="size-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />
      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white">
        <Eye className="size-3" /> {r.views}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <p className="mb-1.5 line-clamp-2 text-[12px] font-semibold leading-tight text-white">{r.title}</p>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono text-[10px] text-white/85">
          <span className="inline-flex items-center gap-1"><Heart className="size-2.5 fill-current" /> {r.likes}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="size-2.5" /> {r.comments}</span>
          <span className="inline-flex items-center gap-1"><Send className="size-2.5" /> {r.shares}</span>
          <span className="inline-flex items-center gap-1"><Bookmark className="size-2.5" /> {r.saves}</span>
        </div>
      </div>
      <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-md bg-black/50 text-white opacity-0 transition group-hover/reel:opacity-100">
        <Instagram className="size-3.5" />
      </span>
    </a>
  );
}
