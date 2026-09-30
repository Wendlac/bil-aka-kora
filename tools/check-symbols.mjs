// Vérifie qu'aucun symbole banni n'apparaît dans les fichiers du projet.
// Liste et remplacements : voir contenus/textes.md, « Règles d'écriture ».
// Usage : node tools/check-symbols.mjs   (code de sortie 1 si un symbole est trouvé)

import { readdir, readFile } from "node:fs/promises";
import { join, extname, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const banned = /[\u2014\u2013\u00B7\u2022\u2192\u2197\u2026]/g;
const names = {
  "\u2014": "tiret cadratin",
  "\u2013": "tiret demi-cadratin",
  "\u00B7": "point médian",
  "\u2022": "puce",
  "\u2192": "flèche",
  "\u2197": "flèche",
  "\u2026": "points de suspension",
};
const extensions = new Set([".html", ".css", ".js", ".mjs", ".md", ".json", ".svg", ".txt"]);
const skipped = new Set(["node_modules", "dist", ".git", "sources"]);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (extensions.has(extname(entry.name))) yield path;
  }
}

let count = 0;
for await (const file of walk(root)) {
  const lines = (await readFile(file, "utf8")).split("\n");
  lines.forEach((line, i) => {
    for (const match of line.matchAll(banned)) {
      count++;
      console.log(`${relative(root, file)}:${i + 1}  ${names[match[0]]}  ${line.trim().slice(0, 90)}`);
    }
  });
}

console.log(count ? `\n${count} symbole(s) banni(s) trouvé(s).` : "Aucun symbole banni.");
process.exitCode = count ? 1 : 0;
