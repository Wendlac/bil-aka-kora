// Assemble les blocs communs (partials/) dans chaque page du site.
//
// Dans une page, un bloc est délimité par deux marqueurs :
//   <!-- @partial footer -->
//   ...contenu régénéré à chaque passage...
//   <!-- @end footer -->
// Le script remplace ce qui se trouve entre les deux par le bloc de la langue
// de la page : partials/footer.en.html pour une page sous en/, sinon
// partials/footer.html. Variables résolues selon l'emplacement de la page :
//   {{root}}              chemin vers la racine : "", "../", "../../"
//   {{home}}              accueil dans la langue de la page
//   {{fr}} / {{en}}       même page dans l'autre langue (ou elle-même : "./")
//   {{lang:fr}}           aria-current="true" si la page est en français (idem {{lang:en}})
//   {{current:rubrique}}  aria-current sur le lien de la rubrique en cours
//                         (clé française : musique, concerts, pro, etc.)
//                         "page" pour la page même, "true" pour une sous-page
//   {{s:rubrique}}        adresse de la rubrique dans la langue de la page (ex. {{s:musique}} -> en/music/)
//
// Usage :
//   node tools/build-pages.mjs           met les pages à jour
//   node tools/build-pages.mjs --check   signale les pages en retard (code 1), sans écrire

import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { toEnglishPath, toFrenchPath, section } from "./lib/i18n.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");

// Dossiers qui ne sont pas des pages du site.
const skipped = new Set(["node_modules", "dist", ".git", ".claude", "partials", "design-system", "tools", "css", "js", "icons", "images", "sources", "contenus"]);

async function* pages(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* pages(path);
    else if (entry.name === "index.html") yield path;
  }
}

const partialCache = new Map();
async function partial(name, lang) {
  const key = `${name}.${lang}`;
  if (!partialCache.has(key)) {
    const localized = join(root, "partials", `${name}.${lang}.html`);
    const file = lang !== "fr" && existsSync(localized) ? localized : join(root, "partials", `${name}.html`);
    partialCache.set(key, (await readFile(file, "utf8")).trimEnd());
  }
  return partialCache.get(key);
}

const toUrl = (segments) => segments.map((s) => s + "/").join("");

function context(file) {
  // "en/music/fulu/index.html" -> ["en", "music", "fulu"]
  const segments = relative(root, dirname(file)).split(sep).filter(Boolean);
  const lang = segments[0] === "en" ? "en" : "fr";
  const inLang = lang === "en" ? segments.slice(1) : segments;
  const frPath = lang === "en" ? toFrenchPath(inLang) : inLang;
  const rootPath = "../".repeat(segments.length);
  return {
    lang,
    root: rootPath,
    home: lang === "en" ? rootPath + "en/" : rootPath,
    fr: lang === "fr" ? "./" : rootPath + toUrl(frPath),
    en: lang === "en" ? "./" : rootPath + "en/" + toUrl(toEnglishPath(frPath)),
    section: frPath[0] ?? "",
    isSectionHome: frPath.length === 1,
  };
}

function render(template, ctx) {
  return template
    .replace(/\{\{root\}\}/g, ctx.root)
    .replace(/\{\{home\}\}/g, ctx.home)
    .replace(/\{\{fr\}\}/g, ctx.fr)
    .replace(/\{\{en\}\}/g, ctx.en)
    .replace(/\{\{lang:(\w+)\}\}/g, (_, lang) => (lang === ctx.lang ? ' aria-current="true"' : ""))
    .replace(/\{\{s:([\w-]+)\}\}/g, (_, key) => ctx.root + section(key, ctx.lang))
    .replace(/\{\{current:([\w-]+)\}\}/g, (_, key) => {
      if (key !== ctx.section) return "";
      return ctx.isSectionHome ? ' aria-current="page"' : ' aria-current="true"';
    });
}

const markerRe = /([ \t]*)<!-- @partial ([\w-]+) -->\n[\s\S]*?\n[ \t]*<!-- @end \2 -->/g;

let stale = 0;
let written = 0;
for await (const file of pages(root)) {
  const html = await readFile(file, "utf8");
  const ctx = context(file);
  const replacements = [];
  for (const match of html.matchAll(markerRe)) {
    const [, indent, name] = match;
    const body = render(await partial(name, ctx.lang), ctx)
      .split("\n")
      .map((line) => (line ? indent + line : line))
      .join("\n");
    replacements.push([match[0], `${indent}<!-- @partial ${name} -->\n${body}\n${indent}<!-- @end ${name} -->`]);
  }
  let next = html;
  for (const [from, to] of replacements) next = next.replace(from, () => to);

  const name = relative(root, file);
  if (next === html) {
    console.log(`  à jour   ${name}`);
    continue;
  }
  stale++;
  if (checkOnly) console.log(`  EN RETARD ${name}`);
  else {
    await writeFile(file, next);
    written++;
    console.log(`  écrit    ${name}`);
  }
}

if (checkOnly && stale) {
  console.log(`\n${stale} page(s) à régénérer : node tools/build-pages.mjs`);
  process.exitCode = 1;
} else if (!checkOnly) {
  console.log(`\n${written} page(s) mise(s) à jour.`);
}
