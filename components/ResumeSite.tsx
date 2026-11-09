"use client";

import { MotionConfig, motion, useInView } from "motion/react";
import { ArrowUpRight, ChevronDown, Download, Globe, Mail } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { logoFor, type Resume } from "@/lib/schema";
import { ChatPanel } from "./ChatPanel";
import { GitHubActivity } from "./GitHubActivity";
import { ProjectCover } from "./ProjectCover";
import { LinkIcon } from "./icons";
import { TechIcon } from "./TechIcon";
import { Toolbar } from "./Toolbar";
import { CountUp, MediaView, Modal, YouTubeLite, youtubeId } from "./ui";

/**
 * A resume that looks like a resume: one sheet of paper, clean type, and
 * dropdowns that hide the detail until someone clicks. Feed it any Resume
 * (data/resume.json, or what Claude pulled out of a PDF).
 */
export function ResumeSite({ resume, sendResume = false }: { resume: Resume; sendResume?: boolean }) {
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <MotionConfig reducedMotion="user">
    <div className="px-3 py-10 sm:px-6 sm:py-16">
      <Toolbar onChat={() => setChatOpen((o) => !o)} />
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="sheet sheet-stack relative z-0 mx-auto max-w-[760px] rounded-2xl px-5 py-8 sm:px-12 sm:py-12"
      >
        <Header resume={resume} />
        <About resume={resume} />
        {resume.experience.length > 0 && <Work resume={resume} />}
        {resume.projects.length > 0 && <Projects resume={resume} />}
        {resume.github && (
          <Section title="Open source" id="github">
            <GitHubActivity user={resume.github} />
          </Section>
        )}
        {resume.education.length > 0 && <EducationList resume={resume} />}
        {resume.skills.length > 0 && <Skills resume={resume} />}
        {resume.videos.length > 0 && <Videos resume={resume} />}
        {resume.faq.length > 0 && <Faq resume={resume} />}
        <Footer resume={resume} />
      </motion.article>
      <p className="no-print mt-8 text-center font-mono text-[11px] text-ink3">
        Built with{" "}
        <a href="https://github.com/aaronparton2-sketch/resume-alive" target="_blank" rel="noreferrer" className="hover:text-accent">
          Resume Alive
        </a>
      </p>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} resume={resume} sendResume={sendResume} />
    </div>
    </MotionConfig>
  );
}

/* ---------- building blocks ---------- */

