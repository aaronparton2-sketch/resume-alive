import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { Extracted, toResume } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB is plenty for a resume

const SYSTEM = `You turn a resume PDF into the JSON for a personal website.

Rules:
- Use only what is in the PDF. Never invent employers, dates, numbers, links or achievements.
- headline: one punchy line in the person's own words (e.g. "Product designer who ships").
- roles: 2-4 short titles that rotate under the name (e.g. "Designer", "Builder").
- about: 2-3 warm, first-person sentences built from their summary and history.
- experience: newest first. summary = one sentence. highlights = the bullet points, tightened, keeping every number they wrote.
- domain (jobs and education): the organisation's main website domain, e.g. "alcoa.com" or "uwa.edu.au". Use a URL from the PDF if there is one; otherwise the official domain only if you are confident it is that exact organisation; otherwise "". It is used to fetch their logo.
- badge (jobs): one or two words worth tagging, only if the PDF says it: "Remote", "Hybrid", "Contract", "Part-time", "Internship". Else "".
- skills on each job: tools or skills that bullet list actually mentions.
- stats: only numbers that are in the PDF (years, team size, revenue, users). If there are none, return an empty list.
- links: every URL or handle in the PDF (LinkedIn, GitHub, portfolio, email as a mailto: link).
- skills (top level): group them into 2-5 sensible groups.
- faq: 3-4 questions a recruiter would ask, answered only from the PDF, first person.
- Any text field you have nothing for: use an empty string "". Never write "N/A".
- availability: only if the PDF says it (e.g. "Open to work"), else "".
- stats: value is the bare number. prefix is what goes before it ("$", or ""). suffix is the unit after it ("%", " yrs", "M", "+", or ""). label is short and lowercase ("road upgrade delivered").
- Dates as written, short form ("Mar 2023", "2021", "Present").`;

export async function POST(req: Request) {
  const passcode = process.env.BUILD_PASSCODE;
  if (passcode && req.headers.get("x-build-passcode") !== passcode) {
    return Response.json({ error: "Wrong passcode." }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Add ANTHROPIC_API_KEY to .env.local (see .env.example), then restart." },
      { status: 500 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return Response.json({ error: "That isn't a PDF." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "PDF is over 8 MB." }, { status: 400 });
  }

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const client = new Anthropic();

  try {
    const response = await client.messages.parse({
      model: process.env.CLAUDE_MODEL || "claude-opus-5-5",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: zodOutputFormat(Extracted) },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data },
            },
            { type: "text", text: "Turn this resume into the website JSON." },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return Response.json({ error: "Claude declined to read this file." }, { status: 422 });
    }
    if (response.stop_reason === "max_tokens" || !response.parsed_output) {
      return Response.json(
        { error: "Couldn't read that resume cleanly. Try again or a shorter PDF." },
        { status: 422 },
      );
    }
    return Response.json({ resume: toResume(response.parsed_output) });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Busy right now, try again in a minute." }, { status: 429 });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "Your ANTHROPIC_API_KEY was rejected." }, { status: 500 });
    }
    if (err instanceof Anthropic.APIError) {
      return Response.json({ error: `Claude error: ${err.message}` }, { status: 502 });
    }
    throw err;
  }
}
