"use client";

import { AnimatePresence, motion } from "motion/react";
import { Pause } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Media } from "@/lib/schema";
import { youtubeId } from "./ui";

/**
 * The picture at the top of a project card. It plays on its own once the card is on screen,
 * and pauses while someone hovers it (so they can look properly):
 * - an mp4 plays muted and loops
 * - a YouTube video plays muted in place of its thumbnail
 * - an image marked hover: "scroll" glides top to bottom and back (long pages, newsletters)
 */
export function ProjectCover({ media, visible, playing }: { media: Media[]; visible: boolean; playing: boolean }) {
  const yt = media.find((m) => m.type === "youtube");
  const video = media.find((m) => m.type === "video");
  const image = media.find((m) => m.type === "image");
  const id = yt ? youtubeId(yt.url) : null;
  const vref = useRef<HTMLVideoElement>(null);
  const fref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const v = vref.current;
    if (v) {
      if (playing) v.play().catch(() => {});
      else v.pause();
    }
    const f = fref.current;
    if (f?.contentWindow) {
      f.contentWindow.postMessage(JSON.stringify({ event: "command", func: playing ? "playVideo" : "pauseVideo", args: [] }), "*");
    }
  }, [playing]);

  if (!yt && !video && !image) return null;
  const paused = visible && !playing;

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-line bg-card2">
      {id ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="size-full object-cover" />
          <AnimatePresence>
            {visible && (
              <motion.iframe
                ref={fref}
                key="yt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&modestbranding=1&playsinline=1&rel=0&enablejsapi=1`}
                title={yt?.caption ?? "Video"}
                allow="autoplay; encrypted-media"
                className="pointer-events-none absolute left-1/2 top-1/2 h-[135%] w-[135%] -translate-x-1/2 -translate-y-1/2"
              />
            )}
          </AnimatePresence>
        </>
      ) : video ? (
        <video ref={vref} src={video.url} poster={image?.url} muted loop playsInline preload="metadata" className="size-full object-cover" />
      ) : image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.url}
          alt=""
          loading="lazy"
          style={
            image.hover === "scroll"
              ? { animation: "cover-scroll 16s ease-in-out infinite", animationPlayState: playing ? "running" : "paused" }
              : undefined
          }
          className="size-full object-cover object-top"
        />
      ) : null}

      <span
        className={`absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white backdrop-blur transition-opacity duration-200 ${
          paused ? "opacity-100" : "opacity-0"
        }`}
      >
        <Pause className="size-2.5 fill-current" /> paused
      </span>
    </div>
  );
}
