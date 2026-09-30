// Génère, en français et en anglais, la discographie et une page par album
// à partir de contenus/albums.json :
//   musique/index.html, musique/<slug>/index.html
//   en/music/index.html, en/music/<slug>/index.html
// Les blocs communs sont laissés en marqueurs : lancer ensuite
// tools/build-pages.mjs (ou tools/build.mjs, qui enchaîne tout).
//
// Usage : node tools/build-albums.mjs

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { page, icon, esc, strip } from "./lib/html.mjs";
import { LANGS, section, inWords, capitalize, longDate, pick } from "./lib/i18n.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { albums } = JSON.parse(await readFile(join(root, "contenus", "albums.json"), "utf8"));

const T = {
  fr: {
    kicker: "Discographie",
    title: "Musique",
    intro: (n, first, last) => `${capitalize(inWords(n, "fr"))} albums, de <em>${first.titre}</em> en ${first.annee} à <em>${last.titre}</em> en ${last.annee}.`,
    pageTitle: "Musique : la discographie de Bil Aka Kora",
    pageDescription: (n, first, last) => `Les ${inWords(n, "fr")} albums de Bil Aka Kora, de ${first.titre} (${first.annee}) à ${last.titre} (${last.annee}) : pochettes, titres et écoute.`,
    listen: "Écouter",
    listenAria: "Écouter et voir",
    listenCard: "Toute la discographie, en ligne.",
    liveLabel: "Sur scène",
    liveCard: "Le Djongo se vit aussi en live.",
    liveLink: "Voir les vidéos",
    back: "Discographie",
    album: "Album",
    tracks: (n) => `${n} titres`,
    trackHeading: "Titres",
    award: "Distinction",
    older: "Album précédent",
    newer: "Album suivant",
    otherAlbums: "Autres albums",
    coverAlt: (a) => (a.slug === "fulu" ? "Pochette de l'album Fulu : Bil Aka Kora, en blanc, tend la main devant des ailes de papillon gravées." : `Pochette de l'album ${a.titre}`),
    coverPending: (a) => `Pochette de l'album ${a.titre} (à venir)`,
    albumTitle: (a) => `${a.titre} (${a.annee}), album de Bil Aka Kora`,
    albumDescription: (a, text) => `${a.titre}, album de Bil Aka Kora sorti en ${a.annee}. ${text}`,
  },
  en: {
    kicker: "Discography",
    title: "Music",
    intro: (n, first, last) => `${capitalize(inWords(n, "en"))} albums, from <em>${first.titre}</em> in ${first.annee} to <em>${last.titre}</em> in ${last.annee}.`,
    pageTitle: "Music: the discography of Bil Aka Kora",
    pageDescription: (n, first, last) => `The ${inWords(n, "en")} albums of Bil Aka Kora, from ${first.titre} (${first.annee}) to ${last.titre} (${last.annee}): covers, tracklists and listening.`,
    listen: "Listen",
    listenAria: "Listen and watch",
    listenCard: "The whole discography, online.",
    liveLabel: "On stage",
    liveCard: "Djongo is best experienced live.",
    liveLink: "Watch the videos",
    back: "Discography",
    album: "Album",
    tracks: (n) => `${n} tracks`,
    trackHeading: "Tracks",
    award: "Award",
    older: "Previous album",
    newer: "Next album",
    otherAlbums: "Other albums",
    coverAlt: (a) => (a.slug === "fulu" ? "Cover of the album Fulu: Bil Aka Kora, dressed in white, holds out his hand in front of engraved butterfly wings." : `Cover of the album ${a.titre}`),
    coverPending: (a) => `Cover of the album ${a.titre} (coming soon)`,
    albumTitle: (a) => `${a.titre} (${a.annee}), an album by Bil Aka Kora`,
    albumDescription: (a, text) => `${a.titre}, an album by Bil Aka Kora released in ${a.annee}. ${text}`,
  },
};

/** "4:03" -> secondes */
const seconds = (duration) => {
  const [m, s] = duration.split(":").map(Number);
  return m * 60 + s;
};

function cover(album, r, t, { size, lazy = true, alt = "" }) {
  if (!album.pochette) {
    return `<div class="cover-placeholder" role="img" aria-label="${esc(t.coverPending(album))}">${album.titre}</div>`;
  }
  const base = `${r}images/covers/${album.pochette}`;
  const sizes = size === "small" ? "(min-width: 60rem) 22rem, (min-width: 30rem) 45vw, 100vw" : "(min-width: 48rem) 40vw, 100vw";
  return `<img class="cover" data-fade src="${base}.jpg" srcset="${base}-600.jpg 600w, ${base}.jpg 1200w" sizes="${sizes}" width="1200" height="1200"${lazy ? ' loading="lazy"' : ""} alt="${esc(alt)}">`;
}

/* ---- Discographie ------------------------------------------------------- */

