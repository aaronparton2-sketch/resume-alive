"use client";

import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, Moon, Printer, Sun } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

/** Floating buttons: light/dark, ask my resume, save as PDF. */
export function Toolbar({ onChat }: { onChat: () => void }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="no-print fixed bottom-4 right-4 z-40 flex gap-1 rounded-xl border border-line bg-paper/80 p-1 shadow-lg backdrop-blur-md sm:bottom-auto sm:top-4"
    >
      <Btn label={theme === "dark" ? "Light mode" : "Dark mode"} onClick={toggle}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid place-items-center"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </motion.span>
        </AnimatePresence>
      </Btn>
      <Btn label="Save as PDF" onClick={() => window.print()}>
        <Printer className="size-4" />
      </Btn>
      <Btn label="Ask my resume" onClick={onChat} accent>
        <MessageCircle className="size-4" />
        <span className="hidden text-xs font-semibold sm:inline">Ask me</span>
      </Btn>
    </motion.div>
  );
}

function Btn({ label, onClick, children, accent }: { label: string; onClick: () => void; children: ReactNode; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg px-2 transition ${
        accent ? "bg-accent text-on-accent hover:opacity-90" : "text-ink2 hover:bg-card2 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
