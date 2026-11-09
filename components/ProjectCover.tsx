"use client";

import { AnimatePresence, motion } from "motion/react";
import { Play } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Media } from "@/lib/schema";
import { youtubeId } from "./ui";

/**
 * The picture at the top of a project card, which comes alive when the card is hovered
 * (or scrolled into view on a phone):
 * - an mp4 plays, muted and looping
 * - a YouTube video swaps its thumbnail for the video, muted
 * - an image marked hover: "scroll" glides from top to bottom (great for long pages and newsletters)
 */
export function ProjectCover({ media, active }: { media: Media[]; active: boolean }) {
  const yt = media.find((m) => m.type === "youtube");
  const video = media.find((m) => m.type === "video");
  const image = media.find((m) => m.type === "image");
  const id = yt ? youtubeId(yt.url) : null;
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) v.play().catch(() => {});
    else {
      v.pause();
      v.currentTime = 0;
    }
  }, [active]);

  if (!yt && !video && !image) return null;

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-line bg-card2">
      {id ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="size-full object-cover" />
          <AnimatePresence>
            {active && (
              <motion.iframe
                key="yt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&modestbranding=1&playsinline=1&rel=0`}
                title={yt?.caption ?? "Video"}
                allow="autoplay; encrypted-media"
                className="pointer-events-none absolute left-1/2 top-1/2 h-[135%] w-[135%] -translate-x-1/2 -translate-y-1/2"
              />
            )}
          </AnimatePresence>
        </>
      ) : video ? (
        <video
          ref={ref}
          src={video.url}
          poster={image?.url}
          muted
          loop
          playsInline
          preload="metadata"
          className="size-full object-cover"
        />
      ) : image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.url}
          alt=""
          loading="lazy"
          style={{
            objectPosition: image.hover === "scroll" && active ? "center bottom" : "center top",
            transition: image.hover === "scroll" ? `object-position ${active ? 7 : 0.8}s ${active ? "linear" : "ease-out"}` : undefined,
          }}
          className={`size-full object-cover ${image.hover === "scroll" ? "" : "transition duration-500 group-hover:scale-[1.04]"}`}
        />
      ) : null}

      {(id || video) && (
        <span
          className={`absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white backdrop-blur transition-opacity ${
            active ? "opacity-0" : "opacity-100"
          }`}
        >
          <Play className="size-2.5 fill-current" /> video
        </span>
      )}
    </div>
  );
}
