import Anthropic from "@anthropic-ai/sdk";
import { Resume } from "@/lib/schema";
import siteResume from "@/data/resume.json";

export const runtime = "nodejs";
export const maxDuration = 60;

// Guard rails so a public site can't be used as a free Claude proxy.
const MAX_TURNS = 12;
const MAX_CHARS = 600;
const MAX_RESUME_CHARS = 40_000;

type Turn = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("Chat needs ANTHROPIC_API_KEY in .env.local.", { status: 500 });
  }

  const body = (await req.json().catch(() => null)) as
    | { messages?: Turn[]; resume?: unknown }
    | null;
  const turns = (body?.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  if (!turns.length || turns[turns.length - 1].role !== "user") {
    return new Response("Ask a question first.", { status: 400 });
  }

  // The /preview and /example pages send its own resume. Everything else uses the site's resume.json.
  const parsed = Resume.safeParse(body?.resume);
  const resume = parsed.success ? parsed.data : siteResume;
  const resumeText = JSON.stringify(resume).slice(0, MAX_RESUME_CHARS);
  const first = (resume as { name: string }).name.split(" ")[0];

  const system = `You are the "Ask my resume" assistant on ${resume.name}'s personal website.
Answer visitors' questions about ${first} in first person, as ${first}, warmly and briefly (2-4 sentences).
Use ONLY the resume JSON below. If the answer isn't there, say you don't have that detail and suggest they get in touch${resume.email ? ` at ${resume.email}` : ""}.
Never invent facts, numbers, salaries or opinions. Politely decline anything unrelated to ${first}'s work and background.

<resume>
${resumeText}
</resume>`;

  const client = new Anthropic();
  const stream = client.messages.stream({
    model: process.env.CLAUDE_MODEL || "claude-opus-5-5",
    max_tokens: 2000,
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    system,
    messages: turns,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("Sorry, I can't help with that one."));
        }
      } catch {
        controller.enqueue(encoder.encode("\n\n(Something went wrong. Try again in a moment.)"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
