// Génère la page Vidéos, en français (videos/index.html) et en anglais
// (en/videos/index.html), à partir de contenus/videos.json.
// Chaque vidéo est une façade : vignette hébergée sur le site, lecteur YouTube
// (youtube-nocookie) chargé seulement au clic, par js/app.js.
// Dans une section au nombre impair de vidéos, la première occupe toute la
// largeur : jamais de vidéo seule en fin de grille.
//
// Usage : node tools/build-videos.mjs

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { page, icon, esc } from "./lib/html.mjs";
import { LANGS, UI, section, inWords, pick } from "./lib/i18n.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(await readFile(join(root, "contenus", "videos.json"), "utf8"));
const count = data.sections.reduce((n, s) => n + s.videos.length, 0);

const T = {
  fr: {
    kicker: "Vidéos",
    title: "En images",
    intro: (n) => `Live, clips et rencontres : ${inWords(n, "fr")} vidéos choisies sur la chaîne officielle. Le lecteur ne se charge qu'au clic.`,
    play: "Lire la vidéo :",
    and: "avec",
    furtherAria: "Aller plus loin",
    channelCard: "Toutes les vidéos sur la chaîne officielle.",
    channelLink: "Ouvrir la chaîne",
    pageTitle: "Vidéos : Bil Aka Kora en live, en clips et en rencontres",
    pageDescription: (n) => `Live, clips et rencontres de Bil Aka Kora : ${inWords(n, "fr")} vidéos, de Dibayagui avec le Castagnole Community Choir à Annou avec Magic System.`,
  },
  en: {
    kicker: "Videos",
    title: "On screen",
    intro: (n) => `Live, music videos and encounters: ${inWords(n, "en")} videos chosen from the official channel. The player only loads when you press play.`,
    play: "Play video:",
    and: "with",
    furtherAria: "Go further",
    channelCard: "Every video on the official channel.",
    channelLink: "Open the channel",
    pageTitle: "Videos: Bil Aka Kora live, in music videos and encounters",
    pageDescription: (n) => `Live, music videos and encounters with Bil Aka Kora: ${inWords(n, "en")} videos, from Dibayagui with the Castagnole Community Choir to Annou with Magic System.`,
  },
};

function video(v, featured, lang, r) {
  const t = T[lang];
  const guest = pick(v, "avec", lang);
  const label = guest ? `${v.titre}, ${t.and} ${guest}` : v.titre;
  const titleLang = v.langueTitre && v.langueTitre !== lang ? ` lang="${v.langueTitre}"` : "";
  return `        <figure class="video${featured ? " video--feature" : ""}">
          <a class="video__frame" href="https://www.youtube.com/watch?v=${v.id}" data-youtube-id="${v.id}" aria-label="${t.play} ${esc(label)}">
            <img src="${r}images/videos/${v.id}.jpg" width="960" height="540" loading="lazy" alt="">
            <span class="video__play" aria-hidden="true">${icon(r, "play")}</span>
          </a>
          <figcaption class="video__caption">
            <span class="video__title"${titleLang}>${v.titre}</span>
            <span class="meta">${guest ? `${UI[lang].with} ${guest}, ` : ""}${v.annee}</span>
          </figcaption>
        </figure>`;
}

function build(lang) {
  const t = T[lang];
  const ui = UI[lang];
  const r = lang === "en" ? "../../" : "../";
  const sections = data.sections
    .map((s) => {
      const odd = s.videos.length % 2 === 1;
      return `  <section class="section video-section" aria-labelledby="${s.id}-title">
    <div class="container">
      <header class="section-head">
        <p class="label">${pick(s, "label", lang)}</p>
        <h2 id="${s.id}-title">${pick(s, "titre", lang)}</h2>
      </header>
      <div class="video-grid">
${s.videos.map((v, i) => video(v, odd && i === 0, lang, r)).join("\n")}
      </div>
    </div>
  </section>`;
    })
    .join("\n\n");

  const body = `  <div class="container">
    <header class="page-head">
      <p class="label">${t.kicker}</p>
      <h1>${t.title}</h1>
      <p class="page-head__intro">${t.intro(count)}</p>
    </header>
  </div>

${sections}

  <section class="section" aria-label="${t.furtherAria}">
    <div class="container card-grid">
      <div class="card card--stack">
        <p class="label">YouTube</p>
        <p class="card__title">${t.channelCard}</p>
        <a class="link-arrow" href="${data.chaine}" target="_blank" rel="noopener">${t.channelLink} ${icon(r, "arrow-up-right", " data-external")}</a>
      </div>
      <div class="card card--stack">
        <p class="label">${ui.programmers}</p>
        <p class="card__title">${ui.bookTitle}</p>
        <p>${ui.programmersText}</p>
        <a class="link-arrow" href="${r}${section("pro", lang)}">${ui.bookingLink} ${icon(r, "arrow-right")}</a>
      </div>
    </div>
  </section>`;

  return page({
    root: r,
    lang,
    title: t.pageTitle,
    description: t.pageDescription(count),
    image: `${r}images/videos/${data.sections[0].videos[0].id}.jpg`,
    css: "videos.css",
    ogType: "video.other",
    body,
  });
}

for (const lang of LANGS) {
  const dir = join(root, section("videos", lang));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "index.html"), build(lang));
  console.log(`Écrit : ${section("videos", lang)}index.html`);
}