function Tag({ children, tone }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px] leading-none ${
        tone ?? "border-line bg-card2 text-ink2"
      }`}
    >
      {children}
    </span>
  );
}

/** A tool name with its logo. Lifts and glows on hover. */
function TechTag({ name, size = "sm" }: { name: string; size?: "xs" | "sm" | "md" }) {
  const big = size === "md";
  const xs = size === "xs";
  return (
    <span
      className={`group/tt inline-flex items-center rounded-lg border border-line bg-card2/60 font-mono text-ink2 transition duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-paper hover:text-ink hover:shadow-[0_6px_16px_-6px_rgb(0_0_0/0.25)] ${
        big ? "gap-2 px-2.5 py-1.5 text-[12px]" : xs ? "shrink-0 gap-1 whitespace-nowrap px-1.5 py-0.5 text-[10.5px]" : "gap-1.5 px-2 py-1 text-[11px]"
      }`}
    >
      <span className="transition-transform duration-300 group-hover/tt:-rotate-6 group-hover/tt:scale-125">
        <TechIcon name={name} className={big ? "size-4" : xs ? "size-3" : "size-3.5"} />
      </span>
      {name}
    </span>
  );
}

function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-9 scroll-mt-8">
      <h2 className="mb-3 text-xl font-bold tracking-tight text-ink">{title}</h2>
      {children}
    </section>
  );
}

/** Click the row, the detail slides open. Content stays in the page so printing shows everything. */
function Dropdown({ header, children, hint }: { header: ReactNode; children?: ReactNode; hint?: string }) {
  const [open, setOpen] = useState(false);
  if (!children) return <div className="py-2.5">{header}</div>;
  return (
    <div className="group/dd -mx-3 rounded-xl transition-colors hover:bg-card2/70">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start gap-2 px-3 py-2.5 text-left">
        <div className="min-w-0 flex-1">{header}</div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="chevron no-print mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border border-line text-ink3 transition-colors group-hover/dd:border-accent/50 group-hover/dd:text-accent"
          title={hint}
        >
          <ChevronDown className="size-3.5" />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="expand-body overflow-hidden"
        aria-hidden={!open}
      >
        <div className="px-3 pb-4 pt-1">{children}</div>
      </motion.div>
    </div>
  );
}

function Logo({ item, name, size = "size-9" }: { item: { logo: string | null; domain: string | null; url?: string | null }; name: string; size?: string }) {
  const src = logoFor(item);
  const [failed, setFailed] = useState(false);
  return (
    <span className={`${size} grid shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-white text-[11px] font-semibold text-ink3`}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-contain p-1" onError={() => setFailed(true)} />
      ) : (
        <span className="text-[#555]">{name.replace(/[^A-Za-z ]/g, "").split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
      )}
    </span>
  );
}

/* ---------- sections ---------- */

// Each contact button fills with that brand's colour on hover / tap
const BRAND: Record<string, string> = {
  email: "hover:bg-[#EA4335] hover:border-[#EA4335] focus-visible:bg-[#EA4335]",
  phone: "hover:bg-[#16a34a] hover:border-[#16a34a] focus-visible:bg-[#16a34a]",
  whatsapp: "hover:bg-[#25D366] hover:border-[#25D366] focus-visible:bg-[#25D366]",
  linkedin: "hover:bg-[#0A66C2] hover:border-[#0A66C2] focus-visible:bg-[#0A66C2]",
  github: "hover:bg-[#24292f] hover:border-[#24292f] focus-visible:bg-[#24292f] dark:hover:bg-[#f0f6fc] dark:hover:border-[#f0f6fc] dark:hover:text-[#24292f]",
  instagram: "hover:border-[#dc2743] hover:bg-[linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)] focus-visible:bg-[#dc2743]",
  youtube: "hover:bg-[#FF0000] hover:border-[#FF0000] focus-visible:bg-[#FF0000]",
  x: "hover:bg-black hover:border-black focus-visible:bg-black",
  tiktok: "hover:bg-black hover:border-black focus-visible:bg-black",
  website: "hover:bg-[var(--accent)] hover:border-[var(--accent)] focus-visible:bg-[var(--accent)]",
  pdf: "hover:bg-[var(--accent)] hover:border-[var(--accent)] focus-visible:bg-[var(--accent)]",
  other: "hover:bg-[var(--accent)] hover:border-[var(--accent)] focus-visible:bg-[var(--accent)]",
};

function Header({ resume }: { resume: Resume }) {
  const initials = resume.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  const buttons: { href: string; label: string; icon: ReactNode; kind: string }[] = [];
  if (resume.email) buttons.push({ href: `mailto:${resume.email}`, label: `Email ${resume.email}`, icon: <Mail className="size-3.5" />, kind: "email" });
  if (resume.phone)
    buttons.push({ href: `tel:${resume.phone.replace(/\s/g, "")}`, label: `Call ${resume.phone}`, icon: <LinkIcon kind="phone" className="size-3.5" />, kind: "phone" });
  resume.links
    .filter((l) => !(l.kind === "email" && resume.email) && !(l.kind === "phone" && resume.phone))
    .forEach((l) => buttons.push({ href: l.url, label: l.label, icon: <LinkIcon kind={l.kind} className="size-3.5" />, kind: l.kind }));
  if (resume.resumePdf) buttons.push({ href: resume.resumePdf, label: "Download PDF resume", icon: <Download className="size-3.5" />, kind: "pdf" });

  return (
    <header className="flex items-start justify-between gap-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-ink sm:text-3xl">{resume.name}</h1>
        <p className="mt-1.5 max-w-md font-mono text-[13px] leading-relaxed text-ink2">{resume.headline}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {resume.location && (
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(resume.location)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[11px] text-ink3 hover:text-accent"
          >
            <Globe className="size-3" /> {resume.location}
          </a>
        )}
        {resume.availability && (
          <p className="font-mono text-[11px] text-ink2">
            <span className="text-ink3">Status:</span> {resume.availability}
          </p>
        )}
        </div>
        {buttons.length > 0 && (
          <div className="no-print mt-3 flex flex-wrap gap-1.5">
            {buttons.map((b) => (
              <a
                key={b.href}
                href={b.href}
                target={b.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                aria-label={b.label}
                className={`group/btn relative grid size-8 place-items-center rounded-lg border border-line text-ink2 transition duration-200 hover:-translate-y-0.5 hover:text-white hover:shadow-md focus-visible:text-white active:scale-95 ${BRAND[b.kind] ?? BRAND.website}`}
              >
                {b.icon}
                <span className="pointer-events-none absolute -bottom-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-paper px-2 py-1 font-mono text-[10px] text-ink opacity-0 shadow-sm transition group-hover/btn:opacity-100">
                  {b.label}
                </span>
              </a>
            ))}
          </div>
        )}
        {/* Printed copies get the contact details as text instead of icons */}
        <p className="hidden font-mono text-[11px] text-ink2 print:block">
          {[resume.email, resume.phone, ...resume.links.filter((l) => l.kind !== "email").map((l) => l.url)].filter(Boolean).join("  ·  ")}
        </p>
      </div>
      <div className="size-24 shrink-0 overflow-hidden rounded-xl border border-line bg-card2 sm:size-28">
        {resume.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resume.avatar} alt={resume.name} className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-2xl font-bold text-accent">{initials}</span>
        )}
      </div>
    </header>
  );
}

/** About: stats always showing, the paragraph folds away behind a chevron. */
function About({ resume }: { resume: Resume }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="mt-9">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="group/ab mb-3 flex w-full items-center justify-between text-left">
        <h2 className="text-xl font-bold tracking-tight text-ink">About</h2>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="chevron no-print grid size-6 place-items-center rounded-md border border-line text-ink3 transition-colors group-hover/ab:border-accent/50 group-hover/ab:text-accent"
        >
          <ChevronDown className="size-3.5" />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="expand-body overflow-hidden"
      >
        <p className="font-mono text-[13px] leading-relaxed text-ink2">{resume.about}</p>
      </motion.div>
      {resume.stats.length > 0 && <Stats resume={resume} />}
    </section>
  );
}

function Stats({ resume }: { resume: Resume }) {
  return (
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
      {resume.stats.slice(0, 4).map((s) => (
        <p key={s.label} className="font-mono text-[12px] text-ink3">
          <span className="mr-1.5 text-base font-bold text-accent">
            <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} />
          </span>
          {s.label}
        </p>
      ))}
    </div>
  );
}

function Work({ resume }: { resume: Resume }) {
  return (
    <Section title="Work Experience" id="work">
      <div className="space-y-1">
        {resume.experience.map((job) => {
          const hasMore = job.highlights.length > 0 || job.skills.length > 0 || job.media.length > 0;
          return (
            <Dropdown
              key={`${job.company}-${job.start}`}
              hint="Show details"
              header={
                <div className="flex gap-3">
                  <Logo item={job} name={job.company} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                        {job.role}
                        {job.badge && <Tag>{job.badge}</Tag>}
                      </p>
                      <p className="font-mono text-[12px] tabular-nums text-ink3">
                        {job.start} - {job.end}
                      </p>
                    </div>
                    <p className="font-mono text-[13px] text-ink2">
                      {job.company}
                      {job.location ? <span className="text-ink3"> · {job.location}</span> : null}
                    </p>
                    <p className="mt-1 font-mono text-[12px] leading-relaxed text-ink3">{job.summary}</p>
                  </div>
                </div>
              }
            >
              {hasMore ? (
                <div className="space-y-3 pl-12">
                  {job.highlights.length > 0 && (
                    <ul className="space-y-1.5">
                      {job.highlights.map((h) => (
                        <li key={h} className="flex gap-2 font-mono text-[12px] leading-relaxed text-ink2">
                          <span className="mt-[7px] size-1 shrink-0 rounded-full bg-accent" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                  {job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.map((s) => (
                        <TechTag key={s} name={s} />
                      ))}
                    </div>
                  )}
                  {job.media.map((m) => (
                    <MediaView key={m.url} media={m} />
                  ))}
                  {job.url && (
                    <a href={job.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-[12px] text-accent hover:underline">
                      {job.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} <ArrowUpRight className="size-3" />
                    </a>
                  )}
                </div>
              ) : undefined}
            </Dropdown>
          );
        })}
      </div>
    </Section>
  );
}

/** A project card: the cover comes alive on hover (or when scrolled into view on a phone). */
function ProjectCard({ project: p, onOpen }: { project: Resume["projects"][number]; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [touch, setTouch] = useState(false);
  const inView = useInView(ref, { amount: 0.7 });
  useEffect(() => setTouch(window.matchMedia("(hover: none)").matches), []);
  const active = hovered || (touch && inView);
  return (
    <motion.button
      ref={ref}
      whileHover={{ y: -2 }}
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="group flex flex-col overflow-hidden rounded-xl border border-line text-left transition-colors hover:border-accent/50"
    >
      <ProjectCover media={p.media} active={active} />
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-semibold leading-snug text-ink">{p.title}</p>
          <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-ink3 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
        </div>
        <p className="mt-1 line-clamp-2 font-mono text-[12px] leading-relaxed text-ink2">{p.description}</p>
        <div className="mt-auto flex flex-nowrap gap-1 overflow-hidden pt-2">
          {p.tags.slice(0, 3).map((t) => (
            <TechTag key={t} name={t} size="xs" />
          ))}
        </div>
      </div>
    </motion.button>
  );
}

function Projects({ resume }: { resume: Resume }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const project = openIdx === null ? null : resume.projects[openIdx];
  return (
    <Section title="Projects" id="projects">
      <div className="grid gap-2 sm:grid-cols-2">
        {resume.projects.map((p, i) => (
          <ProjectCard key={p.title} project={p} onOpen={() => setOpenIdx(i)} />
        ))}
      </div>
      <Modal open={!!project} onClose={() => setOpenIdx(null)}>
        {project && (
          <div className="space-y-4">
            <div>
              <p className="pr-10 text-2xl font-bold">{project.title}</p>
              {project.dates && <p className="font-mono text-[12px] text-ink3">{project.dates}</p>}
            </div>
            <p className="font-mono text-[13px] leading-relaxed text-ink2">{project.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((t) => (
                <TechTag key={t} name={t} size="md" />
              ))}
            </div>
            {project.media.map((m) => (
              <MediaView key={m.url} media={m} />
            ))}
            {project.url && (
              <a href={project.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent">
                Open project <ArrowUpRight className="size-4" />
              </a>
            )}
          </div>
        )}
      </Modal>
    </Section>
  );
}

function EducationList({ resume }: { resume: Resume }) {
  return (
    <Section title="Education" id="education">
      <div className="space-y-1">
        {resume.education.map((e) => (
          <Dropdown
            key={e.school + e.degree}
            header={
              <div className="flex gap-3">
                <Logo item={e} name={e.school} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="font-semibold text-ink">{e.school}</p>
                    {(e.start || e.end) && <p className="font-mono text-[12px] tabular-nums text-ink3">{[e.start, e.end].filter(Boolean).join(" - ")}</p>}
                  </div>
                  <p className="font-mono text-[13px] text-ink2">{e.degree}</p>
                </div>
              </div>
            }
          >
            {e.details.length > 0 ? (
              <ul className="space-y-1 pl-12">
                {e.details.map((d) => (
                  <li key={d} className="flex gap-2 font-mono text-[12px] text-ink2">
                    <span className="mt-[7px] size-1 shrink-0 rounded-full bg-accent" />
                    {d}
                  </li>
                ))}
              </ul>
            ) : undefined}
          </Dropdown>
        ))}
      </div>
    </Section>
  );
}

function Skills({ resume }: { resume: Resume }) {
  return (
    <Section title="Skills" id="skills">
      <div className="space-y-3">
        {resume.skills.map((g) => (
          <div key={g.group} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-4">
            <p className="w-36 shrink-0 pt-1.5 font-mono text-[12px] text-ink3">{g.group}</p>
            <div className="flex flex-wrap gap-1.5">
              {g.items.map((s, i) => (
                <motion.span
                  key={s}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 20 }}
                >
                  <TechTag name={s} size="md" />
                </motion.span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Videos({ resume }: { resume: Resume }) {
  return (
    <Section title="Videos" id="videos">
      <div className="no-print grid gap-3 sm:grid-cols-2">
        {resume.videos.map((v, i) => (
          <YouTubeLite key={v.url + i} url={v.url} title={v.title} />
        ))}
      </div>
      <ul className="hidden font-mono text-[12px] print:block">
        {resume.videos.map((v) => (
          <li key={v.url}>
            {v.title}: {youtubeId(v.url) ? `youtu.be/${youtubeId(v.url)}` : v.url}
          </li>
        ))}
      </ul>
    </Section>
  );
}

const STAR_ROWS = [
  { key: "situation", letter: "S", label: "Situation", tone: "bg-blue-500" },
  { key: "task", letter: "T", label: "Task", tone: "bg-violet-500" },
  { key: "action", letter: "A", label: "Action", tone: "bg-amber-500" },
  { key: "result", letter: "R", label: "Result", tone: "bg-emerald-500" },
] as const;

function Faq({ resume }: { resume: Resume }) {
  const hasStar = resume.faq.some((f) => f.star);
  return (
    <Section title={hasStar ? "Interview answers" : "Quick answers"} id="faq">
      {hasStar && (
        <p className="-mt-1 mb-2 font-mono text-[11px] text-ink3">
          The questions an interviewer would ask, answered in STAR format. Click one to open it.
        </p>
      )}
      <div>
        {resume.faq.map((f) => (
          <Dropdown
            key={f.q}
            header={
              <div>
                <p className="text-[15px] font-semibold text-ink">{f.q}</p>
                <p className="mt-0.5 font-mono text-[12px] leading-relaxed text-ink3">{f.a}</p>
              </div>
            }
          >
            {f.star ? (
              <ol className="space-y-2.5">
                {STAR_ROWS.map((r) => (
                  <li key={r.key} className="flex gap-3">
                    <span className={`grid size-6 shrink-0 place-items-center rounded-md text-[11px] font-bold text-white ${r.tone}`} title={r.label}>
                      {r.letter}
                    </span>
                    <p className="font-mono text-[12px] leading-relaxed text-ink2">
                      <span className="font-semibold text-ink">{r.label}. </span>
                      {f.star![r.key]}
                    </p>
                  </li>
                ))}
              </ol>
            ) : undefined}
          </Dropdown>
        ))}
      </div>
    </Section>
  );
}

function Footer({ resume }: { resume: Resume }) {
  if (!resume.email) return null;
  return (
    <footer className="no-print mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
      <p className="font-mono text-[12px] text-ink3">Like what you see?</p>
      <a
        href={`mailto:${resume.email}`}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:opacity-90"
      >
        <Mail className="size-4" /> Get in touch
      </a>
    </footer>
  );
}
