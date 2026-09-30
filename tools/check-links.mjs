// Vérifie que chaque lien et chaque ressource internes de chaque page existent :
// href, src, srcset et <use href> relatifs, résolus depuis le dossier de la page.
// Vérifie aussi que chaque ancre (#id) visée dans la même page existe.
// Les liens externes (http, mailto) ne sont pas testés.
//
// Usage : node tools/check-links.mjs   (code de sortie 1 si un lien est cassé)

import { readdir, readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skipped = new Set(["node_modules", "dist", ".git", ".claude", "partials", "design-system", "tools", "css", "js", "icons", "images", "sources", "contenus"]);

async function* pages(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* pages(path);
    else if (entry.name === "index.html") yield path;
  }
}

const isExternal = (url) => /^(https?:|mailto:|tel:|data:|\/\/)/.test(url);

let broken = 0;
let checked = 0;
for await (const file of pages(root)) {
  const html = (await readFile(file, "utf8")).replace(/<!--[\s\S]*?-->/g, "");
  const dir = dirname(file);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const urls = [
    ...[...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) => m[1].split(",").map((part) => part.trim().split(/\s+/)[0])),
  ];
  for (const url of new Set(urls)) {
    if (isExternal(url)) continue;
    checked++;
    const [path, hash] = url.split("#");
    let ok;
    if (!path) {
      ok = !hash || ids.has(hash);
    } else {
      const target = resolve(dir, path);
      ok = existsSync(target) && (statSync(target).isFile() || existsSync(join(target, "index.html")));
    }
    if (!ok) {
      broken++;
      console.log(`  CASSÉ  ${relative(root, file)}  ->  ${url}`);
    }
  }
}

console.log(broken ? `\n${broken} lien(s) cassé(s) sur ${checked} vérifiés.` : `Aucun lien cassé (${checked} vérifiés).`);
process.exitCode = broken ? 1 : 0;
