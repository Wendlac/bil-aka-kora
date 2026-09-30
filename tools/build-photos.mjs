// Génère la page Photos, en français (photos/index.html) et en anglais
// (en/photos/index.html), à partir de contenus/photos.json.
// Chaque vignette est un lien vers la grande image : sans JS, le lien l'ouvre ;
// avec JS, la visionneuse plein écran (js/app.js, initLightbox) prend le relais.
//
// Usage : node tools/build-photos.mjs

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { page, icon, esc } from "./lib/html.mjs";
import { LANGS, UI, section, inWords, capitalize, pick } from "./lib/i18n.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { sections } = JSON.parse(await readFile(join(root, "contenus", "photos.json"), "utf8"));
const count = sections.reduce((n, s) => n + s.photos.length, 0);

const T = {
  fr: {
    kicker: "Galerie",
    intro: "Sur scène et hors scène. Touchez une photo pour l'agrandir.",
    enlarge: "Agrandir :",
    credits: "Photographies :",
    pressAria: "Pour la presse",
    pressLabel: "Presse",
    pressCard: "Photos en haute définition, sur demande.",
    motionLabel: "En mouvement",
    motionCard: "Le Djongo se voit aussi en vidéo.",
    motionLink: "Voir les vidéos",
    dialog: "Photo agrandie",
    close: "Fermer",
    prev: "Photo précédente",
    next: "Photo suivante",
    pageTitle: "Photos : Bil Aka Kora sur scène et hors scène",
    pageDescription: (n) => `${capitalize(inWords(n, "fr"))} photos de Bil Aka Kora, en concert et en portrait.`,
  },
  en: {
    kicker: "Gallery",
    intro: "On stage and off stage. Tap a photo to enlarge it.",
    enlarge: "Enlarge:",
    credits: "Photos:",
    pressAria: "For the press",
    pressLabel: "Press",
    pressCard: "High-resolution photos, on request.",
    motionLabel: "In motion",
    motionCard: "Djongo is also something to watch.",
    motionLink: "Watch the videos",
    dialog: "Enlarged photo",
    close: "Close",
    prev: "Previous photo",
    next: "Next photo",
    pageTitle: "Photos: Bil Aka Kora on stage and off stage",
    pageDescription: (n) => `${capitalize(inWords(n, "en"))} photos of Bil Aka Kora, in concert and in portrait.`,
  },
};

function thumb(p, r, lang) {
  const alt = pick(p, "alt", lang);
  const th = Math.round((p.h / p.l) * 720);
  return `        <li><a href="${r}images/galerie/${p.fichier}.jpg" data-lightbox-item data-width="${p.l}" data-height="${p.h}"${p.credit ? ` data-credit="${esc(p.credit)}"` : ""} aria-label="${T[lang].enlarge} ${esc(alt)}">
          <img src="${r}images/galerie/${p.fichier}-720.jpg" width="720" height="${th}" loading="lazy" alt="${esc(alt)}">
        </a></li>`;
}

const credits = (photos) => [...new Set(photos.map((p) => p.credit).filter(Boolean))];

function build(lang) {
  const t = T[lang];
  const r = lang === "en" ? "../../" : "../";
  const body = `  <div class="container">
    <header class="page-head">
      <p class="label">${t.kicker}</p>
      <h1>Photos</h1>
      <p class="page-head__intro">${t.intro}</p>
    </header>
  </div>

${sections
  .map((s) => {
    const names = credits(s.photos);
    return `  <section class="section photo-section" aria-labelledby="${s.id}-title">
    <div class="container">
      <header class="section-head">
        <p class="label">${pick(s, "label", lang)}</p>
        <h2 id="${s.id}-title">${pick(s, "titre", lang)}</h2>
      </header>
      <ul class="gallery gallery--${s.photos.length % 3 === 0 ? "thirds" : "pairs"}">
${s.photos.map((p) => thumb(p, r, lang)).join("\n")}
      </ul>${names.length ? `
      <p class="meta photo-section__credit">${t.credits} ${names.join(", ")}.</p>` : ""}
    </div>
  </section>`;
  })
  .join("\n\n")}

  <section class="section" aria-label="${t.pressAria}">
    <div class="container card-grid">
      <div class="card card--stack">
        <p class="label">${t.pressLabel}</p>
        <p class="card__title">${t.pressCard}</p>
        <a class="link-arrow" href="${r}${section("pro", lang)}">${UI[lang].bookingLink} ${icon(r, "arrow-right")}</a>
      </div>
      <div class="card card--stack">
        <p class="label">${t.motionLabel}</p>
        <p class="card__title">${t.motionCard}</p>
        <a class="link-arrow" href="${r}${section("videos", lang)}">${t.motionLink} ${icon(r, "arrow-right")}</a>
      </div>
    </div>
  </section>

  <dialog class="lightbox" id="lightbox" aria-label="${t.dialog}">
    <div class="lightbox__stage" data-lightbox-close-zone>
      <figure class="lightbox__figure">
        <img class="lightbox__img" alt="">
        <figcaption class="lightbox__caption"><span class="lightbox__text"></span><span class="lightbox__count meta" aria-live="polite"></span></figcaption>
      </figure>
    </div>
    <button class="lightbox__btn lightbox__close" type="button" aria-label="${t.close}" data-lightbox-close>${icon(r, "x")}</button>
    <button class="lightbox__btn lightbox__prev" type="button" aria-label="${t.prev}" data-lightbox-prev>${icon(r, "caret-left")}</button>
    <button class="lightbox__btn lightbox__next" type="button" aria-label="${t.next}" data-lightbox-next>${icon(r, "caret-right")}</button>
  </dialog>`;

  return page({
    root: r,
    lang,
    title: t.pageTitle,
    description: t.pageDescription(count),
    image: `${r}images/galerie/${sections[0].photos[0].fichier}.jpg`,
    css: "photos.css",
    body,
  });
}

for (const lang of LANGS) {
  const dir = join(root, section("photos", lang));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "index.html"), build(lang));
  console.log(`Écrit : ${section("photos", lang)}index.html (${count} photos)`);
}
