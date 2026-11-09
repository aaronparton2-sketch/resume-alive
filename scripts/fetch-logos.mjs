// Saves every company and school logo in a resume into public/logos/ and points the resume at them,
// so your live site never depends on a third-party favicon service.
//
//   npm run logos                       -> data/resume.json
//   npm run logos -- data/example.json  -> any other resume file
//   add --force to re-download logos you already have
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { cleanDomain, extFor, findLogo } from "../lib/logos.mjs";

const args = process.argv.slice(2);
const force = args.includes("--force");
const file = args.find((a) => !a.startsWith("--")) || "data/resume.json";
const resume = JSON.parse(await readFile(file, "utf8"));
await mkdir("public/logos", { recursive: true });

const entries = [
  ...resume.experience.map((e) => ({ item: e, name: e.company })),
  ...resume.education.map((e) => ({ item: e, name: e.school })),
];

for (const { item, name } of entries) {
  const domain = cleanDomain(item.domain || item.url);
  const hasLocal = item.logo && !item.logo.startsWith("/api/logo");
  if (!domain) {
    console.log(`-  ${name}: no domain, add "domain": "company.com" to this entry`);
    continue;
  }
  if (hasLocal && !force) {
    console.log(`=  ${name}: keeping ${item.logo}`);
    continue;
  }
  const logo = await findLogo(domain);
  if (!logo) {
    console.log(`x  ${name}: nothing found for ${domain}`);
    continue;
  }
  const path = `/logos/${domain}.${extFor(logo.contentType)}`;
  await writeFile(`public${path}`, logo.buffer);
  item.logo = path;
  console.log(`+  ${name}: ${path} (from ${logo.source})`);
}

await writeFile(file, JSON.stringify(resume, null, 2) + "\n");
console.log(`\nSaved ${file}`);
