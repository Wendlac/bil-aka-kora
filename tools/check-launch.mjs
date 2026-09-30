// Liste ce qui reste à faire avant la mise en ligne : champs à compléter,
// ressources encore chargées depuis un service tiers, adresses fictives.
// Usage : node tools/check-launch.mjs   (code de sortie 1 s'il reste des points)

import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skipped = new Set(["node_modules", "dist", ".git", ".claude", "design-system", "sources", "tools", "images", "icons", "contenus"]);

const checks = [
  { re: /\[à compléter[^\]]*\]/g, label: "Champ à compléter" },
  { re: /fonts\.googleapis\.com\/css2/g, label: "Polices chargées depuis Google Fonts (à auto-héberger)" },
  { re: /cdnjs\.cloudflare\.com\/[^"]*gsap/g, label: "GSAP chargé depuis cdnjs (à copier dans js/vendor/)" },
  { re: /booking@bilakakora\.com/g, label: "Adresse booking fictive" },
  { re: /function sendSubscription\(\)/g, label: "Formulaire non branché sur un service d'envoi" },
];

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (/\.(html|js)$/.test(entry.name)) yield path;
  }
}

const found = new Map(); // libellé -> Set de fichiers
for await (const file of files(root)) {
  const text = await readFile(file, "utf8");
  for (const { re, label } of checks) {
    for (const match of text.matchAll(re)) {
      const key = label === "Champ à compléter" ? `${label} : ${match[0]}` : label;
      if (!found.has(key)) found.set(key, new Set());
      found.get(key).add(relative(root, file));
    }
  }
}

if (!found.size) {
  console.log("Prêt pour la mise en ligne.");
} else {
  console.log("Avant la mise en ligne :\n");
  for (const [label, where] of found) {
    const list = [...where];
    console.log(`  ${label}\n    ${list.length > 3 ? `${list.slice(0, 3).join(", ")} et ${list.length - 3} autre(s)` : list.join(", ")}`);
  }
  console.log(`\n${found.size} point(s) à régler.`);
  process.exitCode = 1;
}
