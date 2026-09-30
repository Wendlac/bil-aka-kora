// Construit une version autonome de design-system/index.html :
// les feuilles CSS du projet sont insérées en ligne et les chemins
// des photos rendus relatifs à la sortie.
//
// Usage : node tools/build-styleguide.mjs <dossier-de-sortie> [--fragment]
//   --fragment  retire doctype/html/head/body (format attendu pour un Artifact)

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(process.argv[2] ?? join(root, "dist", "design-system"));
const fragment = process.argv.includes("--fragment");

let html = await readFile(join(root, "design-system", "index.html"), "utf8");

// 0. Polices et GSAP : la page du site les sert en local, la version autonome
//    (fichier unique, sans dossiers fonts/ ni js/vendor/) les charge depuis leurs CDN.
html = html
  .replace('<link rel="stylesheet" href="../css/fonts.css">', () =>
    `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Goudy+Bookletter+1911&family=Mona+Sans:ital,wdth,wght@0,75..125,400..600;1,75..125,400..600&display=swap">`)
  .replace('<script src="../js/vendor/gsap.min.js"></script>', () =>
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>');

// 1. CSS du projet en ligne
const linkRe = /<link rel="stylesheet" href="\.\.\/(css\/[\w-]+\.css)">/g;
for (const [tag, path] of [...html.matchAll(linkRe)]) {
  const css = await readFile(join(root, path), "utf8");
  html = html.replace(tag, () => `<style>\n/* ${path} */\n${css}</style>`);
}

// 1 bis. JS du projet en ligne
const scriptRe = /<script src="\.\.\/(js\/[\w-]+\.js)"><\/script>/g;
for (const [tag, path] of [...html.matchAll(scriptRe)]) {
  const js = await readFile(join(root, path), "utf8");
  html = html.replace(tag, () => `<script>\n/* ${path} */\n${js}</script>`);
}

// 2. Photos copiées à côté de la page
const photos = [...new Set([...html.matchAll(/\.\.\/sources\/photos\/([\w.-]+)/g)].map((m) => m[1]))];
await mkdir(join(outDir, "photos"), { recursive: true });
for (const name of photos) {
  await copyFile(join(root, "sources", "photos", name), join(outDir, "photos", name));
}
html = html.replaceAll("../sources/photos/", "photos/");

// 3. Sprite d'icônes en ligne (une page autonome ne peut pas charger
//    un sprite externe de manière fiable)
const sprite = (await readFile(join(root, "icons", "sprite.svg"), "utf8"))
  .replace("<svg ", '<svg style="display:none" aria-hidden="true" ');
html = html.replaceAll("../icons/sprite.svg#", "#").replace(/<body>/i, `<body>\n${sprite}`);

// 4. Format fragment
if (fragment) {
  html = html
    .replace(/<!doctype html>\s*/i, "")
    .replace(/<\/?html[^>]*>\s*/gi, "")
    .replace(/<\/?head>\s*/gi, "")
    .replace(/<meta [^>]*>\s*/gi, "")
    .replace(/<\/?body>\s*/gi, "");
}

await writeFile(join(outDir, "index.html"), html);
console.log(`Écrit : ${join(outDir, "index.html")} (${photos.length} photos)`);
