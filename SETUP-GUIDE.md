# Resume Alive: setup guide (written for an AI assistant to follow)

You are helping someone who may never have used GitHub, Vercel or code. Give ONE step at a time, say exactly what to click, and wait for them to say "done" before the next step. If they get stuck, ask for a screenshot.

## Goal

Their own live resume website at `something.vercel.app`, built from their PDF resume.

## Steps

1. **Claude API key.** Send them to https://console.anthropic.com. They sign up, add a few dollars of credit under **Billing**, then go to **API Keys** and click **Create Key**. They copy the key (starts with `sk-ant-`) and keep it somewhere private. Tell them never to paste it anywhere public.

2. **Deploy.** Send them to this link:
   https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Faaronparton2-sketch%2Fresume-alive&env=ANTHROPIC_API_KEY,BUILD_PASSCODE&project-name=my-resume&repository-name=my-resume
   - They click **Continue with GitHub** and make a free account if asked.
   - They paste their key into **ANTHROPIC_API_KEY**.
   - They type any word into **BUILD_PASSCODE** (this stops strangers using their upload page).
   - They click **Deploy** and wait about a minute.

3. **Make their resume.** They open their new site's address with `/create` on the end (e.g. `my-resume.vercel.app/create`), type the passcode if asked, and drop in their resume PDF. After about 15 seconds they click **Open my site** to see it.

4. **Make it permanent.** On the finished screen they click **resume.json** to download the file. Then, in their new GitHub repo (`my-resume`):
   - open the `data` folder, click `resume.json`, click the pencil icon (Edit);
   - select everything, delete it, and paste in the contents of the downloaded file;
   - click **Commit changes**.
   Vercel redeploys by itself in about a minute, and their homepage is now their resume.

5. **Extras (optional).** Edit `data/resume.json` the same way to add:
   - a photo: upload a square image to `public/`, then set `"avatar": "/their-photo.jpg"`;
   - videos on a job or project: add `{ "type": "youtube", "url": "...", "caption": "..." }` to its `"media"` list;
   - their GitHub graph: set `"github": "their-username"`.

## Good to know

- Every section hides itself when it's empty.
- If a company logo is wrong, change that job's `"domain"` to the company's real website (e.g. `"canva.com"`).
- The chat bubble only answers from the resume. It costs a fraction of a cent per answer on their key.
- "Save as PDF" (printer icon) prints a clean copy for job portals.
