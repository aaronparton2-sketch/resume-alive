"use client";

import { motion } from "motion/react";
import { MessageCircle, Printer } from "lucide-react";
import type { ReactNode } from "react";

/** Top-right buttons: save as PDF, ask my resume. (Day/night lives in the bottom dock.) */
export function Toolbar({ onChat }: { onChat: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="no-print fixed right-4 top-4 z-40 flex gap-1 rounded-xl border border-line bg-paper/80 p-1 shadow-lg backdrop-blur-md"
    >
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
