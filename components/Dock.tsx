"use client";

// Bottom dock in the style of Magic UI's portfolio (Dillion Verma, MIT licence):
// home, your links, and the day/night switch. Icons grow as the cursor gets close.
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { Home, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Link } from "@/lib/schema";
import { LinkIcon } from "./icons";

export function Dock({ links }: { links: Link[] }) {
  const mouseX = useMotionValue(Infinity);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light"), []);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }
  const shown = links.filter((l) => ["linkedin", "github", "instagram", "youtube", "x", "tiktok"].includes(l.kind)).slice(0, 5);

  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3">
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 22 }}
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="pointer-events-auto flex h-14 items-end gap-2 rounded-2xl border border-line bg-paper/90 px-2 pb-2 shadow-[0_0_10px_3px_rgb(0_0_0/0.04)] backdrop-blur-3xl"
      >
        <Item mouseX={mouseX} label="Home" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <Home className="size-[45%]" />
        </Item>
        <span className="mb-2 h-6 w-px self-end bg-line" />
        {shown.map((l) => (
          <Item key={l.url} mouseX={mouseX} label={l.label} href={l.url}>
            <LinkIcon kind={l.kind} className="size-[42%]" />
          </Item>
        ))}
        <span className="mb-2 h-6 w-px self-end bg-line" />
        <Item mouseX={mouseX} label={theme === "dark" ? "Day mode" : "Night mode"} onClick={toggle}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid size-[45%] place-items-center"
            >
              {theme === "dark" ? <Sun className="size-full" /> : <Moon className="size-full" />}
            </motion.span>
          </AnimatePresence>
        </Item>
      </motion.nav>
    </div>
  );
}

function Item({
  mouseX,
  label,
  href,
  onClick,
  children,
}: {
  mouseX: MotionValue<number>;
  label: string;
  href?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseX, (x) => {
    const r = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return x - r.x - r.width / 2;
  });
  const size = useSpring(useTransform(distance, [-140, 0, 140], [40, 58, 40]), { mass: 0.1, stiffness: 170, damping: 13 });
  const cls =
    "group relative grid size-full place-items-center rounded-full border border-line bg-bg text-ink2 transition-colors hover:bg-card2 hover:text-ink";
  const tip = (
    <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-ink px-3 py-1.5 text-xs text-paper opacity-0 shadow-lg transition group-hover:opacity-100">
      {label}
    </span>
  );
  return (
    <motion.div ref={ref} style={{ width: size, height: size }}>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" aria-label={label} className={cls}>
          {children}
          {tip}
        </a>
      ) : (
        <button onClick={onClick} aria-label={label} className={cls}>
          {children}
          {tip}
        </button>
      )}
    </motion.div>
  );
}
