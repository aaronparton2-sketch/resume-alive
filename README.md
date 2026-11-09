# Resume Alive

**Your resume, but alive.** Drop in your PDF resume and Claude turns it into a website that still looks
like a resume (one clean sheet of paper) but hides the detail in dropdowns: click a job to see the bullet
points, skills and videos; click a project for screenshots; switch light and dark mode; save it as a PDF;
or ask the **"Ask my resume"** chat, which answers using only what's on your resume.

Every company and school gets its **real logo automatically**, pulled from their own website.

**Live demo:** https://aaron-parton-resume.vercel.app (Aaron's own resume) · [made-up example](https://aaron-parton-resume.vercel.app/example)

Free build from [@aaronautomates](https://www.instagram.com/aaronautomates/).

---

## What's in it

| Page | What it does |
|---|---|
| `/` | **Your site.** Renders `data/resume.json`. |
| `/create` | Drop a PDF here. Claude reads it and gives you a ready-made `resume.json`, plus a full-screen preview. |
| `/preview` | The site you just made at `/create` (kept in your browser only). |
| `/example` | A made-up person (Jordan Hale) with every section filled in, so you can see it all working. |

**Clickable bits:** icon buttons for email, phone and every link; jobs and schools that drop down;
project pop-ups with video and screenshots; coloured skill tags; FAQ dropdowns; numbers that count up;
a light/dark switch (or link straight to one with `?theme=dark`); Save as PDF, which prints with
every dropdown open; and the chat.

## Set it up

You need [Node.js](https://nodejs.org) 20+ and a Claude API key from
[console.anthropic.com](https://console.anthropic.com).

```bash
npm install
cp .env.example .env.local   # then paste your key into ANTHROPIC_API_KEY
npm run dev                  # open http://localhost:3000/create
```

1. Go to `/create` and drop in your resume PDF (takes 10-20 seconds).
2. Click **resume.json** to download what Claude made.
3. Put it in `data/resume.json`. Your site at `/` is now you.
4. Add the extras a PDF can't hold (see below), then deploy.

## Make it yours (all in `data/resume.json`)

- **Photo:** put a square image in `public/` and set `"avatar": "/me.jpg"`.
- **Videos:** add to `"videos"`, or to any job or project's `"media"` list:
  `{ "type": "youtube", "url": "https://www.youtube.com/watch?v=...", "caption": "Case study" }`.
  Types: `youtube`, `video` (an .mp4 link), `image`, `link`.
- **Company logos:** automatic. Claude writes down each employer's website (`"domain": "alcoa.com"`) and
  the site fetches the logo. Run `npm run logos` to save them all into `public/logos/` so your live site
  doesn't depend on anyone else's server. Wrong or missing logo? Fix the `domain`, or drop your own image in
  `public/` and set `"logo": "/company.png"`.
- **Your PDF:** put it in `public/` and set `"resumePdf": "/resume.pdf"`; a download button appears with the contact icons.
- **Colours:** change `--accent` (light mode) and the one under `[data-theme="dark"]` at the top of `app/globals.css`.

Every section hides itself when its list is empty, so you only show what you have.

## Put it online (free)

Push the folder to GitHub, then import it at [vercel.com/new](https://vercel.com/new). Add
`ANTHROPIC_API_KEY` under **Environment Variables**. On a public site, also set `BUILD_PASSCODE`, so
strangers can't use your `/create` page (and your Claude credit) to read their own PDFs.

## What it costs

Reading one resume costs a few cents of Claude credit. Each chat answer costs a fraction of a cent.
The chat is capped (short questions, short answers, the last 12 messages only) so a public site can't run
up a bill.

## How it works

- `app/api/parse/route.ts` sends the PDF to Claude with a strict JSON schema (`lib/schema.ts`), so the
  answer always fits the site. It's told to use only what's in the PDF and never invent numbers.
- `app/api/chat/route.ts` streams answers, using your resume as the only source.
- `lib/logos.mjs` finds a logo for a domain: first the icons the company's own homepage declares,
  then `/apple-touch-icon.png`, then Google's and DuckDuckGo's favicon services. (Not LinkedIn: it blocks
  automated access.) `app/api/logo` serves it live; `scripts/fetch-logos.mjs` saves it to disk.
- `components/ResumeSite.tsx` is the whole site, built from that one JSON file.

Built with Next.js, Tailwind CSS, Motion and the Claude API. MIT licence.
