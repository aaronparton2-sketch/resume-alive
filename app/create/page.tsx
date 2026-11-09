"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Copy, Download, FileUp, Loader2, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Resume } from "@/lib/schema";
import { STORAGE_KEY } from "@/lib/storage";

const STAGES = [
  "Reading your PDF",
  "Finding every job and date",
  "Tightening your bullet points",
  "Picking out your skills",
  "Writing your FAQ",
  "Laying out your site",
];

type State =
  | { kind: "idle" }
  | { kind: "working"; file: string }
  | { kind: "done"; resume: Resume }
  | { kind: "error"; message: string; needsPasscode?: boolean };

export default function Build() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [drag, setDrag] = useState(false);
  const [passcode, setPasscode] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setState({ kind: "working", file: file.name });
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        body,
        headers: passcode ? { "x-build-passcode": passcode } : undefined,
      });
      const json = await res.json();
      if (!res.ok) {
        setState({ kind: "error", message: json.error ?? "Something went wrong.", needsPasscode: res.status === 401 });
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(json.resume));
      } catch {}
      setState({ kind: "done", resume: json.resume });
    } catch {
      setState({ kind: "error", message: "Couldn't reach the server. Is it running?" });
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-clip px-4 pb-24 pt-20 sm:px-6">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[700px]">
        <div className="grid-bg absolute inset-0" />
        <div className="animate-aurora absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-accent2)_35%,transparent),transparent)] blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-2xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-line2 bg-card/60 px-3 py-1 text-xs text-ink2 backdrop-blur"
        >
          <Sparkles className="size-3.5 text-accent" /> Resume Alive
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-4xl font-bold tracking-tight sm:text-6xl"
        >
          Your resume, <span className="text-gradient">but alive.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mx-auto mt-4 max-w-md text-ink2">
          Drop in your PDF. Claude reads it and builds a website you can click, scroll and chat with.
        </motion.p>

        <div className="mt-10">
          <AnimatePresence mode="wait">
            {state.kind === "working" ? (
              <Working key="working" file={state.file} />
            ) : state.kind === "done" ? (
              <Done key="done" resume={state.resume} onAgain={() => setState({ kind: "idle" })} />
            ) : (
              <motion.div key="drop" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <button
                  onClick={() => input.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDrag(true);
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    const f = e.dataTransfer.files[0];
                    if (f) upload(f);
                  }}
                  className={`group relative w-full overflow-hidden rounded-3xl border-2 border-dashed p-10 transition sm:p-14 ${
                    drag ? "border-accent bg-accent/10" : "border-line2 bg-card/50 hover:border-accent/60"
                  }`}
                >
                  <motion.span
                    animate={{ y: drag ? -6 : 0 }}
                    className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent/15 text-accent transition group-hover:scale-110"
                  >
                    <FileUp className="size-7" />
                  </motion.span>
                  <p className="mt-5 font-display text-lg font-semibold">Drop your resume PDF here</p>
                  <p className="mt-1 text-sm text-ink3">or click to choose a file · up to 8 MB</p>
                </button>
                <input
                  ref={input}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(f);
                    e.target.value = "";
                  }}
                />
                {state.kind === "error" && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-[#ff5d6c]">{state.message}</p>
                    {state.needsPasscode && (
                      <label className="mx-auto flex max-w-xs items-center gap-2 rounded-xl border border-line2 bg-bg2 px-3 py-2">
                        <Lock className="size-4 text-ink3" />
                        <input
                          value={passcode}
                          onChange={(e) => setPasscode(e.target.value)}
                          placeholder="Passcode"
                          className="flex-1 bg-transparent text-sm outline-none"
                        />
                      </label>
                    )}
                  </div>
                )}
                <p className="mt-6 text-xs text-ink3">
                  Want to see one first?{" "}
                  <Link href="/example" className="text-ink2 underline-offset-4 hover:text-accent hover:underline">
                    Open the example resume
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

function Working({ file }: { file: string }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="glow-card rounded-3xl p-8 text-left sm:p-10"
    >
      <p className="mb-6 truncate text-sm text-ink3">{file}</p>
      <ol className="space-y-3">
        {STAGES.map((s, i) => (
          <motion.li
            key={s}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: i <= stage ? 1 : 0.3, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 text-sm"
          >
            <span
              className={`grid size-6 place-items-center rounded-full border ${
                i < stage ? "border-good/50 bg-good/15 text-good" : i === stage ? "border-accent/60 text-accent" : "border-line2 text-ink3"
              }`}
            >
              {i < stage ? <Check className="size-3.5" /> : i === stage ? <Loader2 className="size-3.5 animate-spin" /> : null}
            </span>
            <span className={i <= stage ? "text-ink" : "text-ink3"}>{s}</span>
          </motion.li>
        ))}
      </ol>
      <div className="mt-8 h-1 overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full bg-accent"
          initial={{ width: "4%" }}
          animate={{ width: `${((stage + 1) / STAGES.length) * 92}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

function Done({ resume, onAgain }: { resume: Resume; onAgain: () => void }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(resume, null, 2);
  function download() {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  const counts = [
    [resume.experience.length, "jobs"],
    [resume.projects.length, "projects"],
    [resume.skills.reduce((n, g) => n + g.items.length, 0), "skills"],
    [resume.links.length, "links"],
  ] as const;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="glow-card rounded-3xl p-8 text-left sm:p-10"
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className="grid size-12 place-items-center rounded-full bg-good/15 text-good"
      >
        <Check className="size-6" />
      </motion.span>
      <p className="mt-5 font-display text-2xl font-semibold">{resume.name}&apos;s site is ready</p>
      <p className="mt-1 text-ink2">{resume.headline}</p>
      <div className="mt-6 grid grid-cols-4 gap-2">
        {counts.map(([n, label]) => (
          <div key={label} className="rounded-xl border border-line bg-bg2 p-3 text-center">
            <p className="font-display text-xl font-bold">{n}</p>
            <p className="text-xs text-ink3">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/preview"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent shadow-[0_0_30px_-6px_var(--color-accent)]"
        >
          Open my site <ArrowRight className="size-4" />
        </Link>
        <button onClick={download} className="inline-flex items-center gap-2 rounded-full border border-line2 px-4 py-2.5 text-sm">
          <Download className="size-4" /> resume.json
        </button>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(json);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-line2 px-4 py-2.5 text-sm"
        >
          {copied ? <Check className="size-4 text-good" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy JSON"}
        </button>
        <button onClick={onAgain} className="px-2 text-sm text-ink3 hover:text-ink">
          Try another
        </button>
      </div>
      <p className="mt-6 text-xs text-ink3">
        To make it your real site: put this file in <code className="text-ink2">data/resume.json</code> and deploy. Add photos, videos and
        links to any job or project in that file.
      </p>
    </motion.div>
  );
}
