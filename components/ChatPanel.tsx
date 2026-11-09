"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Resume } from "@/lib/schema";

type Turn = { role: "user" | "assistant"; content: string };

/** "Ask my resume": visitors chat with Claude, which only knows what's in the resume. */
export function ChatPanel({
  open,
  onClose,
  resume,
  sendResume,
}: {
  open: boolean;
  onClose: () => void;
  resume: Resume;
  /** true on /create and /preview, where the resume isn't the site's own resume.json */
  sendResume?: boolean;
}) {
  const first = resume.name.split(" ")[0];
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  const suggestions = [
    ...resume.faq.slice(0, 2).map((f) => f.q),
    resume.experience[0] ? `What did you do at ${resume.experience[0].company}?` : "What are you best at?",
  ];

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    const next: Turn[] = [...turns, { role: "user", content: q }];
    setTurns([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, resume: sendResume ? resume : undefined }),
      });
      if (!res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setTurns([...next, { role: "assistant", content: text }]);
      }
      if (!res.ok && !text) throw new Error("Chat failed");
    } catch {
      setTurns([...next, { role: "assistant", content: "Chat isn't switched on yet (no Claude key on this site)." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="fixed bottom-24 right-4 z-50 flex h-[min(560px,70vh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-line2 bg-card/95 shadow-2xl shadow-black/60 backdrop-blur-xl"
        >
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="grid size-8 place-items-center rounded-full bg-accent/15 text-accent">
              <Sparkles className="size-4" />
            </span>
            <div className="flex-1">
              <p className="font-display text-sm font-semibold">Ask my resume</p>
              <p className="text-xs text-ink3">Answers come only from {first}&apos;s resume</p>
            </div>
            <button onClick={onClose} aria-label="Close chat" className="text-ink3 hover:text-ink">
              <X className="size-4" />
            </button>
          </header>

          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto p-4">
            {turns.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-ink2">Hey, I&apos;m {first}&apos;s resume. Ask me anything about their work.</p>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="block w-full rounded-xl border border-line2 px-3 py-2 text-left text-sm text-ink2 transition hover:border-accent/60 hover:text-ink"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {turns.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  t.role === "user" ? "ml-auto bg-accent text-on-accent" : "bg-card2 text-ink"
                }`}
              >
                {t.content || <TypingDots />}
              </motion.div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2 border-t border-line p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={600}
              placeholder={`Ask about ${first}...`}
              className="flex-1 rounded-xl border border-line2 bg-bg2 px-3 py-2 text-sm outline-none placeholder:text-ink3 focus:border-accent/60"
            />
            <button
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="grid size-9 place-items-center rounded-xl bg-accent text-on-accent transition disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </button>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-ink3"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}
