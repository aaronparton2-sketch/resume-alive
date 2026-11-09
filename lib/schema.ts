import { z } from "zod";

/**
 * The one shape everything runs on.
 * - Claude fills it from a PDF (app/api/parse)
 * - The site renders it (components/ResumeSite)
 * - You can edit data/resume.json by hand any time
 * Every field is required but can be null or an empty list, so Claude's
 * structured output always matches it exactly.
 */

export const LINK_KINDS = [
  "linkedin",
  "github",
  "youtube",
  "instagram",
  "x",
  "tiktok",
  "whatsapp",
  "phone",
  "website",
  "email",
  "other",
] as const;

export const Media = z.object({
  type: z.enum(["youtube", "video", "image", "link"]),
  url: z.string(),
  caption: z.string().nullable(),
  /** "scroll" = a tall image that scrolls top to bottom when you hover the project card */
  hover: z.enum(["scroll"]).nullable().optional(),
});

export const Link = z.object({
  label: z.string(),
  url: z.string(),
  kind: z.enum(LINK_KINDS),
});

export const Experience = z.object({
  company: z.string(),
  role: z.string(),
  start: z.string(),
  end: z.string(),
  location: z.string().nullable(),
  url: z.string().nullable(),
  /** e.g. "alcoa.com". Used to fetch the logo when logo is empty. */
  domain: z.string().nullable(),
  logo: z.string().nullable(),
  /** Small coloured tag next to the role, e.g. "Remote", "Contract" */
  badge: z.string().nullable(),
  summary: z.string(),
  highlights: z.array(z.string()),
  skills: z.array(z.string()),
  media: z.array(Media),
});

export const Project = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string().nullable(),
  dates: z.string().nullable(),
  tags: z.array(z.string()),
  media: z.array(Media),
});

export const Education = z.object({
  school: z.string(),
  degree: z.string(),
  start: z.string().nullable(),
  end: z.string().nullable(),
  domain: z.string().nullable(),
  logo: z.string().nullable(),
  details: z.array(z.string()),
});

export const Resume = z.object({
  name: z.string(),
  headline: z.string(),
  roles: z.array(z.string()),
  location: z.string().nullable(),
  availability: z.string().nullable(),
  avatar: z.string().nullable(),
  about: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  resumePdf: z.string().nullable(),
  /** GitHub username: shows the contribution graph and total stars */
  github: z.string().nullable().optional(),
  links: z.array(Link),
  stats: z.array(
    z.object({
      value: z.number(),
      prefix: z.string().nullable(),
      suffix: z.string().nullable(),
      label: z.string(),
    }),
  ),
  experience: z.array(Experience),
  projects: z.array(Project),
  education: z.array(Education),
  skills: z.array(z.object({ group: z.string(), items: z.array(z.string()) })),
  videos: z.array(z.object({ title: z.string(), url: z.string() })),
  /** Interview questions. a = the short answer; star = optional STAR breakdown shown in the dropdown */
  faq: z.array(
    z.object({
      q: z.string(),
      a: z.string(),
      star: z
        .object({ situation: z.string(), task: z.string(), action: z.string(), result: z.string() })
        .nullable()
        .optional(),
    }),
  ),
});

export type Resume = z.infer<typeof Resume>;

/**
 * The smaller shape Claude fills from a PDF. Strict JSON mode has a size limit,
 * so: no nullable fields ("" means empty) and no media, logos or videos
 * (a PDF never has them). toResume() turns it into a full Resume.
 */
export const Extracted = z.object({
  name: z.string(),
  headline: z.string(),
  roles: z.array(z.string()),
  location: z.string(),
  availability: z.string(),
  about: z.string(),
  email: z.string(),
  phone: z.string(),
  links: z.array(Link),
  stats: z.array(z.object({ value: z.number(), prefix: z.string(), suffix: z.string(), label: z.string() })),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      start: z.string(),
      end: z.string(),
      location: z.string(),
      url: z.string(),
      domain: z.string(),
      badge: z.string(),
      summary: z.string(),
      highlights: z.array(z.string()),
      skills: z.array(z.string()),
    }),
  ),
  projects: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      url: z.string(),
      dates: z.string(),
      tags: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string(),
      start: z.string(),
      end: z.string(),
      domain: z.string(),
      details: z.array(z.string()),
    }),
  ),
  skills: z.array(z.object({ group: z.string(), items: z.array(z.string()) })),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
});

export type Extracted = z.infer<typeof Extracted>;

const orNull = (s: string) => (s.trim() ? s.trim() : null);

/** "https://www.alcoa.com/au" -> "alcoa.com" */
export function domainOf(s: string | null | undefined): string | null {
  if (!s) return null;
  const d = s.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d) ? d : null;
}

/** Where a logo comes from when the resume doesn't have a saved one. */
export function logoFor(item: { logo: string | null; domain: string | null; url?: string | null }): string | null {
  if (item.logo) return item.logo;
  const d = domainOf(item.domain) ?? domainOf(item.url ?? null);
  return d ? `/api/logo?domain=${d}` : null;
}

export function toResume(x: Extracted): Resume {
  return {
    name: x.name,
    headline: x.headline,
    roles: x.roles,
    location: orNull(x.location),
    availability: orNull(x.availability),
    avatar: null,
    about: x.about,
    email: orNull(x.email),
    phone: orNull(x.phone),
    resumePdf: null,
    github: x.links.map((l) => l.url.match(/github\.com\/([A-Za-z0-9-]+)\/?$/)?.[1]).find(Boolean) ?? null,
    links: x.links,
    stats: x.stats.map((s) => ({ value: s.value, prefix: orNull(s.prefix), suffix: orNull(s.suffix), label: s.label })),
    experience: x.experience.map((e) => ({
      ...e,
      location: orNull(e.location),
      url: orNull(e.url),
      domain: domainOf(e.domain) ?? domainOf(e.url),
      badge: orNull(e.badge),
      logo: null,
      media: [],
    })),
    projects: x.projects.map((p) => ({ ...p, url: orNull(p.url), dates: orNull(p.dates), media: [] })),
    education: x.education.map((e) => ({ ...e, start: orNull(e.start), end: orNull(e.end), domain: domainOf(e.domain), logo: null })),
    skills: x.skills,
    videos: [],
    faq: x.faq,
  };
}
export type Media = z.infer<typeof Media>;
export type Link = z.infer<typeof Link>;
