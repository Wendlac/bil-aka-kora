// Assemble les SVG de icons/src en un seul sprite : icons/sprite.svg.
// ph-*.svg : Phosphor, graisse Light (MIT)
// si-*.svg : Simple Icons, logos de plateformes (CC0)
// Chaque fichier devient un <symbol id="i-{nom}">, utilisé ainsi :
//   <svg class="icon" aria-hidden="true"><use href="icons/sprite.svg#i-play"></use></svg>
//
// Usage : node tools/build-sprite.mjs

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "icons", "src");

const files = (await readdir(srcDir)).filter((f) => f.endsWith(".svg")).sort();
const symbols = [];

for (const file of files) {
  const svg = await readFile(join(srcDir, file), "utf8");
  const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
  const inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .trim();
  const id = "i-" + basename(file, ".svg").replace(/^(ph|si)-/, "");
  symbols.push(`  <symbol id="${id}" viewBox="${viewBox}" fill="currentColor">${inner}</symbol>`);
}

const sprite = `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join("\n")}\n</svg>\n`;
await writeFile(join(root, "icons", "sprite.svg"), sprite);
console.log(`Écrit : icons/sprite.svg (${symbols.length} icônes)`);
