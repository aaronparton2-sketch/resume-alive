"use client";

import { AnimatePresence, animate, motion, useInView } from "motion/react";
import { ArrowUpRight, ChevronDown, Play, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Media } from "@/lib/schema";

/** Fades and lifts children in the first time they scroll into view. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <Reveal className="mb-6">
      <p className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h2>
    </Reveal>
  );
}

/** Counts from 0 to the value when it scrolls into view. */
export function CountUp({ value, prefix, suffix }: { value: number; prefix?: string | null; suffix?: string | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [shown, setShown] = useState(0);
  const decimals = (String(value).split(".")[1] ?? "").length;
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(v),
    });
    return () => controls.stop();
  }, [inView, value]);
  return (
    <span ref={ref}>
      {prefix}
      {shown.toLocaleString("en-AU", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix && /^[a-z]/i.test(suffix) && suffix.length > 1 ? ` ${suffix}` : suffix}
    </span>
  );
}

/** Tracks the cursor so .glow-card borders light up under it. */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      el.querySelectorAll<HTMLElement>(".glow-card").forEach((card) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return ref;
}

/** A clickable row that opens to show more. */
export function Expandable({
  header,
  children,
  defaultOpen = false,
}: {
  header: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glow-card rounded-2xl">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-white/[0.02] sm:p-5"
      >
        <div className="min-w-0 flex-1">{header}</div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="mt-1 grid size-7 shrink-0 place-items-center rounded-full border border-line2 text-ink2"
        >
          <ChevronDown className="size-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 sm:px-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/** YouTube thumbnail that only loads the player when clicked (keeps the page fast). */
export function YouTubeLite({ url, title }: { url: string; title?: string | null }) {
  const id = youtubeId(url);
  const [playing, setPlaying] = useState(false);
  if (!id) return null;
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-black">
      {playing ? (
        <iframe
          className="absolute inset-0 size-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title ?? "Video"}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button onClick={() => setPlaying(true)} className="group absolute inset-0" aria-label={`Play ${title ?? "video"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            className="size-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
          />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-14 place-items-center rounded-full bg-accent text-on-accent shadow-[0_0_40px_-4px_var(--color-accent)] transition group-hover:scale-110">
              <Play className="ml-0.5 size-6 fill-current" />
            </span>
          </span>
          {title && (
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 text-left text-sm text-ink">
              {title}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

export function MediaView({ media }: { media: Media }) {
  if (media.type === "youtube") return <YouTubeLite url={media.url} title={media.caption} />;
  if (media.type === "video")
    return (
      <video
        src={media.url}
        controls
        playsInline
        className="aspect-video w-full rounded-xl border border-line bg-black object-cover"
      />
    );
  if (media.type === "image")
    return (
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.url} alt={media.caption ?? ""} className="w-full rounded-xl border border-line object-cover" />
        {media.caption && <figcaption className="mt-2 text-xs text-ink3">{media.caption}</figcaption>}
      </figure>
    );
  return (
    <a
      href={media.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-line2 px-3 py-1.5 text-sm text-ink2 transition hover:border-accent hover:text-ink"
    >
      {media.caption ?? media.url}
      <ArrowUpRight className="size-3.5" />
    </a>
  );
}

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line2 bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-full border border-line2 text-ink2 hover:text-ink"
            >
              <X className="size-4" />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Chip({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs transition ${
        active ? "border-accent/60 bg-accent/10 text-ink" : "border-line2 bg-white/[0.02] text-ink2"
      }`}
    >
      {children}
    </span>
  );
}
