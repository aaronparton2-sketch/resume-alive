"use client";

// The soft "drops in and un-blurs" entrance, in the style of Magic UI's BlurFade
// (Dillion Verma, MIT licence: https://github.com/magicuidesign/portfolio).
import { motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";

export const STEP = 0.05;

export function BlurFade({
  children,
  delay = 0,
  className,
  inView = false,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** wait until scrolled into view (default: animate on page load) */
  inView?: boolean;
}) {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, margin: "-50px" });
  const show = !inView || seen;
  return (
    <motion.div
      ref={ref}
      initial={{ y: -6, opacity: 0, filter: "blur(6px)" }}
      animate={show ? { y: 0, opacity: 1, filter: "blur(0px)" } : undefined}
      transition={{ delay: 0.04 + delay, duration: 0.4, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Text that drops in one letter at a time. */
export function BlurFadeText({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  return (
    <span className={className} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ y: -8, opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: delay + i * 0.03, duration: 0.4, ease: "easeOut" }}
          className="inline-block"
          style={{ width: ch === " " ? "0.25em" : undefined }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}