function discography(lang) {
  const t = T[lang];
  const r = lang === "en" ? "../../" : "../";
  const cards = albums
    .map(
      (album) => `      <li class="album-card">
        <a class="album-card__media" href="${album.slug}/" tabindex="-1" aria-hidden="true">${cover(album, r, t, { size: "small" })}</a>
        <h2 class="album-card__title"><a href="${album.slug}/">${album.titre}</a></h2>
        <div class="album-card__row"><span class="meta">${album.annee}</span><a class="link-arrow album-card__listen" href="${album.slug}/" data-listen-open="listen">${t.listen} ${icon(r, "arrow-right")}</a></div>
      </li>`
    )
    .join("\n");

  const first = albums[albums.length - 1];
  const last = albums[0];
  const body = `  <div class="container">
    <header class="page-head">
      <p class="label">${t.kicker}</p>
      <h1>${t.title}</h1>
      <p class="page-head__intro">${t.intro(albums.length, first, last)}</p>
    </header>

    <ul class="album-grid discography">
${cards}
    </ul>
  </div>

  <section class="section" aria-label="${t.listenAria}">
    <div class="container card-grid">
      <div class="card card--stack">
        <p class="label">${t.listen}</p>
        <p class="card__title">${t.listenCard}</p>
        <button class="btn btn--solid" type="button" data-listen-open="listen"><span>${t.listen}</span></button>
      </div>
      <div class="card card--stack">
        <p class="label">${t.liveLabel}</p>
        <p class="card__title">${t.liveCard}</p>
        <a class="link-arrow" href="${r}${section("videos", lang)}">${t.liveLink} ${icon(r, "arrow-right")}</a>
      </div>
    </div>
  </section>`;

  return page({
    root: r,
    lang,
    title: t.pageTitle,
    description: t.pageDescription(albums.length, first, last),
    image: `${r}images/covers/${last.pochette}.jpg`,
    css: "music.css",
    body,
  });
}

/* ---- Page album --------------------------------------------------------- */

function albumPage(album, index, lang) {
  const t = T[lang];
  const r = lang === "en" ? "../../../" : "../../";
  const older = albums[index + 1];
  const newer = albums[index - 1];
  const total = album.titres.reduce((sum, [, d]) => sum + seconds(d), 0);
  const text = pick(album, "texte", lang);
  const awards = pick(album, "distinctions", lang);

  const facts = [
    album.dateISO ? longDate(album.dateISO, lang) : String(album.annee),
    album.titres.length ? t.tracks(album.titres.length) : null,
    total ? `${Math.round(total / 60)} min` : null,
    album.label,
  ].filter(Boolean);

  const tracks = album.titres.length
    ? `
    <section class="album__tracks" aria-labelledby="tracks">
      <h2 class="label" id="tracks">${t.trackHeading}</h2>
      <ol class="tracklist">
${album.titres
  .map(([name, duration, noteFr, noteEn]) => {
    const note = lang === "en" ? noteEn ?? noteFr : noteFr;
    return `        <li><span><span class="tracklist__title">${name}</span>${note ? `<span class="tracklist__lang">${note}</span>` : ""}</span><span class="meta">${duration}</span></li>`;
  })
  .join("\n")}
      </ol>
    </section>`
    : "";

  const extras = awards.length
    ? `
    <div class="card-grid album__extras">
        <div class="card card--stack">
          <p class="label">${t.award}</p>
          <p class="card__title">${awards.join(", ")}</p>
        </div>
    </div>`
    : "";

  const navCard = (other, label) =>
    `        <a class="card card--stack album-nav__card" href="../${other.slug}/">
          <span class="label">${label}</span>
          <span class="card__title">${other.titre}</span>
          <span class="meta">${other.annee}</span>
        </a>`;
  const nav = [older ? navCard(older, t.older) : "", newer ? navCard(newer, t.newer) : ""].filter(Boolean);

  const body = `  <article class="container album" aria-labelledby="album-title">
    <a class="link-arrow link-arrow--back" href="../">${icon(r, "arrow-left")} ${t.back}</a>

    <div class="album__hero">
      ${cover(album, r, t, { size: "large", lazy: false, alt: t.coverAlt(album) })}
      <div class="album__body">
        <p class="label">${t.album}, ${album.annee}</p>
        <h1 id="album-title">${album.titre}</h1>
        <ul class="meta inline-list">${facts.map((f) => `<li>${f}</li>`).join("")}</ul>
        ${text.map((p) => `<p>${p}</p>`).join("\n        ")}
        <button class="btn btn--solid" type="button" data-listen-open="listen"><span>${t.listen}</span></button>
      </div>
    </div>
${tracks}${extras}

    <nav class="card-grid album-nav" aria-label="${t.otherAlbums}">
${nav.join("\n")}
    </nav>
  </article>`;

  return page({
    root: r,
    lang,
    title: t.albumTitle(album),
    description: t.albumDescription(album, strip(text[0])),
    image: album.pochette ? `${r}images/covers/${album.pochette}.jpg` : `${r}images/photos/scene-tunique-rouge.jpg`,
    css: "music.css",
    ogType: "music.album",
    body,
  });
}

for (const lang of LANGS) {
  const dir = join(root, section("musique", lang));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "index.html"), discography(lang));
  for (const [index, album] of albums.entries()) {
    await mkdir(join(dir, album.slug), { recursive: true });
    await writeFile(join(dir, album.slug, "index.html"), albumPage(album, index, lang));
  }
  console.log(`Écrit : ${section("musique", lang)} (discographie et ${albums.length} albums)`);
}
