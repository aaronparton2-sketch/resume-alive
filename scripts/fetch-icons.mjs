// Saves a logo for every skill and project tag in a resume into public/tech/,
// and records them in data/tech-icons.json so the site shows logos next to the names.
//
//   npm run icons                       -> data/resume.json
//   npm run icons -- data/example.json  -> any other resume file (adds to the same list)
//   add --force to re-download icons you already have
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extOf, fileKey, findIcon } from "../lib/icons.mjs";

const args = process.argv.slice(2);
const force = args.includes("--force");
const files = args.filter((a) => !a.startsWith("--"));
if (!files.length) files.push("data/resume.json");

const MANIFEST = "data/tech-icons.json";
const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, "utf8")) : {};
await mkdir("public/tech", { recursive: true });

const names = new Set();
for (const f of files) {
  const r = JSON.parse(await readFile(f, "utf8"));
  r.skills.forEach((g) => g.items.forEach((s) => names.add(s)));
  r.projects.forEach((p) => p.tags.forEach((t) => names.add(t)));
  r.experience.forEach((e) => e.skills.forEach((s) => names.add(s)));
}

for (const name of [...names].sort()) {
  const key = fileKey(name);
  if (manifest[key] && !force) {
    console.log(`=  ${name}`);
    continue;
  }
  const icon = await findIcon(name);
  if (!icon) {
    manifest[key] = null; // remembered as "no logo", shows a neat monogram instead
    console.log(`x  ${name}: no logo found (shows initials)`);
    continue;
  }
  const light = `/tech/${key}.${extOf(icon.light.contentType)}`;
  await writeFile(`public${light}`, icon.light.buffer);
  let dark = null;
  if (icon.dark) {
    dark = `/tech/${key}-dark.${extOf(icon.dark.contentType)}`;
    await writeFile(`public${dark}`, icon.dark.buffer);
  }
  manifest[key] = { light, dark, invert: icon.invertInDark };
  console.log(`+  ${name}: ${light}${dark ? " + dark" : ""}${icon.invertInDark ? " (inverted in dark mode)" : ""} from ${icon.source}`);
}

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(MANIFEST, JSON.stringify(sorted, null, 2) + "\n");
console.log(`\nSaved ${MANIFEST}`);
